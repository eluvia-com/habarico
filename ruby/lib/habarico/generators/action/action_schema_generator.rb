module Habarico
  class ActionSchemaGenerator < AbstractGenerator

    def generate(action, context)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `action` must be a Habarico::Action') unless action.is_a?(Habarico::Action)

      # Create model
      Habarico::ActionSchema.new(
        type: generate_type(action, context),
        is_detail: generate_is_detail(action, context),
        label: generate_label(action, context),
        icon: generate_icon(action, context),
        color: generate_color(action, context),
        confirm_dialog: generate_confirm_dialog(action, context),
        view: generate_view(action, context),
        resource: generate_resource(action, context),
        link: generate_link(action, context),
        save: generate_save(action, context),
        upload_images: generate_upload_images(action, context)
      )
    end

    protected

    def view_action_parameters_generator
      @view_action_parameters_generator ||= definition.view_action_parameters_generator.new(definition, resource_path)
    end

    def save_action_parameters_generator
      @save_action_parameters_generator ||= definition.save_action_parameters_generator.new(definition, resource_path)
    end

    def resource_action_parameters_generator
      @resource_action_parameters_generator ||= definition.resource_action_parameters_generator.new(definition, resource_path)
    end

    def link_action_parameters_generator
      @link_action_parameters_generator ||= definition.link_action_parameters_generator.new(definition, resource_path)
    end

    def upload_images_action_parameters_generator
      @upload_images_action_parameters_generator ||= definition.upload_images_action_parameters_generator.new(definition, resource_path)
    end

    def confirm_dialog_properties_generator
      @confirm_dialog_properties_generator ||= definition.confirm_dialog_properties_generator.new(definition, resource_path)
    end

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_type(action, _context)
      action.type
    end

    def generate_is_detail(action, _context)
      action.is_detail
    end

    def generate_label(action, _context)
      action.label
    end

    def generate_icon(action, _context)
      action.icon
    end

    def generate_color(action, _context)
      action.color
    end

    def generate_confirm_dialog(action, context)
      if !action.confirm_dialog_title.blank? || !action.confirm_dialog_message.blank?
        confirm_dialog_properties_generator.generate(action, context)
      end
    end

    def generate_view(action, context)
      if action.type.to_sym == :view
        view_action_parameters_generator.generate(action, context)
      end
    end

    def generate_resource(action, context)
      if action.type.to_sym == :resource
        resource_action_parameters_generator.generate(action, context)
      end
    end

    def generate_link(action, context)
      if action.type.to_sym == :link
        link_action_parameters_generator.generate(action, context)
      end
    end

    def generate_save(action, context)
      if action.type.to_sym == :save
        data = Habarico::CallableHelper.resolve(action.data, context)
        save_action_parameters_generator.generate(action, context) unless data.nil?
      end
    end

    def generate_upload_images(action, context)
      if action.type.to_sym == :'upload-images'
        upload_images_action_parameters_generator.generate(action, context)
      end
    end
  end
end
