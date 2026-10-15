module Habarico
  module Serializers
    class MetaSerializer
      include Eluvia::Serializers::FieldsetSerializer

      class SchemaSerializer
        include Eluvia::Serializers::FieldsetSerializer

        READABLE_FIELDS = %w[name label pk_field_name actions].freeze

        def readable_fields
          READABLE_FIELDS
        end

        def read_attribute(record, field_name)
          record[field_name]
        end
      end

      READABLE_FIELDS = %w[repr schema tags trigger_action].freeze

      def initialize(schema_serializer: SchemaSerializer.new)
        @schema_serializer = schema_serializer
      end

      def readable_fields
        READABLE_FIELDS
      end

      def serialize(data, fields: nil)
        read_fieldset(fields).to_h { |rest_field| [rest_field.name, read_attribute(data, rest_field.name, rest_field.fieldset)] }
      end

      def read_attribute(data, field_name, sub_fieldset = nil)
        return data[field_name] unless field_name == 'schema'

        @schema_serializer.serialize(data['schema'], fields: sub_fieldset&.to_s)
      end

    end
  end
end
