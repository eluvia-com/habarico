module Habarico
  # Resolves the writable params of a create or update request, and maps the validation errors of
  # the record they were saved into back to the names a client writes those params by.
  class RecordParamsResolver
    def initialize(definition)
      @definition = definition
    end

    # `params` narrowed to the resource's `fields` and `write_only_fields`.
    def resolve(params)
      write_fields = (@definition.fields + @definition.write_only_fields).uniq
      params.permit(*write_fields.map { |field| permit_spec(field) }.uniq)
    end

    # A 422 with each error of `record` under every name its attribute is written by (an amount as
    # `price`, `price_major` and `price_minor`, ...).
    def validation_error(record)
      errors = record.errors.to_hash.each_with_object({}) do |(attr_name, error), result|
        Habarico::AttributesHelper.generate_attr_variants(@definition.model, attr_name).each do |variant|
          result[variant] = error
        end
      end
      Eluvia::Errors::UnprocessableEntity.new(errors)
    end

    private

    def permit_spec(field)
      # Normalize Symbol/String/Hash/FieldReference entries so `permit` never receives a FieldReference.
      name = Habarico::AttributesHelper.field_name(field)
      model = @definition.model

      # An append-only `file_array_attr` takes a list of base64 `{filename:, content:}` uploads,
      # whatever subfields its declaration lists for reading.
      return { name => %i[filename content] } if Habarico::ReflectionHelper.is_append_only_file_array_attr?(model, name)

      # Hash entries (`{ name => subfields }`) are already a nested permit spec - keep intact.
      return field if field.is_a?(::Hash)

      # `ActionController::Parameters#permit` only allows scalar values for a bare field name -
      # a Hash value (e.g. a `file_attr` field's base64 `{filename:, content:}` or chunked-upload
      # `{upload_key:}` payload) is silently dropped unless its nested keys are explicitly
      # permitted. Expand file_attr fields into a nested permit spec; leave every other field as-is.
      if model.respond_to?(:has_file_attr?) && model.has_file_attr?(name)
        { name => %i[filename content upload_key] }
      else
        name
      end
    end
  end
end
