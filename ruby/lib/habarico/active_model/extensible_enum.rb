module Habarico
  module ActiveModel
    # Declarations built from a list of choices that may grow after the class is defined.
    #
    # `enum_attr` and `intended_for_types` copy the choices into the class when they are called, so
    # appending to the list alone would change nothing. This module records every declaration made
    # from a list and repeats it when `add_values` extends the list.
    module ExtensibleEnum
      extend ::ActiveSupport::Concern

      # Declarations made from a list, as `{ list => [declaration, ...] }`, keyed by the list itself
      # since its contents change.
      def self.declarations
        @declarations ||= Hash.new { |hash, list| hash[list] = [] }.compare_by_identity
      end

      # Runs `declaration` now and again whenever `add_values` extends `list`.
      def self.declare(list, &declaration)
        declarations[list] << declaration
        declaration.call
      end

      # Appends `values` to `list` and repeats every declaration made from it.
      def self.add_values(list, values)
        list.concat(values)
        declarations[list].each(&:call)
        list
      end

      class_methods do
        # `enum_attr attr_name, list`, kept in step with `list`.
        def extensible_enum_attr(attr_name, list)
          ExtensibleEnum.declare(list) { enum_attr attr_name, list }
        end

        # `intended_for_types(*list)`, kept in step with `list`.
        def extensible_intended_for_types(list)
          ExtensibleEnum.declare(list) { intended_for_types(*list) }
        end
      end
    end
  end
end
