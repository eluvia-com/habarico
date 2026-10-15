module Habarico
  class ActionViewChoice
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # Human-readable label of the choice
    string_attr :label

    # Parameters associated with the choice, passed to the view when selected
    has_many_attr :parameters, 'String', underlying_type: :hash

  end
end
