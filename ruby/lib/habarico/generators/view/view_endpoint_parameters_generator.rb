module Habarico
  class ViewEndpointParametersGenerator < AbstractGenerator

    def generate(view, context)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `view` must be a Habarico::View') unless view.is_a?(Habarico::View)

      # Create model
      Habarico::ViewEndpointParameters.new(
        path: generate_path(view, context),
        method: generate_method(view, context),
        reference: generate_reference(view, context),
        action_name: generate_action_name(view, context)
      )
    end

    protected

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_path(view, context)
      # Standard views (list, show, create, edit) are served from the standard resource path, which the
      # frontend derives on its own; only action views need an explicit path.
      return nil if view.endpoint_action_name.blank?

      url_prefix = Habarico::Config.routing_url_prefix.trim('/')
      result = !url_prefix.blank? ? "/#{url_prefix}" : ''

      # Add resource path
      reference = generate_reference(view, context)
      if reference.present?
        resource_path_2 = ResourceService.instance.get_resource_path(reference)
        result += "/#{resource_path_2.join('/')}"
      else
        result += "/#{resource_path.join('/')}"
      end

      # Add record PK
      record_pk = generate_record_pk(view, context)
      result += "/#{record_pk}" if record_pk

      # Add action name
      action_name = generate_action_name(view, context)
      result += "/#{action_name}" if action_name

      # Return result
      "#{result}/"
    end

    def generate_method(view, _context)
      view.endpoint_method
    end

    def generate_reference(view, _context)
      view.endpoint_reference
    end

    def generate_action_name(view, _context)
      view.endpoint_action_name
    end

    def generate_record_pk(view, context)
      if view.is_detail
        context.record_pk
      end
    end

  end
end
