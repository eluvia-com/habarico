module Habarico
  class SaveAction < Action
    include DefinitionModel

    def initialize(params = {})
      @type = :save
      @name = 'save'
      @icon = 'Check'
      @color = :primary
      super(params)
    end

  end
end
