module Habarico
  class PhoneFieldOptions
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # Default region code for phone number parsing and formatting (e.g. 'CZ')
    string_attr :default_region

    # List of allowed region codes (e.g. ['CZ', 'SK'])
    has_many_attr :allowed_regions, 'String'

  end
end
