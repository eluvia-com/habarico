module Habarico
  # The leaf field a relation path resolves to.
  #
  # `model` is the class owning the leaf, `name` the leaf attribute name, `path` the original
  # (possibly relation-traversing) path, `type` the kind of value (`:text`, `:choices`,
  # `:boolean`, `:numeric`) and `column` the ActiveRecord column backing the leaf (nil for pure
  # attributes-model attributes).
  LeafField = Struct.new(:model, :name, :path, :type, :column, keyword_init: true) do

    def label
      return name.to_s unless model.respond_to?(:human_attribute_name)

      model.human_attribute_name(name)
    end

    def choices?
      type == :choices
    end

    def boolean?
      type == :boolean
    end

    def numeric?
      type == :numeric
    end

    def text?
      type == :text
    end

  end

  # Resolves a relation path (e.g. `author__name`) against a model and classifies the leaf
  # field's type. Ruby port of the Python `walk_to_leaf_field` helper, extended with type
  # detection; search matching, highlighting and sorting build on it.
  #
  # Intermediate hops must be relations (ActiveRecord associations or Habarico references); the
  # leaf must be an ActiveRecord column or an enum attribute. Unresolvable paths yield `nil`
  # (mirrors the Python behaviour, so a stale entry never crashes the request); use `resolve!`
  # to raise instead - handy for catching typos in tests.
  class FieldPathResolver

    RELATION_SEPARATOR = '__'.freeze
    NUMERIC_COLUMN_TYPES = %i[integer float decimal].freeze

    def initialize(model)
      @model = model
    end

    # Returns a LeafField for `path`, or nil when it cannot be resolved.
    def resolve(path)
      return nil if @model.nil? || path.nil?

      # Negative limit keeps trailing empty segments so `title__` is rejected too.
      parts = path.to_s.split(RELATION_SEPARATOR, -1)
      return nil if parts.empty? || parts.any?(&:empty?)

      current = @model
      parts[0..-2].each do |part|
        current = step_into_relation(current, part)
        return nil if current.nil?
      end

      build_leaf(current, parts.last, path.to_s)
    end

    # Like `resolve`, but raises ArgumentError when the path cannot be resolved.
    def resolve!(path)
      resolve(path) || raise(ArgumentError, "Cannot resolve field path #{path.inspect} on #{@model.inspect}")
    end

    private

    # Follows one relation hop, returning the associated model class or nil when `part` is not a
    # traversable relation. Prefers ActiveRecord associations, falls back to Habarico references.
    def step_into_relation(model, part)
      if model.respond_to?(:reflect_on_association)
        reflection = model.reflect_on_association(part.to_sym)
        return reflection_klass(reflection) if reflection
      end

      if model.respond_to?(:has_reference?) && model.has_reference?(part) && model.respond_to?(:find_reference)
        return reference_klass(model.find_reference(part))
      end

      nil
    end

    # The target class of an ActiveRecord reflection, or nil for polymorphic associations that
    # have no single class.
    def reflection_klass(reflection)
      reflection.klass
    rescue StandardError
      nil
    end

    # The target class of a Habarico reference descriptor (`class_name` may be a Class or String).
    def reference_klass(reference)
      return nil if reference.nil?

      class_name = reference[:class_name]
      class_name.is_a?(::String) ? class_name.constantize : class_name
    rescue NameError
      nil
    end

    def build_leaf(model, name, path)
      type = detect_type(model, name)
      return nil if type.nil?

      LeafField.new(model: model, name: name, path: path, type: type, column: column_for(model, name))
    end

    # Classifies the leaf field. Enum attributes are choices (regardless of their underlying
    # column type); otherwise the ActiveRecord column type decides. An unknown leaf yields nil.
    def detect_type(model, name)
      return :choices if enum?(model, name)

      column = column_for(model, name)
      return nil if column.nil?

      case column.type
      when :boolean then :boolean
      when *NUMERIC_COLUMN_TYPES then :numeric
      else :text
      end
    end

    def enum?(model, name)
      model.respond_to?(:has_enum_attr?) && model.has_enum_attr?(name)
    end

    def column_for(model, name)
      return nil unless model.respond_to?(:columns_hash)

      model.columns_hash[name.to_s]
    end

  end
end
