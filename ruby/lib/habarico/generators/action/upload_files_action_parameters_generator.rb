module Habarico
  class UploadFilesActionParametersGenerator < AbstractGenerator

    def generate(action, context)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `action` must be a Habarico::Action') unless action.is_a?(Habarico::Action)
      raise Eluvia::Errors::StandardError.new('Argument `action` must be of :"upload-files" type') unless action.type.to_sym == :"upload-files"

      # Create model
      Habarico::UploadFilesActionParameters.new(
        reference: Habarico::ResourceReference.build(generate_reference(action, context)),
        target: generate_target(action, context),
        accept: generate_accept(action, context),
        file_field: generate_file_field(action, context),
        data: generate_data(action, context)
      )
    end

    protected

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_reference(action, _context)
      action.upload_files_reference
    end

    def generate_target(action, _context)
      action.upload_files_target
    end

    def generate_accept(action, _context)
      action.upload_files_accept
    end

    def generate_file_field(action, _context)
      action.upload_files_file_field
    end

    def generate_data(action, context)
      Habarico::CallableHelper.resolve(action.upload_files_data, context)
    end

  end
end
