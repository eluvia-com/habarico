module Habarico
  module Serializers
    class RecordSerializer
      include Eluvia::Serializers::FieldsetSerializer

      META_FIELD = 'meta'.freeze

      def initialize(serializer:, meta_serializer:)
        @serializer = serializer
        @meta_serializer = meta_serializer
      end

      def readable_fields
        @serializer.readable_fields + [META_FIELD]
      end

      def serialize(record, meta, fields: nil)
        read_fieldset(fields).each_with_object({}) do |rest_field, result|
          next if rest_field.name != META_FIELD && !record.respond_to?(rest_field.name)

          result[rest_field.name] = read_attribute(record, rest_field.name, rest_field.fieldset, meta)
        end
      end

      def read_attribute(record, field_name, sub_fieldset, meta)
        return @meta_serializer.serialize(meta, fields: sub_fieldset&.to_s) if field_name == META_FIELD

        @serializer.read_attribute(record, field_name)
      end

    end
  end
end
