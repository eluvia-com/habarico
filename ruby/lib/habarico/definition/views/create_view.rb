module Habarico
  class CreateView < View
    include DefinitionModel

    def initialize(params = {})
      @type = :create
      @name = 'create'
      @is_detail = false
      @endpoint_method = :post
      @permission = :create
      super(params)
    end

  end
end
