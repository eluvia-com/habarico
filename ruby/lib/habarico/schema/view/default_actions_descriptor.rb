module Habarico
  # Stands for a resource's default actions in a view's action slot.
  #
  # The client loads the schema of the resource this addresses - `reference`, or the one the schema
  # was generated for when it is absent - and expands this into one ordinary `ActionDescriptor` per
  # supported action, each bound to that resource. It carries nothing of its own appearance: a label,
  # an icon and a colour belong to each action it expands into.
  class DefaultActionsDescriptor
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes
    include Eluvia::ActiveModel::EnumAttribute

    TYPE = 'default_actions'.freeze

    # Descriptor type, telling this entry apart from an `ActionDescriptor` where they share a slot
    string_attr :type

    # Resource whose default actions are expanded here; absent means the one the schema is read in
    has_one_attr :reference, 'Habarico::ResourceReference'

    # Which of the resource's actions to expand; absent means `all`
    string_attr :scope
    enum_attr :scope, Types::ACTION_SCOPE_TYPE

    def initialize(params = {})
      super({ type: TYPE }.merge(params))
    end

  end
end
