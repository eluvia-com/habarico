module Habarico
  class EnumTypeGenerator < AbstractGenerator

    def generate(model, attr_name, value)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new("Model `#{model.model_name}` does not have enum attribute `#{attr_name}`") unless model.has_enum_attr?(attr_name)
      raise Eluvia::Errors::StandardError.new("Enum attribute `#{attr_name}` of model `#{model.model_name}` does not have a choice with value `#{value}`") unless model.find_enum_attr(attr_name).fetch(value.to_s, nil)

      # Create model
      Habarico::EnumType.new(
        value: generate_value(model, attr_name, value),
        label: generate_label(model, attr_name, value),
        color: generate_color(model, attr_name, value),
        icon: generate_icon(model, attr_name, value)
      )
    end

    protected

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_value(model, attr_name, value)
      choice = model.find_enum_attr(attr_name).fetch(value.to_s, nil)
      choice[:value].to_s
    end

    def generate_label(model, attr_name, value)
      choice = model.find_enum_attr(attr_name).fetch(value.to_s, nil)
      choice[:label].to_s
    end

    def generate_color(model, attr_name, value)
      choice = model.find_enum_attr(attr_name).fetch(value.to_s, nil)
      choice[:color].to_s
    end

    def generate_icon(model, attr_name, value)
      choice = model.find_enum_attr(attr_name).fetch(value.to_s, nil)
      choice[:icon]
    end

  end
end
