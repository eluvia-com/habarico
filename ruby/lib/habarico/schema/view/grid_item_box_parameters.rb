module Habarico
  class GridItemBoxParameters
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    integer_attr :xs
    integer_attr :sm
    integer_attr :md
    integer_attr :lg
    integer_attr :xl

  end
end
