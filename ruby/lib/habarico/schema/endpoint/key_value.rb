module Habarico
  class KeyValue
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # Key of the pair
    string_attr :key

    # Value of the pair
    string_attr :value

  end
end
