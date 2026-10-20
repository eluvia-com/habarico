module Habarico
  # What an author writes in an action slot to mean "this resource's default actions".
  #
  # The client expands it into one ordinary action descriptor per supported action, so it names no
  # action and carries none of a button's appearance - a label, an icon and a colour belong to each
  # action it expands into.
  class DefaultActionsReference
    include DefinitionModel

    # Resource whose defaults expand here: a name, `ResourceReference::CURRENT`,
    # `ResourceReference::LIST`, or nothing for the resource the slot is read in
    attr_accessor :reference

    # Which of them: `:list`, `:detail` or `:all`
    attr_accessor :scope

  end
end
