module Habarico
  class ViewEndpointParametersGenerator < AbstractGenerator

    def generate(view, context)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `view` must be a Habarico::View') unless view.is_a?(Habarico::View)

      # Create model
      Habarico::ViewEndpointParameters.new(
        path: generate_path(view, context),
        method: generate_method(view, context),
        reference: generate_endpoint_reference(view, context),
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

    # Where the view's data comes from, left unaddressed when that is the resource being generated.
    # An `action_name` cannot be addressed on its own - it lives inside the address - so a view that
    # has one names the resource it belongs to.
    def generate_endpoint_reference(view, context)
      action_name = generate_action_name(view, context)
      reference = generate_reference(view, context)
      reference = resource_name if reference.blank? && action_name.present?
      return nil if reference.blank?

      Habarico::ResourceReference.build(reference, action_name: action_name)
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
