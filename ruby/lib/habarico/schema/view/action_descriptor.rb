module Habarico
  # Names one action the schema declares and places it in a view's action slot.
  #
  # `DefaultActionsDescriptor` stands beside it in the same slots, standing for a resource's defaults
  # rather than one action, and the two are told apart by `type` - the way `FieldDescriptor` and
  # `BoxSchema` are where they share an array.
  class ActionDescriptor
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes
    include Eluvia::ActiveModel::EnumAttribute

    TYPE = 'action'.freeze

    # Descriptor type, telling this entry apart from a `DefaultActionsDescriptor` in the same slot
    string_attr :type

    # Name of the action, used for coupling with resource action schema
    string_attr :name

    # Override for `label` from action schema
    string_attr :label

    # Override for `icon` from action schema
    string_attr :icon

    # Override for `color` from action schema
    string_attr :color
    enum_attr :color, Types::COLOR_TYPE

    # Special action in case no resource action schema is coupled
    has_one_attr :action, 'Habarico::ActionSchema'

    # View parameters for the action descriptor (mode, choices, parameters)
    has_one_attr :view, 'Habarico::ViewActionDescriptorParameters'

    # Where the action named by `name` is defined and what it binds to. Absent, the action is both
    # looked up and bound in the schema the descriptor is read in.
    has_one_attr :reference, 'Habarico::ResourceReference'

    # Dialog shown before the action runs, overriding the one the action's own schema declares
    has_one_attr :confirm_dialog, 'Habarico::ConfirmDialogProperties'

    # Nested menu items for dropdown/submenu actions
    has_many_attr :menu_items, 'Habarico::ActionDescriptor'

    def initialize(params = {})
      super({ type: TYPE }.merge(params))
    end

  end
end
