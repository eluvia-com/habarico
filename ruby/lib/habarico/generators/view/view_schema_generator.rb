module Habarico
  class ViewSchemaGenerator < AbstractGenerator

    def generate(view, context)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `view` must be a Habarico::View') unless view.is_a?(Habarico::View)

      # Create model
      Habarico::ViewSchema.new(
        type: generate_type(view, context),
        name: generate_name(view, context),
        label: generate_label(view, context),
        is_detail: generate_is_detail(view, context),
        list: generate_list(view, context),
        detail: generate_detail(view, context),
        endpoint: generate_endpoint(view, context),
        breadcrumbs: generate_breadcrumbs(view, context),
      )
    end

    protected

    def list_view_parameters_generator
      @list_view_parameters_generator ||= definition.list_view_parameters_generator.new(definition, resource_path)
    end

    def detail_view_parameters_generator
      @detail_view_parameters_generator ||= definition.detail_view_parameters_generator.new(definition, resource_path)
    end

    def view_endpoint_parameters_generator
      @view_endpoint_parameters_generator ||= definition.view_endpoint_parameters_generator.new(definition, resource_path)
    end

    def menu_schema_generator
      @menu_schema_generator ||= definition.menu_schema_generator.new(definition, resource_path)
    end

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_type(view, _context)
      view.type
    end

    def generate_name(view, _context)
      view.name
    end

    def generate_label(view, context)
      view_name = generate_name(view, context).to_s
      view.label ||
        I18n.t("views.#{resource_path.join('.')}.#{view_name}", default: nil) ||
        I18n.t("views.common.#{view_name}", default: nil)
    end

    def generate_is_detail(view, _context)
      !!view.is_detail
    end

    def generate_list(view, context)
      if view.type == :list
        list_view_parameters_generator.generate(view, context)
      end
    end

    def generate_detail(view, context)
      unless view.type == :list
        detail_view_parameters_generator.generate(view, context)
      end
    end

    def generate_endpoint(view, context)
      view_endpoint_parameters_generator.generate(view, context)
    end

    def generate_breadcrumbs(view, context)
      if definition.breadcrumbs&.respond_to?(:call)
        definition.breadcrumbs.call(view, context).map do |menu_item|
          menu_schema_generator.generate(menu_item, nil)
        end
      end
    end

  end
end
