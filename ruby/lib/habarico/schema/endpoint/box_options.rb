module Habarico
  class BoxOptions
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # Options for dynamic rendering of the box (conditional show/required)
    has_one_attr :dynamic_render, 'Habarico::DynamicRenderOptions'

  end
end
