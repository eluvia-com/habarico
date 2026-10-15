require_relative '../../test_helper'

module Habarico
  # Extension point 2 (HAB-812): the four lists a pro/enterprise gem may extend.
  #
  # `enum_attr` copies the choices into the schema class when it is declared, so appending to the
  # array alone would change nothing - `Types.register` has to re-declare the enum on every
  # consumer, and that is what these tests pin down.
  class TypesRegistryTest < Minitest::Test

    def teardown
      %i[FIELD_TYPE FIELD_FORMAT_TYPE BOX_TYPE ACTION_TYPE].each do |list_name|
        Types.const_get(list_name).delete(:"test-only-value")
      end
      Habarico::FieldSchema.enum_attr(:format, Types::FIELD_FORMAT_TYPE)
      Habarico::FilterSchema.enum_attr(:format, Types::FIELD_FORMAT_TYPE)
      Habarico::FieldSchema.enum_attr(:type, Types::FIELD_TYPE)
      Habarico::FilterSchema.enum_attr(:type, Types::FIELD_TYPE)
      Habarico::BoxSchema.enum_attr(:type, Types::BOX_TYPE)
      Habarico::ActionSchema.enum_attr(:type, Types::ACTION_TYPE)
    end

    # --- what may be extended -------------------------------------------------

    def test_extensible_lists_are_not_frozen
      Types::EXTENSIBLE.each do |list_name|
        refute Types.const_get(list_name).frozen?, "#{list_name} must stay extendable"
      end
    end

    def test_closed_lists_stay_frozen
      %i[VIEW_TYPE VIEW_MODE_TYPE MENU_TYPE REQUEST_METHOD_TYPE SORT_DIRECTION_TYPE
         COLOR_TYPE LINK_TARGET_TYPE TEXT_ALIGN_TYPE].each do |list_name|
        assert Types.const_get(list_name).frozen?, "#{list_name} mirrors a closed contract enum"
      end
    end

    def test_registering_into_a_closed_list_raises
      error = assert_raises(ArgumentError) { Types.register(:VIEW_TYPE, :"test-only-value") }

      assert_includes error.message, 'not extensible'
    end

    def test_registering_a_duplicate_raises
      error = assert_raises(ArgumentError) { Types.register(:FIELD_FORMAT_TYPE, :date) }

      assert_includes error.message, 'already contains'
    end

    # --- the value reaches the schema classes ---------------------------------

    # `enum_attr` registers the choice metadata (value, label, colour) a schema class knows about;
    # it declares no validation, so `find_enum_attr` is what tells us the value arrived.
    def test_registered_field_format_reaches_field_schema
      refute_includes Habarico::FieldSchema.find_enum_attr(:format).keys, 'test-only-value'

      Types.register(:FIELD_FORMAT_TYPE, :"test-only-value")

      assert_includes Types::FIELD_FORMAT_TYPE, :"test-only-value"
      assert_includes Habarico::FieldSchema.find_enum_attr(:format).keys, 'test-only-value'
    end

    def test_registered_field_format_reaches_filter_schema
      Types.register(:FIELD_FORMAT_TYPE, :"test-only-value")

      assert_includes Habarico::FilterSchema.find_enum_attr(:format).keys, 'test-only-value'
    end

    def test_registered_field_type_reaches_both_schemas
      Types.register(:FIELD_TYPE, :"test-only-value")

      assert_includes Habarico::FieldSchema.find_enum_attr(:type).keys, 'test-only-value'
      assert_includes Habarico::FilterSchema.find_enum_attr(:type).keys, 'test-only-value'
    end

    def test_registered_box_type_is_accepted_by_box_schema
      Types.register(:BOX_TYPE, :"test-only-value")

      assert_includes Habarico::BoxSchema.find_enum_attr(:type).keys, 'test-only-value'
    end

    def test_registered_action_type_is_accepted_by_action_schema
      Types.register(:ACTION_TYPE, :"test-only-value")

      assert_includes Habarico::ActionSchema.find_enum_attr(:type).keys, 'test-only-value'
    end

    def test_register_returns_the_updated_list
      result = Types.register(:BOX_TYPE, :"test-only-value")

      assert_equal Types::BOX_TYPE, result
    end
  end
end
