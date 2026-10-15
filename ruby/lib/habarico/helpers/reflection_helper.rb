module Habarico
  module ReflectionHelper

    # *************************************************************************
    # Attributes model reflection methods
    # *************************************************************************

    def self.is_attributes_model_class?(model_class)
      model_class.respond_to?(:ancestors) && model_class.ancestors.include?(Eluvia::ActiveModel::Attributes)
    end

    def self.is_attributes_model_instance?(model_instance)
      model_instance.is_a?(Eluvia::ActiveModel::Attributes)
    end

    def self.is_has_one_reference?(model_class, field_name)
      model_class.respond_to?(:has_reference?) && model_class.has_reference?(field_name, type: :has_one)
    end

    def self.is_has_many_reference?(model_class, field_name)
      model_class.respond_to?(:has_reference?) && model_class.has_reference?(field_name, type: :has_many)
    end

    # *************************************************************************
    # Active model reflection methods
    # *************************************************************************

    def self.is_active_model_class?(model_class)
      model_class.respond_to?(:ancestors) && model_class.ancestors.include?(::ActiveModel::Model)
    end

    def self.is_active_model_instance?(model_instance)
      model_instance.is_a?(::ActiveModel::Model)
    end

    # *************************************************************************
    # Active record reflection methods
    # *************************************************************************

    def self.is_active_record_class?(model_class)
      model_class.respond_to?(:ancestors) && model_class.ancestors.include?(::ActiveRecord::Base)
    end

    def self.is_active_record_instance?(model_instance)
      model_instance.is_a?(::ActiveRecord::Base)
    end

    def self.is_belongs_to_association?(model_class, field_name)
      is_active_record_class?(model_class) && model_class.reflect_on_association(field_name.to_sym)&.macro == :belongs_to
    end

    def self.is_has_one_association?(model_class, field_name)
      is_active_record_class?(model_class) && model_class.reflect_on_association(field_name.to_sym)&.macro == :has_one
    end

    def self.is_has_many_association?(model_class, field_name)
      is_active_record_class?(model_class) && model_class.reflect_on_association(field_name.to_sym)&.macro == :has_many
    end

  end
end
