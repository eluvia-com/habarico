module Habarico
  class DynamicRenderOptionsGenerator < AbstractGenerator

    def generate(model, box_or_field_reference)
      Habarico::DynamicRenderOptions.new(
        show_query: generate_show_query(model, box_or_field_reference),
        required_query: generate_required_query(model, box_or_field_reference),
      )
    end

    protected

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_show_query(_model, box_or_field_reference)
      box_or_field_reference.show_query
    end

    def generate_required_query(_model, box_or_field_reference)
      box_or_field_reference.required_query
    end

  end
end
