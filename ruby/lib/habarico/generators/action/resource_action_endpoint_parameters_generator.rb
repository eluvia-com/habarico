module Habarico
  class ResourceActionEndpointParametersGenerator < AbstractGenerator

    def generate(action, context)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `action` must be a Habarico::Action') unless action.is_a?(Habarico::Action)

      # Create model
      Habarico::ResourceActionEndpointParameters.new(
        path: generate_path(action, context),
        method: generate_method(action, context),
        reference: generate_endpoint_reference(action, context),
      )
    end

    protected

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_path(action, context)
      # A standard action of the current resource needs no path - the frontend already knows the
      # endpoint. One that names its own target does: the path is what points the call at the
      # other resource or record.
      return nil if Habarico::ActionHelper.is_standard_action?(action) && !Habarico::ActionHelper.has_explicit_target?(action)
      url_prefix = Habarico::Config.routing_url_prefix.trim('/')
      result = !url_prefix.blank? ? "/#{url_prefix}" : ''

      # Add resource path
      reference = generate_reference(action, context)
      if reference.present?
        resource_path_2 = ResourceService.instance.get_resource_path(reference)
        raise Eluvia::Errors::StandardError.new("Resource `#{reference}` referenced by action `#{action.name}` is not registered.") if resource_path_2.blank?
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

    # What the endpoint addresses, as one address. `action_name` and `record_pk` live inside it, so
    # they need a resource to belong to: an action without a declared reference is this admin's own.
    def generate_endpoint_reference(action, context)
      action_name = generate_action_name(action, context)
      record_pk = generate_record_pk(action, context)
      reference = generate_reference(action, context)
      reference = resource_name if reference.blank? && (action_name.present? || record_pk.present?)
      return nil if reference.blank?

      Habarico::ResourceReference.build(reference, action_name: action_name, record_pk: record_pk)
    end

    def generate_action_name(action, _context)
      return action.endpoint_action_name if action.endpoint_action_name.present?
      return nil if Habarico::ActionHelper.is_standard_action?(action)
      action.name
    end

    def generate_record_pk(action, context)
      # An explicit record pk on the action wins over the record in the context: it is how an
      # action targets a record other than the one it was invoked on.
      return action.endpoint_record_pk if action.endpoint_record_pk.present?
      context.record_pk if action&.is_detail
    end

  end
end
