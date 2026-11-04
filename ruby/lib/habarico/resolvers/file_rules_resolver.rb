require 'marcel'

module Habarico
  # The file rules of one `file_attr` or `file_array_attr`: the allowed content types and the largest size its
  # `active_storage_validations` declarations admit - the rules a value is measured against, never
  # a value's own claimed properties. `allowed_content_types` is nil when the field declares no
  # content-type restriction; `max_size` is nil when it declares no upper bound.
  FileRules = Struct.new(:allowed_content_types, :max_size, keyword_init: true) do
    # The `accept` field-schema option, or nil when the content types have no client-checkable
    # form.
    #
    # The frontend matches an entry as a filename extension, a concrete media type or a `type/*`
    # wildcard (`isFileAccepted`), so concrete Marcel-normalized types map over directly. A
    # `Regexp` entry has no such form, and dropping just the regex entries would leave a list
    # *stricter* than the server's - refusing client-side what would otherwise be accepted - so a
    # field declaring one advertises nothing and lets the server alone decide.
    def accept
      return nil if allowed_content_types.blank?
      return nil if allowed_content_types.any? { |type| type.is_a?(::Regexp) }

      allowed_content_types.map(&:to_s)
    end
  end

  # No declarations at all - what an unknown model, an attribute that is not a file field, or a
  # host without `active_storage_validations` resolves to.
  FileRules::NONE = FileRules.new(allowed_content_types: nil, max_size: nil).freeze

  # Resolves the `FileRules` of a model's `file_attr` or `file_array_attr` from the host's
  # `active_storage_validations` declarations on its `underlying_attachment` /
  # `underlying_attachments`. Mirrors the Python package's
  # `habarico.validators.content_types` / `habarico.validators.files`.
  #
  # `active_storage_validations` is deliberately NOT a dependency of this gem: a host that does not
  # use it simply declares no such validators, and every attribute resolves to `FileRules::NONE`.
  class FileRulesResolver
    def initialize(model)
      @model = model
    end

    # The `FileRules` of `attr_name`; `FileRules::NONE` when there is nothing to derive: no model,
    # the attribute is neither file field or has no underlying attachment, or
    # `active_storage_validations` is not installed. An image `file_array_attr` keeps only the
    # image types of its attachment's declaration, which may be shared with a file array filtered
    # to the other types.
    def resolve(attr_name)
      return FileRules::NONE if @model.nil? || attr_name.blank?
      return FileRules::NONE unless @model.respond_to?(:validators_on)

      attachment, images_only = underlying_attachment(attr_name)
      return FileRules::NONE if attachment.blank?

      validators = @model.validators_on(attachment)
      content_types = content_types_from(validators)
      content_types = image_content_types(content_types) if images_only
      FileRules.new(allowed_content_types: content_types, max_size: max_size_from(validators))
    end

    private

    # The attachment name behind a file attribute, and whether only its image types apply.
    def underlying_attachment(attr_name)
      if @model.respond_to?(:has_file_attr?) && @model.has_file_attr?(attr_name)
        [@model.find_file_attr(attr_name)&.fetch(:underlying_attachment, nil), false]
      elsif @model.respond_to?(:has_file_array_attr?) && @model.has_file_array_attr?(attr_name)
        spec = @model.find_file_array_attr(attr_name)
        [spec[:underlying_attachments], spec[:nature] == :image]
      end
    end

    def image_content_types(content_types)
      return nil if content_types.nil?

      content_types.select { |type| type.is_a?(::Regexp) || type.to_s.start_with?('image/') }.presence
    end

    # The allowed content types of an `ActiveStorageValidations::ContentTypeValidator`, normalized
    # through Marcel exactly as the validator itself does at save time (`:png` and `'png'` both
    # become `'image/png'`), or nil when the field declares none.
    #
    # A `Proc` option is resolved by the gem per-record (`ASVOptionable#set_flat_options`); there
    # is no record yet at schema-generation time, so a field declaring one yields nil - the
    # validator itself still runs on save.
    def content_types_from(validators)
      validator = find_validator(validators, 'ContentTypeValidator')
      return nil if validator.nil?

      declared = Array(validator.options[:with]) + Array(validator.options[:in])
      return nil if declared.empty? || declared.any? { |type| type.is_a?(::Proc) }

      declared.filter_map do |type|
        case type
        when ::String, ::Symbol then ::Marcel::MimeType.for(declared_type: type.to_s, extension: type.to_s)
        when ::Regexp then type
        end
      end.presence
    end

    # The inclusive upper bound of an `ActiveStorageValidations::SizeValidator`, or nil when the
    # field declares no upper bound (a `greater_than*`-only validator, a `Proc`, or a non-integer
    # range). `less_than: n` becomes `n - 1` so the ceiling here is exactly the one the validator
    # itself would enforce on save.
    #
    # The gem's `check_validity!` guarantees exactly one of these options is present.
    def max_size_from(validators)
      validator = find_validator(validators, 'SizeValidator')
      return nil if validator.nil?

      options = validator.options
      return nil if options.values.any? { |value| value.is_a?(::Proc) }

      range = options[:between]
      return integer_bound(range.max) if range.is_a?(::Range) && range.first.is_a?(::Integer)
      return integer_bound(options[:less_than])&.pred if options[:less_than]

      integer_bound(options[:less_than_or_equal_to] || options[:equal_to])
    end

    def integer_bound(value)
      value.is_a?(::Integer) ? value : nil
    end

    # nil unless `active_storage_validations` is installed - the gem requires every validator
    # eagerly from its entry point, so the constant is defined as soon as it is loaded at all.
    def find_validator(validators, class_name)
      full_name = "ActiveStorageValidations::#{class_name}"
      return nil unless ::Object.const_defined?(full_name)

      klass = full_name.constantize
      validators.find { |validator| validator.is_a?(klass) }
    end
  end
end
