module Habarico
  class GlobalViewSchemaGenerator < AbstractGenerator

    def generate(view)
      # Fallback to a simple View object if a string or symbol is provided
      if view.is_a?(String) || view.is_a?(Symbol)
        view = case view.to_sym
               when :list then Habarico::ListView.new
               when :show then Habarico::ShowView.new
               when :edit then Habarico::EditView.new
               when :create then Habarico::CreateView.new
               end
      end

      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `view` must be a Habarico::View') unless view.is_a?(Habarico::View)

      # Create model
      Habarico::GlobalViewSchema.new(
        type: generate_type(view),
        name: generate_name(view),
        is_detail: generate_is_detail(view),
        mode: generate_mode(view),
        endpoint: generate_endpoint(view)
      )
    end

    protected

    def view_endpoint_parameters_generator
      @view_endpoint_parameters_generator ||= definition.view_endpoint_parameters_generator.new(definition, resource_path)
    end

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_type(view)
      view.type
    end

    def generate_name(view)
      view.name
    end

    def generate_is_detail(view)
      view.is_detail.nil? ? view.type.to_sym != :list : view.is_detail
    end

    def generate_mode(view)
      view.view_mode
    end

    def generate_endpoint(view)
      view_endpoint_parameters_generator.generate(view, Habarico::Context.new)
    end

  end
end
