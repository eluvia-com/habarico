module Habarico
  class MenuViewParametersGenerator < AbstractGenerator

    def generate(menu_item)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `menu_item` must be a Habarico::MenuItem') unless menu_item.is_a?(Habarico::MenuItem)
      raise Eluvia::Errors::StandardError.new('Argument `menu_item` must be of :view type') unless menu_item.type.to_sym == :view

      # Create model
      Habarico::ViewActionParameters.new(
        name: generate_name(menu_item),
        mode: generate_mode(menu_item),
        dialog_width: generate_dialog_width(menu_item),
        endpoint: generate_endpoint(menu_item),
        keep_linked_parent: generate_keep_linked_parent(menu_item)
      )
    end

    protected

    def menu_view_endpoint_parameters_generator
      @menu_view_endpoint_parameters_generator ||= definition.menu_view_endpoint_parameters_generator.new(definition, resource_path)
    end

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_name(menu_item)
      menu_item.view_name
    end

    def generate_mode(menu_item)
      menu_item.view_mode
    end

    def generate_dialog_width(menu_item)
      menu_item.dialog_width
    end

    def generate_endpoint(menu_item)
      menu_view_endpoint_parameters_generator.generate(menu_item)
    end

    def generate_keep_linked_parent(menu_item)
      menu_item.view_keep_linked_parent
    end

  end
end
