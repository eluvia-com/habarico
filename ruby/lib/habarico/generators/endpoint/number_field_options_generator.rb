module Habarico
  class NumberFieldOptionsGenerator < AbstractGenerator

    def generate(model, attr_name)
      Habarico::NumberFieldOptions.new(
        style: generate_style(model, attr_name),
        currency: generate_currency(model, attr_name),
        unit: generate_unit(model, attr_name),
        minimum_fraction_digits: generate_minimum_fraction_digits(model, attr_name),
        maximum_fraction_digits: generate_maximum_fraction_digits(model, attr_name),
      )
    end

    protected

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_style(model, attr_name)
      return 'currency' if Habarico::AttributesHelper.is_amount_major_attr?(model, attr_name)
      nil
    end

    def generate_currency(model, attr_name)
      return Habarico::Config.currency if Habarico::AttributesHelper.is_amount_major_attr?(model, attr_name)
      nil
    end

    def generate_unit(_model, _attr_name)
      # not implemented
    end

    def generate_minimum_fraction_digits(model, attr_name)
      return 2 if Habarico::AttributesHelper.is_amount_major_attr?(model, attr_name)
      nil
    end

    def generate_maximum_fraction_digits(model, attr_name)
      return 2 if Habarico::AttributesHelper.is_amount_major_attr?(model, attr_name)
      nil
    end

  end
end
