module Habarico
  # Declares an `enum_attr` whose choices come from an extensible list in `Habarico::Types`.
  #
  # Identical to calling `enum_attr :type, Types::FIELD_TYPE` directly, except that the class is
  # recorded as a consumer of that list, so `Types.register` can re-declare the enum when a
  # pro/enterprise gem adds a value (HAB-812). Without the record the registration would be
  # invisible here: `enum_attr` copies the choices into the class at declaration time.
  module ExtensibleEnum
    def self.included(base)
      base.extend(ClassMethods)
    end

    module ClassMethods
      def extensible_enum_attr(attr_name, list_name)
        Types.consumers[list_name.to_sym] << [self, attr_name.to_sym]
        enum_attr attr_name, Types.const_get(list_name)
      end
    end
  end
end
