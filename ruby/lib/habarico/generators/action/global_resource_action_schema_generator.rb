module Habarico
  class GlobalResourceActionSchemaGenerator < ActionSchemaGenerator

    def generate(action)
      # Fallback to a simple Action object if a string or symbol is provided
      if action.is_a?(String) || action.is_a?(Symbol)
        action = case action.to_sym
                 when :show then Habarico::ShowAction.new
                 when :edit then Habarico::EditAction.new
                 when :create then Habarico::CreateAction.new
                 when :delete then Habarico::DeleteAction.new
                 end
      end

      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `action` must be a Habarico::Action') unless action.is_a?(Habarico::Action)

      # Create model
      Habarico::GlobalResourceActionSchema.new(
        type: generate_type(action, Habarico::Context.new),
        is_detail: generate_is_detail(action, Habarico::Context.new),
        name: generate_name(action),
        show_in_detail: generate_show_in_detail(action),
        show_in_list: generate_show_in_list(action),
      )
    end

    protected

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_name(action)
      action.name
    end

    def generate_show_in_detail(action)
      action.show_in_detail
    end

    def generate_show_in_list(action)
      action.show_in_list
    end
  end
end
