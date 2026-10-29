module Habarico
  class FieldOptions
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes
    include Eluvia::ActiveModel::EnumAttribute

    # Prefix to add before the field value
    string_attr :prefix

    # Postfix to add after the field value
    string_attr :postfix

    # Alignment of the field value
    string_attr :text_align
    enum_attr :text_align, Types::TEXT_ALIGN_TYPE

    # Where the field's link opens when the value is clicked. Stored without the leading underscore
    # ('blank', not '_blank') - the frontend prepends it when rendering the anchor.
    # Unrelated to a box's 'target', which names the nested attribute or foreign key.
    string_attr :target
    enum_attr :target, Types::LINK_TARGET_TYPE

    # Options for formatting the number values
    has_one_attr :number, 'Habarico::NumberFieldOptions'

    # Options for dynamic rendering of the field value
    has_one_attr :dynamic_render, 'Habarico::DynamicRenderOptions'

    # Options for relation fields (how the related resource is displayed and linked)
    has_one_attr :relation, 'Habarico::RelationFieldOptions'

    # Options for the phone number field
    has_one_attr :phone, 'Habarico::PhoneFieldOptions'

    # Options for choices fields (icon lookup, etc.)
    has_one_attr :choices, 'Habarico::ChoicesFieldOptions'

    # Options for image fields (resizing, cropping)
    has_one_attr :image, 'Habarico::ImageFieldOptions'

    # Options for AI-generated fields
    has_one_attr :ai, 'Habarico::AiFieldOptions'

    # Largest file (bytes) the frontend accepts for this field, checked before the upload starts.
    # Derived from a `file_attr`'s own `active_storage_validations` size declaration (HAB-966); see
    # `Habarico::FileRulesResolver`. `habarico_enterprise.uploads` additionally folds in its
    # project-wide `Config.max_upload_size` ceiling for a field a chunked-upload provider serves.
    integer_attr :max_size

    # File types the frontend accepts for this field, checked before the upload starts. Derived
    # from a `file_attr`'s own `active_storage_validations` content-type declaration (HAB-966); see
    # `Habarico::FileRulesResolver`.
    has_many_attr :accept, 'String'

  end
end
