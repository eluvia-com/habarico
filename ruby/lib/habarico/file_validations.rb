require 'marcel'

module Habarico
  # Per-field file validations, read from the host's `active_storage_validations` declarations on
  # a `file_attr`'s `underlying_attachment` (HAB-966). Mirrors the Python package's
  # `habarico.validators.content_types` / `habarico.validators.files`.
  #
  # `active_storage_validations` is deliberately NOT a dependency of this gem: a host that does not
  # use it simply declares no such validators, and `for_model` resolves to `NONE`. Not upload-
  # specific either - `habarico_enterprise.uploads` folds in its own project-wide size ceiling and
  # content-type blocklist on top of this for a field a chunked-upload provider actually serves,
  # but this module alone is what fills `max_size` / `accept` for every `file_attr`, enterprise or
  # not.
  module FileValidations

    # What one field's declarations amount to - the *rules* a value is measured against, never a
    # value's own claimed properties. `allowed_content_types` is nil when the field declares no
    # content-type restriction; `max_size` is nil when it declares no upper bound.
    Rules = Struct.new(:allowed_content_types, :max_size, keyword_init: true)

    # No declarations at all - what an unknown model, a non-`file_attr` attribute, or a host
    # without `active_storage_validations` resolves to.
    NONE = Rules.new(allowed_content_types: nil, max_size: nil).freeze

    # ***********************************************************************
    # Derivation
    # ***********************************************************************

    # The `Rules` for one `file_attr`, derived from the model class schema generation already has
    # in hand. Returns `NONE` when there is nothing to derive: no model, the attribute is not a
    # `file_attr` or has no `underlying_attachment`, or `active_storage_validations` is not
    # installed.
    def self.for_model(model, attr_name)
      return NONE if model.nil? || attr_name.blank?
      return NONE unless model.respond_to?(:has_file_attr?) && model.has_file_attr?(attr_name)
      return NONE unless model.respond_to?(:validators_on)

      attachment = model.find_file_attr(attr_name)&.fetch(:underlying_attachment, nil)
      return NONE if attachment.blank?

      validators = model.validators_on(attachment)
      Rules.new(allowed_content_types: content_types_from(validators), max_size: max_size_from(validators))
    end

    # The `accept` field-schema option for a field's `allowed_content_types`, or nil when they have
    # no client-checkable form.
    #
    # The frontend matches an entry as a filename extension, a concrete media type or a `type/*`
    # wildcard (`isFileAccepted`), so concrete Marcel-normalized types map over directly. A
    # `Regexp` entry has no such form, and dropping just the regex entries would leave a list
    # *stricter* than the server's - refusing client-side what would otherwise be accepted - so a
    # field declaring one advertises nothing and lets the server alone decide.
    def self.accept_for(content_types)
      return nil if content_types.blank?
      return nil if content_types.any? { |type| type.is_a?(::Regexp) }

      content_types.map(&:to_s)
    end

    # The allowed content types of an `ActiveStorageValidations::ContentTypeValidator`, normalized
    # through Marcel exactly as the validator itself does at save time (`:png` and `'png'` both
    # become `'image/png'`), or nil when the field declares none.
    #
    # A `Proc` option is resolved by the gem per-record (`ASVOptionable#set_flat_options`); there
    # is no record yet at schema-generation time, so a field declaring one yields nil - the
    # validator itself still runs on save.
    def self.content_types_from(validators)
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
    def self.max_size_from(validators)
      validator = find_validator(validators, 'SizeValidator')
      return nil if validator.nil?

      options = validator.options
      return nil if options.values.any? { |value| value.is_a?(::Proc) }

      range = options[:between]
      return integer_bound(range.max) if range.is_a?(::Range) && range.first.is_a?(::Integer)
      return integer_bound(options[:less_than])&.pred if options[:less_than]

      integer_bound(options[:less_than_or_equal_to] || options[:equal_to])
    end

    def self.integer_bound(value)
      value.is_a?(::Integer) ? value : nil
    end

    # nil unless `active_storage_validations` is installed - the gem requires every validator
    # eagerly from its entry point, so the constant is defined as soon as it is loaded at all.
    def self.find_validator(validators, class_name)
      full_name = "ActiveStorageValidations::#{class_name}"
      return nil unless ::Object.const_defined?(full_name)

      klass = full_name.constantize
      validators.find { |validator| validator.is_a?(klass) }
    end

    private_class_method :content_types_from, :max_size_from, :integer_bound, :find_validator

  end
end
