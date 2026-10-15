module Habarico
  class ArrayBoxParameters
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # Name of the attribute to be used as target for array operations
    string_attr :target

    # Whether to render the array box inline
    boolean_attr :inline

  end
end
