module Habarico
  class UploadImagesAction < Action
    include DefinitionModel

    def initialize(params = {})
      @type = :"upload-images"
      super(params)
    end

  end
end
