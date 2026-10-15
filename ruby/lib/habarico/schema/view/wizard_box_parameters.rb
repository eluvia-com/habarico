module Habarico
  class WizardBoxParameters
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # Show previous/next navigation buttons in the box toolbar
    boolean_attr :show_toolbar_navigation

    # Validate the current step before moving to the next one
    boolean_attr :validate_steps

  end
end
