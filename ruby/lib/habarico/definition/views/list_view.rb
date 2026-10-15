module Habarico
  class ListView < View
    include DefinitionModel

    attr_accessor :filters

    def initialize(params = {})
      @type = :list
      @name = 'list'
      @is_detail = false
      @endpoint_method = :get
      @permission = :read
      super(params)
    end

  end
end
