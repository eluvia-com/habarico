module Habarico
  class UploadFilesAction < Action
    include DefinitionModel

    def initialize(params = {})
      @type = :"upload-files"
      super(params)
    end

  end
end
