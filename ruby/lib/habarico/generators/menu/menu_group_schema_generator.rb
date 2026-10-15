module Habarico
  class MenuGroupSchemaGenerator < AbstractGenerator

    def generate(menu_path)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `menu_path` must be an array of Habarico::MenuItem objects') unless menu_path.is_a?(::Array) && menu_path.all? { |b| b.is_a?(Habarico::MenuItem) }

      # Pop last breadcrumb as current menu item
      menu_path_2 = menu_path.dup
      menu_item = menu_path_2.pop
      return nil if menu_item.nil?

      # Create model
      Habarico::MenuGroupSchema.new(
        name: generate_name(menu_item),
        label: generate_label(menu_item),
        icon: generate_icon(menu_item),
        color: generate_color(menu_item),
        priority: generate_priority(menu_item),
        parent: generate_parent(menu_path_2),
      )
    end

    protected

    def menu_group_schema_generator
      @menu_group_schema_generator ||= definition.menu_group_schema_generator.new(definition, resource_path)
    end

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_name(menu_item)
      menu_item.name
    end

    def generate_label(menu_item)
      menu_item.label
    end

    def generate_icon(menu_item)
      menu_item.icon
    end

    def generate_color(menu_item)
      menu_item.color
    end

    def generate_priority(menu_item)
      menu_item.priority
    end

    def generate_parent(menu_path)
      if menu_path.empty?
        nil
      else
        menu_group_schema_generator.generate(menu_path)
      end
    end

  end
end
