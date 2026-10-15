module Habarico
  class FilterReference
    include DefinitionModel

    attr_accessor :name, :label, :help_text, :is_always_on, :default_value
  end
end
