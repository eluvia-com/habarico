module Habarico
  class ObjectBox < Box
    include DefinitionModel

    def initialize(params = {})
      super(params)
      @type = 'object'
    end
  end
end
