module Habarico
  class AiFieldOptions
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # List of field names used as sources for AI generation
    has_many_attr :source_fields, 'String'

  end
end
