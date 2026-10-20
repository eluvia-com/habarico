module Habarico
  # Shared enum value lists.
  #
  # Every constant here mirrors one enum entity of the OpenAPI contract (`doc/openapi.yaml`) and is
  # named after it, so the two can be matched one to one. Schema classes reference these instead of
  # repeating the values inline, which is what used to let the same enum drift apart between classes.
  #
  # The values are the ones Ruby has always sent - aligning them with the contract (Ruby is missing
  # `export` and `ai-assistant` in ACTION_TYPE and `decimal` / `tree-relation` in FIELD_FORMAT_TYPE)
  # is tracked separately, see HAB-708 section 6.
  module Types

    # Four lists below are deliberately *not* frozen and carry a `Style/MutableConstant` disable:
    # `Types.register` appends to them when a pro/enterprise gem contributes a value (HAB-812).
    # Freezing them would make that extension point impossible. Every other list is frozen,
    # because it mirrors a closed enum of the OpenAPI contract that nothing may widen.

    # ColorType - MUI colour palette shared by actions, action descriptors and enum items
    COLOR_TYPE = %i[primary secondary success error warning info inherit].freeze

    # FieldType - data type of a field or filter
    FIELD_TYPE = %i[string number integer boolean array object]  # rubocop:disable Style/MutableConstant

    # FieldFormatType - format applied to a field or filter on top of its data type
    # rubocop:disable-next Style/MutableConstant
    FIELD_FORMAT_TYPE = %i[date date-time time text rich-text email url password
                           base64-image base64-file uuid relation choices search phone
                           czech-bank-account czech-ico czech-dic czech-birth-number
                           ai ai-text range]

    # BoxType - layout container types
    BOX_TYPE = %i[tab tab-item wizard simple list object array grid grid-item gallery]  # rubocop:disable Style/MutableConstant

    # ViewType - kind of the view
    VIEW_TYPE = %i[list show create edit action].freeze

    # ViewModeType - how a view is presented when opened by a trigger
    VIEW_MODE_TYPE = %i[redirect dialog sidepanel].freeze

    # ActionType - kind of the action
    ACTION_TYPE = %i[view link resource save upload-files]  # rubocop:disable Style/MutableConstant

    # MenuType - kind of the menu item
    MENU_TYPE = %i[link view text].freeze

    # RequestMethodType - HTTP method of an endpoint
    REQUEST_METHOD_TYPE = %i[get post patch put delete].freeze

    # SortDirectionType - direction of a sort descriptor
    SORT_DIRECTION_TYPE = %i[asc desc].freeze

    # LinkTargetType - where a link action opens
    LINK_TARGET_TYPE = %i[self blank].freeze

    # TextAlignType - horizontal alignment of a field value
    TEXT_ALIGN_TYPE = %i[left center right].freeze

    # *************************************************************************
    # Extension point: registering additional values (HAB-812)
    # *************************************************************************

    # Lists a pro/enterprise gem may extend. The rest stay frozen: they mirror a closed enum of
    # the OpenAPI contract (`doc/openapi.yaml`) that no gem may widen on its own.
    #
    # The whole vocabulary stays in the free core - including values with no Ruby implementation
    # yet (`upload-files`, `ai`, `ai-text`). The names are a contract shared with the frontend;
    # what is paid is the implementation behind them, not the name.
    EXTENSIBLE = %i[FIELD_TYPE FIELD_FORMAT_TYPE BOX_TYPE ACTION_TYPE].freeze

    class << self
      # Schema classes whose `enum_attr` was declared from a list, as
      # `{ list_name => [[klass, attr_name], ...] }`. Filled by `ExtensibleEnum`.
      def consumers
        @consumers ||= Hash.new { |hash, key| hash[key] = [] }
      end

      # Add values to an extensible list and re-declare the enum on every schema class built from
      # it. The re-declaration is what makes this work at all: `enum_attr` copies the choices into
      # the class when it is called, so appending to the array alone would change nothing.
      #
      #   Habarico::Types.register(:FIELD_FORMAT_TYPE, :signature)
      #
      # Raises when the list is not extensible or the value is already there.
      def register(list_name, *values)
        list_name = list_name.to_sym
        unless EXTENSIBLE.include?(list_name)
          raise ArgumentError, "#{list_name} is not extensible. Extensible lists: #{EXTENSIBLE.join(', ')}."
        end

        list = const_get(list_name)
        values.map!(&:to_sym)
        duplicates = values & list
        raise ArgumentError, "#{list_name} already contains #{duplicates.join(', ')}." if duplicates.any?

        list.concat(values)
        consumers[list_name].each { |klass, attr_name| klass.enum_attr(attr_name, list) }
        list
      end
    end

  end
end
