module Habarico
  class DynamicRenderOptions
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes
    include Eluvia::ActiveModel::EnumAttribute

    # The field will be shown if query is true
    string_attr :show_query

    # The field will be required if query is true
    string_attr :required_query

  end
end
