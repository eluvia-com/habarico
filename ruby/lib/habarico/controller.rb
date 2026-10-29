module Habarico
  module Controller
    extend ActiveSupport::Concern

    included do
      include Eluvia::ErrorHandler
      include Eluvia::PaginationHandler
      include Habarico::Authenticatable

      before_action :set_list_pagination, only: [:index]
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
    # Trigger actions
    # *************************************************************************

    # Generates the complete `Habarico::ActionSchema` of `action` - a declared action's name or a
    # `Habarico::Action` - for `get_trigger_action_schema` or `Habarico::Response.new(action: ...)`.
    # `record` builds the context from that record, `record_pk` and `reference` retarget the action.
    def trigger_action_schema(action, record: nil, record_pk: nil, reference: nil)
      resource_path = Habarico::ResourceService.instance.get_resource_path(controller_name)
      definition.trigger_action_schema_generator
                .new(definition, resource_path)
                .generate(action, record ? _context(record) : context, record_pk: record_pk, reference: reference)
    end

    # The trigger action of a serialized record: a declared action's name, a `Habarico::Action` or
    # a `Habarico::ActionSchema`, or nil for none. Override in subclasses.
    def get_trigger_action_schema(_record)
      nil
    end

    # The schema of what `get_trigger_action_schema` answers for `record`, built in its context.
    def record_trigger_action_schema(record)
      action = get_trigger_action_schema(record)
      action && trigger_action_schema(action, record: record)
    end

    # *************************************************************************
    # Serializers
    # *************************************************************************

    # `fields` comes straight from the query string and is kept out of `Habarico::FilterParamsResolver`,
    # since it controls serialization rather than which records are returned.
    def record_serializer(search_query: nil)
      Habarico::Serializers::RecordSerializer.new(
        definition: definition,
        resource_name: controller_name,
        context_for: method(:_context),
        trigger_action_schema_for: method(:record_trigger_action_schema),
        fields: params[:fields],
        search_query: search_query
      )
    end

    def response_serializer
      Habarico::Serializers::ResponseSerializer.new(
        trigger_action_schema_for: method(:trigger_action_schema)
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

    def render_response(response)
      render json: response_serializer.serialize(response)
    end

    # *************************************************************************
    # Pagination
    # *************************************************************************

    # Hands the ordering and the page limits of `index` to `set_pagination`, then checks the fields
    # it ordered by against what the resource sorts by. Every list is finally ordered by the primary
    # key, so records tying on the sorted column keep a stable position across pages. A limit
    # neither the resource nor `Habarico::Config` sets is left out, so eluvia-base decides it.
    def set_list_pagination
      options = {
        default_order_by: definition.default_sorting,
        fallback_order_by: Habarico::OrderByHelper.build(Habarico::ReflectionHelper.primary_key_fields(definition.model), :asc),
        force_order_by: definition.force_sorting
      }

      default_limit = page_limit(definition.default_page_limit, Habarico::Config.default_page_limit)
      options[:default_limit] = default_limit unless default_limit.nil?

      max_limit = page_limit(definition.max_page_limit, Habarico::Config.max_page_limit)
      options[:max_limit] = max_limit unless max_limit.nil?

      set_pagination(**options)
      Habarico::OrderByValidator.new(definition).validate!(@order_by.keys)
    end

    # The resource's limit - a number or a callable taking the context - or `configured` when the
    # resource sets none.
    def page_limit(declared, configured)
      limit = declared.respond_to?(:call) ? declared.call(context) : declared
      limit.nil? ? configured : limit
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
