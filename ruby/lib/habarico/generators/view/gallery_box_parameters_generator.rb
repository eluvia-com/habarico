module Habarico
  class GalleryBoxParametersGenerator < AbstractGenerator

    def generate(box, context)
      raise Eluvia::Errors::StandardError.new('Argument `box` must be a Habarico::GalleryBox') unless box.is_a?(Habarico::GalleryBox)

      Habarico::GalleryBoxParameters.new(
        reference: generate_reference(box, context),
        target: generate_target(box, context),
        extra_filters: generate_extra_filters(box, context),
        filters: generate_filters(box, context),
        label: generate_label(box, context),
        image_field: generate_image_field(box, context),
        default_sorting: generate_default_sorting(box, context),
        schema_params: generate_schema_params(box, context),
      )
    end

    protected

    def filter_descriptor_generator
      @filter_descriptor_generator ||= definition.filter_descriptor_generator.new(definition, resource_path)
    end

    def sort_descriptor_generator
      @sort_descriptor_generator ||= definition.sort_descriptor_generator.new(definition, resource_path)
    end

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_reference(box, _context)
      box.reference
    end

    def generate_target(box, _context)
      box.target
    end

    def generate_label(box, _context)
      box.label
    end

    def generate_image_field(box, _context)
      box.image_field
    end

    def generate_schema_params(box, _context)
      box.schema_params
    end

    def generate_extra_filters(box, context)
      Habarico::CallableHelper.resolve(box.extra_filters, context)
    end

    def generate_filters(box, context)
      referenced_model = Habarico::BoxHelper.get_referenced_model(box) || definition.model

      filters = box.filters || []
      filters.map do |filter|
        filter_descriptor_generator.generate(referenced_model, filter, context)
      end
    end

    def generate_default_sorting(box, context)
      sort_descriptor_generator.generate(box.default_sorting || Habarico::BoxHelper.get_referenced_definition(box)&.default_sorting, context)
    end

  end
end
