module Habarico
  module BoxHelper
    def self.get_referenced_definition(box)
      if box.reference
        return Habarico::ResourceService.instance.get_definition(Habarico::ResourceService.instance.get_resource_path(box.reference))
      end
      nil
    end

    def self.get_referenced_model(box)
      referenced_definition = get_referenced_definition(box)
      if referenced_definition
        return referenced_definition.model
      end
      nil
    end

  end
end
