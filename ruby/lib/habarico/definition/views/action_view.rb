module Habarico
  class ActionView < View
    include DefinitionModel

    def initialize(params = {})
      @type = :action
      super(params)
    end

  end
end
