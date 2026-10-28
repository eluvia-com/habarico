module Habarico
  class BoxSchema
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes
    include Eluvia::ActiveModel::EnumAttribute
    include Habarico::ActiveModel::ExtensibleEnum

    extensible_intended_for_types Types::BOX_TYPE

    # Type of the box
    string_attr :type
    extensible_enum_attr :type, Types::BOX_TYPE

    # Name of the box
    string_attr :name

    # Human-readable label of the box
    string_attr :label

    # List of child boxes and fields (polymorphic: FieldDescriptor | BoxSchema)
    has_many_attr :boxes, ['Habarico::FieldDescriptor', 'Habarico::BoxSchema'], default: 'Habarico::BoxSchema'

    # Flag indicating if the box is or is not editable
    boolean_attr :read_only

    # Flag indicating if the box is or is not wrapped in a card UI element
    boolean_attr :card

    # Makes the box collapsible; value sets the default state ('open' = expanded, 'closed' = collapsed).
    # Null means the box is not collapsible.
    string_attr :collapsible
    enum_attr :collapsible, %i[open closed]

    # Actions rendered in this box's local toolbar (box header / card header area), relative to the box root.
    # On a step container (tab/wizard) the actions appear on the last step. For a 'list' box this is the box-level
    # toolbar; the table's own toolbar is carried by 'list.toolbar_actions' instead.
    has_many_attr :toolbar_actions, 'Habarico::ActionDescriptor'

    # Actions rendered at the bottom of the box, below the fields (similar to form submit buttons at the view level).
    has_many_attr :bottom_actions, 'Habarico::ActionDescriptor'

    # Additional parameters for box type 'tab'
    has_one_attr :tab, 'Habarico::TabBoxParameters'

    # Additional parameters for box type 'wizard'
    has_one_attr :wizard, 'Habarico::WizardBoxParameters'

    # Additional parameters for box type 'grid-item'
    has_one_attr :grid_item, 'Habarico::GridItemBoxParameters'

    # Additional parameters for box type 'list'
    has_one_attr :list, 'Habarico::ListBoxParameters'

    # Additional parameters for box type 'array'
    has_one_attr :array, 'Habarico::ArrayBoxParameters'

    # Additional parameters for box type 'object'
    has_one_attr :object, 'Habarico::ObjectBoxParameters'

    # Additional parameters for box type 'gallery'
    has_one_attr :gallery, 'Habarico::GalleryBoxParameters'

    # Additional options for the box (e.g. dynamic rendering)
    has_one_attr :options, 'Habarico::BoxOptions'

  end
end
