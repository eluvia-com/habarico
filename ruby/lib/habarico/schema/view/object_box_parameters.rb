module Habarico
  class ObjectBoxParameters
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # Name of the nested serializer field used as the target for object operations
    string_attr :target

  end
end
