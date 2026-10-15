module Habarico
  class AbstractGenerator

    def initialize(definition, resource_path)
      @definition = definition
      @resource_path = resource_path
    end

    protected

    attr_reader :definition

    attr_reader :resource_path

    def resource_name
      @resource_path.last
    end

  end

end
