module Habarico
  class ResourceActionEndpointParametersGenerator < AbstractGenerator

    def generate(action, context)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `action` must be a Habarico::Action') unless action.is_a?(Habarico::Action)

      # Create model
      Habarico::ResourceActionEndpointParameters.new(
        path: generate_path(action, context),
        method: generate_method(action, context),
        reference: generate_reference(action, context),
        action_name: generate_action_name(action, context),
        record_pk: generate_record_pk(action, context)
      )
    end

    protected

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_path(action, context)
      return nil if Habarico::ActionHelper.is_standard_action?(action)
      url_prefix = Habarico::Config.routing_url_prefix.trim('/')
      result = !url_prefix.blank? ? "/#{url_prefix}" : ''

      # Add resource path
      reference = generate_reference(action, context)
      if reference.present?
        resource_path_2 = ResourceService.instance.get_resource_path(reference)
        result += "/#{resource_path_2.join('/')}"
      else
        result += "/#{resource_path.join('/')}"
      end

      # Add record PK
      record_pk = generate_record_pk(action, context)
      result += "/#{record_pk}" if record_pk

      # Add action name
      action_name = generate_action_name(action, context)
      result += "/#{action_name}" if action_name

      # Return result
      "#{result}/"
    end

    def generate_method(action, _context)
      action.endpoint_method
    end

    def generate_reference(action, _context)
      action.endpoint_reference
    end

    def generate_action_name(action, _context)
      return nil if Habarico::ActionHelper.is_standard_action?(action)
      action.endpoint_action_name || action.name
    end

    def generate_record_pk(action, context)
      if action&.is_detail
        context.record_pk
      end
    end

  end
end
