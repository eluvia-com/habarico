module Habarico
  class FieldOptionsGenerator < AbstractGenerator

    def generate(model, attr_name, field_reference)
      if field_reference.present?
        return Habarico::FieldOptions.new(
          prefix: generate_prefix_fr(model, field_reference),
          postfix: generate_postfix_fr(model, field_reference),
          text_align: generate_text_align_fr(model, field_reference),
          target: generate_target_fr(model, field_reference),
          number: generate_number_fr(model, field_reference),
          dynamic_render: generate_dynamic_render_fr(model, field_reference),
          relation: generate_relation_fr(model, field_reference),
          phone: generate_phone_fr(model, field_reference),
          choices: generate_choices_fr(model, field_reference),
          image: generate_image_fr(model, field_reference),
          ai: generate_ai_fr(model, field_reference),
          max_size: generate_max_size_fr(model, field_reference),
          accept: generate_accept_fr(model, field_reference),
        )
      end
      if attr_name.present?
        return Habarico::FieldOptions.new(
          prefix: generate_prefix_at(model, attr_name),
          postfix: generate_postfix_at(model, attr_name),
          text_align: generate_text_align_at(model, attr_name),
          target: generate_target_at(model, attr_name),
          number: generate_number_at(model, attr_name),
          dynamic_render: generate_dynamic_render_at(model, attr_name),
          max_size: generate_max_size_at(model, attr_name),
          accept: generate_accept_at(model, attr_name),
        )
      end
      nil
    end

    protected

    # ***********************************************************************
    # Schema generators
    # ***********************************************************************

    def number_field_options_generator
      @number_field_options_generator ||= definition.number_field_options_generator.new(definition, resource_path)
    end

    def dynamic_render_options_generator
      @dynamic_render_options_generator ||= definition.dynamic_render_options_generator.new(definition, resource_path)
    end

    def relation_field_options_generator
      @relation_field_options_generator ||= definition.relation_field_options_generator.new(definition, resource_path)
    end

    # Memoized per `(model, attr_name)` so `generate_max_size_*` and `generate_accept_*` - two
    # independent generator methods, called separately for the same field - derive it only once
    # instead of each re-running `model.validators_on(attachment)` and the Marcel content-type
    # guess for the half of the result the other one does not need.
    def file_rules(model, attr_name)
      @file_rules ||= {}
      @file_rules[[model, attr_name]] ||= Habarico::FileRulesResolver.new(model).resolve(attr_name)
    end

    def phone_field_options_generator
      @phone_field_options_generator ||= definition.phone_field_options_generator.new(definition, resource_path)
    end

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_prefix_at(_model, _attr_name)
      # not implemented yet
    end

    def generate_postfix_at(_model, _attr_name)
      # not implemented yet
    end

    def generate_text_align_at(model, attr_name)
      return 'right' if Habarico::AttributesHelper.is_amount_major_attr?(model, attr_name)
      nil
    end

    def generate_target_at(_model, _attr_name)
      # not implemented yet
    end

    def generate_number_at(model, attr_name)
      number_field_options_generator.generate(model, attr_name)
    end

    def generate_dynamic_render_at(_model, _attr_name)
      nil # not possible to generate dynamic render without FieldReference
    end

    # Largest file (bytes) this file field accepts, derived from its own
    # `active_storage_validations` size declaration (HAB-966). `habarico_enterprise.uploads`, when
    # installed, additionally folds in the project-wide upload size ceiling for a field a
    # chunked-upload provider serves - see `Habarico::FileRulesResolver`.
    #
    # A bare symbol declaration has no `FieldReference` to set an explicit override on - see
    # `generate_max_size_fr` for that.
    def generate_max_size_at(model, attr_name)
      file_rules(model, attr_name).max_size
    end

    # File types this file field accepts, derived from its own `active_storage_validations`
    # content-type declaration (HAB-966).
    def generate_accept_at(model, attr_name)
      file_rules(model, attr_name).accept
    end

    def generate_prefix_fr(_model, _field_reference)
      # not implemented yet
    end

    def generate_postfix_fr(_model, _field_reference)
      # not implemented yet
    end

    def generate_text_align_fr(_model, field_reference)
      field_reference.text_align
    end

    def generate_target_fr(_model, field_reference)
      field_reference.target
    end

    def generate_number_fr(_model, _field_reference)
      # not implemented yet
    end

    def generate_dynamic_render_fr(model, field_reference)
      dynamic_render_options_generator.generate(model, field_reference)
    end

    def generate_relation_fr(model, field_reference)
      relation_field_options_generator.generate(model, field_reference)
    end

    def generate_phone_fr(model, field_reference)
      phone_field_options_generator.generate(model, field_reference)
    end

    def generate_choices_fr(_model, field_reference)
      icons_key = field_reference.icons_key
      return nil if icons_key.blank?
      Habarico::ChoicesFieldOptions.new(icons_key: icons_key)
    end

    def generate_image_fr(_model, field_reference)
      resize_width = field_reference.resize_width
      crop_aspect_ratio = field_reference.crop_aspect_ratio
      return nil if resize_width.blank? && crop_aspect_ratio.blank?
      Habarico::ImageFieldOptions.new(resize_width: resize_width, crop_aspect_ratio: crop_aspect_ratio)
    end

    def generate_ai_fr(_model, field_reference)
      source_fields = field_reference.ai_source_fields
      return nil if source_fields.blank?
      Habarico::AiFieldOptions.new(source_fields: source_fields)
    end

    # `field_reference.max_size` is a deliberate override, the same way `resize_width` /
    # `icons_key` above are - set by hand it always wins over what the attachment's own validators
    # imply.
    def generate_max_size_fr(model, field_reference)
      return field_reference.max_size if field_reference.max_size.present?
      file_rules(model, field_reference.name).max_size
    end

    def generate_accept_fr(model, field_reference)
      return field_reference.accept if field_reference.accept.present?
      file_rules(model, field_reference.name).accept
    end

  end
end
