module Habarico
  module ActiveModel
    module References
      extend ::ActiveSupport::Concern
      include Eluvia::ActiveModel::Attributes
      include Eluvia::ActiveModel::ArrayAttribute

      class_methods do

        def _references
          @references ||= {}
        end

        def references(type: nil)
          result = _references.values
          return result unless type
          result.select { |r| r[:type] == type }
        end

        def reference_names(type: nil)
          references(type: type).map { |r| r[:reference_name] }
        end

        def has_reference?(reference_name, type: nil)
          find_reference(reference_name, type: type).present?
        end

        def find_reference(reference_name, type: nil)
          result = _references.fetch(reference_name.to_sym, nil)
          return result unless type
          if result.nil? || result[:type] != type
            nil
          else
            result
          end
        end

        def has_one_reference(reference_name, class_name)
          reference_name = reference_name.to_sym

          string_attr reference_name # -> we need some underlying attribute to hold the data

          _references[reference_name] = {
            reference_name: reference_name,
            type: :has_one,
            class_name: class_name
          }
        end

        def has_many_reference(reference_name, class_name)
          reference_name = reference_name.to_sym

          any_attr reference_name # -> we need some underlying attribute to hold the data
          array_attr reference_name, type: :string # -> now we declare it as an array of strings
          has_one_reference :"#{reference_name}__items", class_name # -> we need to hold metadata about the contained items

          _references[reference_name] = {
            reference_name: reference_name,
            type: :has_many,
            class_name: class_name
          }
        end

      end

    end
  end
end
