module Habarico
  class ShowView < View
    include DefinitionModel

    def initialize(params = {})
      @type = :show
      @name = 'show'
      @is_detail = true
      @endpoint_method = :get
      @permission = :read
      super(params)
    end

  end
end
