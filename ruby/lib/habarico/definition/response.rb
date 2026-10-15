module Habarico
  class Response
    include DefinitionModel

    attr_accessor :message, :state, :action

    def initialize(params = {})
      @state = :success
      super(params)
    end

  end
end
