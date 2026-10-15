module Habarico
  class ChoicesFieldOptions
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # Key used to look up icons for the field value
    string_attr :icons_key

  end
end
