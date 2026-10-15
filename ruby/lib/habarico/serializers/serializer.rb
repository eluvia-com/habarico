module Habarico
  module Serializers
    class Serializer
      include Eluvia::Serializers::FieldsetSerializer

      def initialize(definition)
        @definition = definition
      end

      def serialize(record, fields: nil)
        read_fieldset(fields).each_with_object({}) do |rest_field, result|
          next unless record.respond_to?(rest_field.name)

          result[rest_field.name] = read_attribute(record, rest_field.name)
        end
      end

      def readable_fields
        field_names
      end

      def read_attribute(record, field_name)
        model = @definition.model

        # Handle "belongs to" and "has one" associations
        if Habarico::ReflectionHelper.is_active_record_class?(model)
          reflection = model.reflect_on_association(field_name)
          return record.send(reflection.foreign_key) if reflection && %i[belongs_to has_one].include?(reflection.macro)
        end

        # Handle enum attribute
        if model.respond_to?(:has_enum_attr?) && model.has_enum_attr?(field_name)
          enum_obj = record.send("#{field_name}_obj")
          return enum_obj ? enum_obj[:value] : nil
        end

        # Fallback to a standard model attribute
        record.send(field_name)
      end

      private

      def field_names
        (@definition.fields + @definition.read_only_fields).uniq.map { |field| field_name_for(field) }
      end

      def field_name_for(field)
        if field.is_a?(Habarico::FieldReference)
          field.name.to_s
        elsif field.is_a?(::String) || field.is_a?(::Symbol)
          field.to_s
        elsif field.is_a?(::Hash)
          field.keys.first.to_s
        else
          raise Eluvia::Errors::StandardError.new("Unsupported field type: #{field.class.name}")
        end
      end

    end
  end
end
