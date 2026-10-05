module Habarico
  class DetailViewParameters
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # Definition of a main box
    has_one_attr :box, 'Habarico::BoxSchema'

    # In case we don't want to show the default set of resource actions, a custom set of action descriptors can be provided and displayed in the tollbar
    has_many_attr :toolbar_actions, ['Habarico::ActionDescriptor', 'Habarico::DefaultActionsDescriptor'], default: 'Habarico::ActionDescriptor'

    # A set of action descriptors can be provided and displayed under the detail box / form
    has_many_attr :bottom_actions, ['Habarico::ActionDescriptor', 'Habarico::DefaultActionsDescriptor'], default: 'Habarico::ActionDescriptor'

  end
end
