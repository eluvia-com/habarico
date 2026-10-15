module Habarico
  class ResourceSchemaGenerator < AbstractGenerator

    def generate
      raise NotImplementedError('Subclasses must implement the generate method.')
    end

    protected

    def resource_action_schema_generator
      @resource_action_schema_generator ||= definition.resource_action_schema_generator.new(definition, resource_path)
    end

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_name
      resource_path.last
    end

    def generate_label
      definition.label || I18n.t("resources.#{resource_path.join('.')}", default: generate_name.to_s.humanize)
    end

    def generate_pk_field_name
      definition.model.primary_key
    end

  end
end
