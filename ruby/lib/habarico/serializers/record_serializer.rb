module Habarico
  module Serializers
    # Serializes a record of a resource into its list or detail response: the fields picked by
    # `fields`, read by the definition's `fields_serializer`, plus `meta` with `repr`, `schema`,
    # `tags`, `trigger_action` and, on a list with an active search, `highlights`. Built per request.
    class RecordSerializer
      include Eluvia::Serializers::FieldsetSerializer

      META_FIELD = 'meta'.freeze
      COMPACTABLE = [nil, {}].freeze

      # `context_for` and `trigger_action_for` are called with the record - the controller's
      # `_context` and `get_trigger_action_schema`, so overrides of either keep applying.
      def initialize(definition:, resource_name:, context_for:, trigger_action_for:, fields: nil, search_query: nil)
        @definition = definition
        @resource_name = resource_name
        @fields_serializer = definition.fields_serializer.new(definition)
        @meta_serializer = MetaSerializer.new
        @context_for = context_for
        @trigger_action_for = trigger_action_for
        @fields = fields
        @search_query = search_query
      end

      def readable_fields
        @fields_serializer.readable_fields + [META_FIELD]
      end

      def serialize(view_type, record)
        read_fieldset(@fields).each_with_object({}) do |rest_field, result|
          if rest_field.name == META_FIELD
            result[META_FIELD] = meta(view_type, record, rest_field.fieldset)
          elsif @fields_serializer.serializable?(record, rest_field.name)
            result[rest_field.name] = @fields_serializer.read_attribute(record, rest_field.name)
          end
        end
      end

      # Full-value highlights for a list record, or nil when there is no active search query, no
      # `search_fields` path matched, or no highlighter is registered in
      # `Config.search_highlighter_class` (the free gem registers none).
      def highlights(record)
        return nil if @search_query.blank? || @definition.search_fields.blank?
        return nil if highlighter.nil?

        highlighter.highlight(record, @search_query, full: true).presence
      end

      private

      def meta(view_type, record, sub_fieldset)
        meta = @meta_serializer.serialize(meta_data(view_type, record), fields: sub_fieldset&.to_s)
        meta['schema'] = meta['schema'].deep_compact(compactable: COMPACTABLE) if meta['schema']

        # Highlights carry the full field value, like the Python `meta.highlights`, and are added
        # after the fieldset so `fields=meta(...)` never prunes them.
        if view_type == :list
          entries = highlights(record)
          meta['highlights'] = entries if entries
        end

        meta.compact
      end

      def meta_data(view_type, record)
        context = @context_for.call(record)
        trigger_action = @trigger_action_for.call(record)

        {
          'repr' => record.respond_to?(:representation) ? record.representation : record.to_s,
          'schema' => Habarico::SchemaService.instance.get_object_schema(@resource_name, view_type, context).as_json,
          'tags' => @definition.tags.respond_to?(:call) ? @definition.tags.call(context) : [],
          'trigger_action' => trigger_action&.as_json&.deep_compact(compactable: COMPACTABLE)
        }
      end

      def highlighter
        return @highlighter if defined?(@highlighter)

        highlighter_class = Habarico::Config.search_highlighter_class!
        @highlighter = highlighter_class&.new(model: @definition.model, search_fields: @definition.search_fields)
      end
    end
  end
end
