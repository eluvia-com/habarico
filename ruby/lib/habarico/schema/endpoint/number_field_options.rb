module Habarico
  class NumberFieldOptions
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes
    include Eluvia::ActiveModel::EnumAttribute

    # Style of the number formatting
    string_attr :style
    enum_attr :style, %i[currency unit]

    # Currency code used in case of "currency" format
    string_attr :currency

    # Unit used in case of "unit" format
    string_attr :unit

    # Minimum number of fraction digits
    integer_attr :minimum_fraction_digits

    # Maximum number of fraction digits
    integer_attr :maximum_fraction_digits

  end
end
