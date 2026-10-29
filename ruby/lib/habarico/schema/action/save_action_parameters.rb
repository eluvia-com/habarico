module Habarico
  class SaveActionParameters
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes
    include Eluvia::ActiveModel::EnumAttribute

    # Data that will be added to the object before saving
    any_attr :data

    # Where the form goes once the record is saved. When not set, the frontend keeps its own
    # default behaviour.
    string_attr :after_save
    enum_attr :after_save, Types::AFTER_SAVE_TYPE

  end
end
