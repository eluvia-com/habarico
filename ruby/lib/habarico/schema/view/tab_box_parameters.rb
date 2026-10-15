module Habarico
  class TabBoxParameters
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # Show previous/next navigation buttons in the box toolbar
    boolean_attr :show_toolbar_navigation

  end
end
