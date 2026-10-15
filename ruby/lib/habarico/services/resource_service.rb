module Habarico
  class ResourceService
    include Singleton

    def get_controller_class(resource_path)
      return nil if resource_path.blank?
      controller_class_name = ''
      controller_class_name += "#{Habarico::Config.routing_scope.camelize}::" if Habarico::Config.routing_scope.present?
      controller_class_name += resource_path.map { |part| part.to_s.camelize }.join('::') + 'Controller' # rubocop:disable Style/StringConcatenation -- would be less readable
      controller_class_name.constantize
    rescue NameError
      raise Eluvia::Errors::NotFound.new("Controller class #{controller_class_name} not found for resource #{resource_path.join('.')}")
    end

    def get_definition(resource_path)
      return nil if resource_path.blank?
      get_controller_class(resource_path)&.definition
    end

    def get_resource_path(resource_name)
      return nil if resource_name.blank?
      flatten_specs(Habarico::Config.resources).find { |resource_path| resource_path.last == resource_name.to_sym }
    end

    def get_resources_paths
      flatten_specs(Habarico::Config.resources)
    end

    def find_resource_name_by_model_class_or_instance(model_class_or_instance)
      return nil if model_class_or_instance.blank?
      if Habarico::ReflectionHelper.is_active_record_class?(model_class_or_instance)
        return find_resource_name_by_model_class(model_class_or_instance)
      end
      if Habarico::ReflectionHelper.is_active_record_instance?(model_class_or_instance)
        return find_resource_name_by_model_class(model_class_or_instance.class)
      end
      nil
    end

    def find_resource_name_by_model_class(model_class)
      return nil if model_class.blank?
      get_resources_paths.each do |resource_path|
        controller_class = get_controller_class(resource_path)
        if controller_class && controller_class.definition.model == model_class # match model class
          return resource_path.last # return resource name
        end
      end
      nil
    end

    private

    def flatten_specs(specs, namespaces = [])
      result = []
      specs.each do |resource_or_namespace|
        if resource_or_namespace.is_a?(Hash)
          resource_or_namespace.each do |namespace_name, specs_2|
            result += flatten_specs(specs_2, namespaces + [namespace_name])
          end
        else
          resource_name = resource_or_namespace
          result << (namespaces + [resource_name])
        end
      end
      result
    end

  end
end
