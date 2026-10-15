module Habarico
  class MenuSchemaGenerator < AbstractGenerator

    def generate(menu_item, menu_path)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Definition `menu_item` must be a Habarico::MenuItem object') unless menu_item.is_a?(Habarico::MenuItem)

      # Create model
      Habarico::MenuSchema.new(
        name: generate_name(menu_item),
        label: generate_label(menu_item),
        icon: generate_icon(menu_item),
        color: generate_color(menu_item),
        priority: generate_priority(menu_item),
        type: generate_type(menu_item),
        view: generate_view(menu_item),
        link: generate_link(menu_item),
        parent: generate_parent(menu_path)
      )
    end

    protected

    def menu_group_schema_generator
      @menu_group_schema_generator ||= definition.menu_group_schema_generator.new(definition, resource_path)
    end

    def menu_view_parameters_generator
      @menu_view_parameters_generator ||= definition.menu_view_parameters_generator.new(definition, resource_path)
    end

    def menu_link_parameters_generator
      @menu_link_parameters_generator ||= definition.menu_link_parameters_generator.new(definition, resource_path)
    end

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_name(menu_item)
      return menu_item.name if menu_item.name

      # Compute prefix from this or referenced resource
      prefix = nil
      if menu_item.reference.present?
        prefix = Habarico::ResourceService.instance.find_resource_name_by_model_class_or_instance(menu_item.reference)
      end
      if prefix.nil?
        prefix = resource_path.last
      end

      # Compute suffix from view name or link url
      suffix = if menu_item.type.to_sym == :view && menu_item.view_name
                 menu_item.view_name
               elsif menu_item.type.to_sym == :link && menu_item.link_url
                 menu_item.link_url.gsub(/[^a-zA-Z0-9]/, '_')
               else
                 'item'
               end

      "#{prefix}-#{suffix}"
    end

    def generate_label(menu_item)
      menu_item.label || definition.label || I18n.t("resources.#{resource_path.join('.')}", default: generate_name(menu_item).to_s.humanize)
    end

    def generate_icon(menu_item)
      menu_item.icon || definition.icon
    end

    def generate_color(menu_item)
      menu_item.color
    end

    def generate_priority(menu_item)
      menu_item.priority
    end

    def generate_type(menu_item)
      menu_item.type
    end

    def generate_view(menu_item)
      if menu_item.type.to_sym == :view
        menu_view_parameters_generator.generate(menu_item)
      end
    end

    def generate_link(menu_item)
      if menu_item.type.to_sym == :link
        menu_link_parameters_generator.generate(menu_item)
      end
    end

    def generate_parent(menu_path)
      if menu_path.blank? || menu_path.empty?
        nil
      else
        menu_group_schema_generator.generate(menu_path)
      end
    end

  end
end
