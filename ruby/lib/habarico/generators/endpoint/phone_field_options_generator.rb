module Habarico
  class PhoneFieldOptionsGenerator < AbstractGenerator

    def generate(model, field_reference)
      phone = field_reference.phone
      return nil if phone.blank?

      Habarico::PhoneFieldOptions.new(
        default_region: generate_default_region(model, phone),
        allowed_regions: generate_allowed_regions(model, phone),
      )
    end

    protected

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_default_region(_model, phone)
      phone[:default_region]
    end

    def generate_allowed_regions(_model, phone)
      phone[:allowed_regions]
    end

  end
end
