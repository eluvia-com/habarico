module Habarico
  class EditView < View
    include DefinitionModel

    def initialize(params = {})
      @type = :edit
      @name = 'edit'
      @is_detail = true
      @endpoint_method = :patch
      @permission = :update
      super(params)
    end

  end
end
