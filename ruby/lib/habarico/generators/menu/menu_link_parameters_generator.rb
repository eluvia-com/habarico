module Habarico
  class MenuLinkParametersGenerator < AbstractGenerator

    def generate(menu_item)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `menu_item` must be a Habarico::MenuItem') unless menu_item.is_a?(Habarico::MenuItem)
      raise Eluvia::Errors::StandardError.new('Argument `menu_item` must be of :link type') unless menu_item.type.to_sym == :link

      # Create model
      Habarico::LinkActionParameters.new(
        url: generate_url(menu_item),
        target: generate_target(menu_item)
      )
    end

    protected

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_url(menu_item)
      menu_item.link_url
    end

    def generate_target(menu_item)
      menu_item.link_target
    end

  end
end
