module Habarico
  class MenuViewEndpointParametersGenerator < AbstractGenerator

    def generate(menu_item)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `menu_item` must be a Habarico::MenuItem') unless menu_item.is_a?(Habarico::MenuItem)
      raise Eluvia::Errors::StandardError.new('Argument `menu_item` must be of :view type') unless menu_item.type.to_sym == :view

      # Create model
      Habarico::ViewActionEndpointParameters.new(
        reference: generate_reference(menu_item),
        action_name: generate_action_name(menu_item),
        record_pk: generate_record_pk(menu_item)
      )
    end

    protected

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_reference(menu_item)
      if menu_item.reference.present?
        return Habarico::ResourceService.instance.find_resource_name_by_model_class_or_instance(menu_item.reference)
      end
      nil
    end

    def generate_action_name(menu_item)
      menu_item.reference_action_name
    end

    def generate_record_pk(menu_item)
      if menu_item.reference.present?
        if Habarico::ReflectionHelper.is_active_record_instance?(menu_item.reference)
          return menu_item.reference.id
        end
      end
      nil
    end

  end
end
