module Habarico
  class ArrayBox < Box
    include DefinitionModel

    def initialize(params = {})
      super(params)
      @type = 'array'
    end
  end
end
