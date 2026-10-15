module Habarico
  class GalleryBox < Box
    include DefinitionModel

    def initialize(params = {})
      super(params)
      @type = 'gallery'
    end
  end
end
