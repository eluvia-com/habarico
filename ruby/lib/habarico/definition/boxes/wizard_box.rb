module Habarico
  class WizardBox < Box
    include DefinitionModel

    def initialize(params = {})
      super(params)
      @type = 'wizard'
    end
  end
end
