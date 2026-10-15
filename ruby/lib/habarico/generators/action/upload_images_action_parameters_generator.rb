module Habarico
  class UploadImagesActionParametersGenerator < AbstractGenerator

    def generate(action, context)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `action` must be a Habarico::Action') unless action.is_a?(Habarico::Action)
      raise Eluvia::Errors::StandardError.new('Argument `action` must be of :"upload-images" type') unless action.type.to_sym == :"upload-images"

      # Create model
      Habarico::UploadImagesActionParameters.new(
        reference: generate_reference(action, context),
        target: generate_target(action, context),
        accept: generate_accept(action, context),
        image_field: generate_image_field(action, context)
      )
    end

    protected

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_reference(action, _context)
      action.upload_images_reference
    end

    def generate_target(action, _context)
      action.upload_images_target
    end

    def generate_accept(action, _context)
      action.upload_images_accept
    end

    def generate_image_field(action, _context)
      action.upload_images_image_field
    end

  end
end
