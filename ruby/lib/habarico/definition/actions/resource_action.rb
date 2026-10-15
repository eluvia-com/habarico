module Habarico
  class ResourceAction < Action
    include DefinitionModel

    def initialize(params = {})
      @type = :resource
      @is_background = false
      super(params)
    end

  end
end
