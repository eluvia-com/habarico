module Habarico
  module Controller
    extend ActiveSupport::Concern

    included do
      include Eluvia::ErrorHandler
      include Eluvia::PaginationHandler
      include Habarico::Authenticatable

      # Order matters: `set_list_pagination` hands the `order_by` parameter to `set_pagination`,
      # which refuses anything that is not `field:direction`, so the validator below only ever
      # sees well-formed entries and is left with the field names (HAB-915).
      before_action :set_list_pagination, only: [:index]
      before_action :validate_order_by_param, only: [:index]
      before_action :set_record, only: %i[show update destroy]
    end

    # *************************************************************************
    # Actions
    # *************************************************************************

    def index
      read_allowed = context.can?(:read)
      # Without read permission listing is forbidden outright (same as the Python backend), unless
      # the resource explicitly opts into ID-based reads via `allow_read_by_id`.
      raise Eluvia::Errors::Forbidden.new('List not allowed.') unless read_allowed || definition.allow_read_by_id

      resolved = Habarico::FilterParamsResolver.new(definition).resolve(params, read_allowed: read_allowed)
      @records = Habarico::RecordsQuery.new(definition, context).list(
        resolved.filters,
        search_query: resolved.search_query, order_by: @order_by, page: @page, limit: @limit, padding: @padding
      )

      render_list(resolved.search_query)
    end

    def show
      # `show` requires can_read, same as index. `allow_read_by_id` opts into ID-based access
      # without read permission (e.g. cross-service references) - possession of the ID is treated
      # as the credential, while `policy_scope` in `set_record` still bounds what is reachable.
      raise Eluvia::Errors::Forbidden.new('Show not allowed.') unless context.can?(:read) || definition.allow_read_by_id

      render_detail
    end

    def create
      raise Eluvia::Errors::Forbidden.new('Create not allowed.') unless context.can?(:create)
      raise Eluvia::Errors::BadRequest.new('Create not possible.') unless is_create_possible?
      @record = definition.model.new(record_params_resolver.resolve(params).merge(complement_record_params))
      if @record.save
        render_detail
      else
        raise record_params_resolver.validation_error(@record)
      end
    end

    def update
      raise Eluvia::Errors::Forbidden.new('Update not allowed.') unless context.can?(:update)
      raise Eluvia::Errors::BadRequest.new('Update not possible.') unless is_update_possible?(@record)
      if @record.update(record_params_resolver.resolve(params).merge(complement_record_params))
        render_detail
      else
        raise record_params_resolver.validation_error(@record)
      end
    end

    def destroy
      raise Eluvia::Errors::Forbidden.new('Delete not allowed.') unless context.can?(:delete)
      raise Eluvia::Errors::BadRequest.new('Delete not possible.') unless is_delete_possible?(@record)
      @record.destroy
      render_detail
    end

    protected

    # *************************************************************************
    # Serializer
    # *************************************************************************

    # `fields` comes straight from the query string and is kept out of `Habarico::FilterParamsResolver`,
    # since it controls serialization rather than which records are returned.
    def record_serializer(search_query: nil)
      Habarico::Serializers::RecordSerializer.new(
        definition: definition,
        resource_name: controller_name,
        context_for: method(:_context),
        trigger_action_for: method(:get_trigger_action_schema),
        fields: params[:fields],
        search_query: search_query
      )
    end

    # *************************************************************************
    # Renderers
    # *************************************************************************

    def render_detail
      render json: record_serializer.serialize(:detail, @record)
    end

    def render_list(search_query = nil)
      list_serializer = record_serializer(search_query: search_query)
      render json: {
        meta: {
          limit: @limit,
          offset: @offset,
          total_count: @records.total_count,
        },
        objects: @records.map { |record| list_serializer.serialize(:list, record) }
      }
    end

    # Renders an `ActionResult`: `message`, `state` and `trigger_action` live under `meta`, and the
    # response's own `data` is merged next to it. This is the shape the contract prescribes and the
    # only one the frontend reads - it looks at `resp.data.meta` and nowhere else.
    def render_response(response)
      meta = {
        'message' => response.message,
        'state' => response.state,
        'trigger_action' => build_action_schema(response.action)&.as_json&.deep_compact(compactable: Habarico::Serializers::RecordSerializer::COMPACTABLE)
      }.compact
      render json: { 'meta' => meta }.merge(response.data.presence || {})
    end

    def get_trigger_action_schema(_record)
      nil # override in subclasses to return an ActionSchema instance
    end

    # Builds the complete `Habarico::ActionSchema` of `action` - a declared action's name or a
    # `Habarico::Action` - for `get_trigger_action_schema` or `Habarico::Response.new(action: ...)`.
    # `record` builds the context from that record, `record_pk` and `reference` retarget the action.
    def build_action_schema(action, record: nil, record_pk: nil, reference: nil)
      resource_path = Habarico::ResourceService.instance.get_resource_path(controller_name)
      definition.trigger_action_schema_generator
                .new(definition, resource_path)
                .generate(action, record ? _context(record) : context, record_pk: record_pk, reference: reference)
    end

    def validate_order_by_param
      Habarico::OrderByParamsResolver.new(definition, tiebreaker: list_order_by_tiebreaker).resolve(params)
    end

    # *************************************************************************
    # Pagination
    # *************************************************************************

    # Resolves the page size of `index` and hands it to the base library (HAB-946).
    #
    # Each limit is passed as a keyword only when habarico has an opinion about it. What is left
    # out falls through to `set_pagination` itself - its `default_limit: 20` and its
    # `pagination_max_limit`, which an application controller may have overridden and which is
    # also the only place the ceiling can be removed altogether
    # (`Eluvia::Base::Config.max_page_limit = nil`).
    #
    # Note the method names: `Eluvia::PaginationHandler` is included into the controller *after*
    # this concern, so its `pagination_max_limit` shadows anything of that name declared here -
    # which is why habarico resolves its own limits under distinct names and passes them in
    # explicitly instead of overriding the handler's method.
    def set_list_pagination
      options = {
        # No fallback for `set_pagination` to concatenate - habarico appends its own behind the
        # resolved ordering instead, see `append_order_by_tiebreaker`.
        default_order_by: definition.default_sorting,
        fallback_order_by: '',
        force_order_by: definition.force_sorting
      }

      default_limit = list_pagination_default_limit
      options[:default_limit] = default_limit unless default_limit.nil?

      max_limit = list_pagination_max_limit
      options[:max_limit] = max_limit unless max_limit.nil?

      set_pagination(**options)
      append_order_by_tiebreaker
    end

    # Orders by the primary key behind whatever else the list is ordered by, so that two records
    # comparing equal keep a stable position and a page neither repeats nor skips one (HAB-915).
    #
    # This is what `fallback_order_by` is for, but handing the key to `set_pagination` cannot do
    # the job: that string is concatenated onto the ordering before it is parsed into a hash keyed
    # by field name, so a fallback of `id:asc` would overwrite the direction of a request already
    # sorting by `id` - `?order_by=id:desc` would answer ascending. Appending afterwards leaves a
    # field the ordering already names alone.
    def append_order_by_tiebreaker
      list_order_by_tiebreaker.each { |field_name| @order_by[field_name.to_s] ||= :asc }
    end

    # Field names appended to the ordering of `index` to break ties. The primary key by default -
    # it is unique and every model has one, `Array()` covering a composite key. A model with no
    # primary key at all gets nothing, and so does a model without ActiveRecord reflection.
    #
    # Until HAB-915 this was `created_at:asc`, hardcoded: a model without that column answered 422
    # (`order_by__created_at` - "Does not exist.") or a database error on *every* list request,
    # and records sharing a timestamp could still swap places between two pages. Override to sort
    # ties differently; to keep `created_at` in the ordering, name it in `default_sorting`.
    def list_order_by_tiebreaker
      Array(definition.model.try(:primary_key))
    end

    # Page size for a request without a `limit`, or nil to leave it to the base library.
    def list_pagination_default_limit
      definition.default_page_limit || Habarico::Config.default_page_limit
    end

    # Ceiling for `limit`, or nil to leave it to the base library.
    def list_pagination_max_limit
      definition.max_page_limit || Habarico::Config.max_page_limit
    end

    # *************************************************************************
    # Model setters
    # *************************************************************************

    def set_record
      @pk = params[:id]
      # Built from a fresh, non-memoized context since `context` is memoized on first call and must
      # reflect the actual @record once found.
      @record = Habarico::RecordsQuery.new(definition, _context(nil)).find(@pk)
    end

    # *************************************************************************
    # Record params
    # *************************************************************************

    def record_params_resolver
      @record_params_resolver ||= Habarico::RecordParamsResolver.new(definition)
    end

    def complement_record_params
      {} # override in subclasses if needed
    end

    # *************************************************************************
    # Context
    # *************************************************************************

    def _context(record)
      Habarico::Context.new(definition: definition, current_user: current_user,
                            record_pk: record&.id, record: record)
    end

    def context
      @context ||= _context(@record)
    end

    # *************************************************************************
    # Restrictions
    # *************************************************************************

    def is_create_possible?
      true # override in subclasses if needed
    end

    def is_update_possible?(_record)
      true # override in subclasses if needed
    end

    def is_delete_possible?(_record)
      true # override in subclasses if needed
    end

    # *************************************************************************
    # Class objects
    # *************************************************************************

    def definition
      self.class.definition
    end

    class_methods do

      # ***********************************************************************
      # Definition
      # ***********************************************************************

      def definition
        @definition ||= Habarico::Definition.new
      end

      Habarico::Definition.attrs.each do |attr|
        define_method(attr) do |value = nil, &block|
          definition.send("#{attr}=", value) unless value.nil?
          definition.send("#{attr}=", block) unless block.nil?
        end
      end

      # ***********************************************************************
      # Registered actions
      # ***********************************************************************

      def registered_actions
        @registered_actions ||= []
      end

      def register_action(name, is_detail: true, method: :put, model: nil, permission: :read, &proc)
        self.registered_actions << {
          name: name,
          is_detail: is_detail,
          model: model,
          permission: permission,
          method: method
        }
        define_method(name) do
          set_record if is_detail
          raise Eluvia::Errors::StandardError.new("Action `#{name}` is not correctly implemented.") unless proc.respond_to?(:call)
          raise Eluvia::Errors::Forbidden.new("Action `#{name}` not allowed.") unless context.can?(permission)
          response = self.instance_exec(&proc)
          response = Habarico::Response.new(message: response) if response.is_a?(::String)
          response = Habarico::Response.new unless response.is_a?(Habarico::Response)
          render_response(response)
        end
      end

    end

  end
end
