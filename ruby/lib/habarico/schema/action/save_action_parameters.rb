module Habarico
  class SaveActionParameters
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # Data that will be added to the object before saving
    any_attr :data

  end
end
