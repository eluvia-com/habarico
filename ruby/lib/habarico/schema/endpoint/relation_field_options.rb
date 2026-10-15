module Habarico
  class RelationFieldOptions
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes
    include Eluvia::ActiveModel::EnumAttribute

    # Show a link to the related resource detail
    boolean_attr :show_link

    # How to open the linked resource detail (redirect to page or open in a dialog)
    string_attr :link_mode
    enum_attr :link_mode, %i[redirect dialog]

    # Width of the dialog, only used when link_mode is dialog (MUI breakpoint or CSS width value)
    string_attr :dialog_width

    # Keep the linked parent in the URL when navigating to linked resource
    boolean_attr :keep_linked_parent

    # Show edit button for inline editing of the related resource
    boolean_attr :show_edit_button

    # Show create button for inline creation of a new related resource
    boolean_attr :show_create_button

    # Preserve the order of the values according to the order in the source field
    boolean_attr :preserve_order

    # Static key-value filters applied to the relation resource query
    has_many_attr :filters, 'Habarico::KeyValue'

    # Default sorting applied to the relation resource query
    has_one_attr :sort, 'Habarico::SortDescriptor'

    # Name of the parent field this field depends on (used for tree/hierarchical relations)
    string_attr :parent

  end
end
