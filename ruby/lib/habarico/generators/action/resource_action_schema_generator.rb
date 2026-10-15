module Habarico
  class ResourceActionSchemaGenerator < ActionSchemaGenerator

    def generate(action, context)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `action` must be a Habarico::Action') unless action.is_a?(Habarico::Action)

      # Create model
      Habarico::ResourceActionSchema.new(
        type: generate_type(action, context),
        is_detail: generate_is_detail(action, context),
        label: generate_label(action, context),
        icon: generate_icon(action, context),
        color: generate_color(action, context),
        confirm_dialog: generate_confirm_dialog(action, context),
        view: generate_view(action, context),
        resource: generate_resource(action, context),
        link: generate_link(action, context),
        name: generate_name(action, context),
        show_in_detail: generate_show_in_detail(action, context),
        show_in_list: generate_show_in_list(action, context),
      )
    end

    protected

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_label(action, context)
      action_name = generate_name(action, context).to_s
      action.label ||
        I18n.t("actions.#{resource_path.join('.')}.#{action.name}", default: nil) ||
        I18n.t("actions.common.#{action_name}", default: nil) ||
        action_name.to_s.humanize
    end

    def generate_name(action, _context)
      action.name
    end

    def generate_show_in_detail(action, _context)
      action.show_in_detail
    end

    def generate_show_in_list(action, _context)
      action.show_in_list
    end
  end
end
