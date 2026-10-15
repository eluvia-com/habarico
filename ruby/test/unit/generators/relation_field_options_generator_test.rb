require "test_helper"

module Habarico
  class RelationFieldOptionsGeneratorTest < Minitest::Test

    def setup
      @definition = Definition.new
      @definition.model = nil
      @generator = RelationFieldOptionsGenerator.new(@definition, "test_resource")
    end

    def test_returns_nil_when_relation_is_blank
      fr = FieldReference.new(name: "author")
      result = @generator.generate(nil, fr)
      assert_nil result
    end

    def test_builds_from_hash_with_show_link
      fr = FieldReference.new(name: "author", relation: { show_link: true })
      result = @generator.generate(nil, fr)
      assert_instance_of RelationFieldOptions, result
      assert_equal true, result.show_link
    end

    def test_builds_from_hash_with_link_mode
      fr = FieldReference.new(name: "author", relation: { link_mode: "dialog" })
      result = @generator.generate(nil, fr)
      assert_equal "dialog", result.link_mode
    end

    def test_builds_from_hash_with_dialog_width
      fr = FieldReference.new(name: "author", relation: { link_mode: "dialog", dialog_width: "sm" })
      result = @generator.generate(nil, fr)
      assert_equal "sm", result.dialog_width
    end

    def test_builds_from_hash_with_all_boolean_options
      fr = FieldReference.new(name: "tags", relation: {
        show_link: true,
        keep_linked_parent: false,
        show_edit_button: true,
        show_create_button: true,
        preserve_order: true,
      })
      result = @generator.generate(nil, fr)
      assert_equal true, result.show_link
      assert_equal false, result.keep_linked_parent
      assert_equal true, result.show_edit_button
      assert_equal true, result.show_create_button
      assert_equal true, result.preserve_order
    end

    def test_builds_from_hash_with_filters
      fr = FieldReference.new(name: "tags", relation: {
        filters: [{ key: "status", value: "active" }]
      })
      result = @generator.generate(nil, fr)
      assert_equal 1, result.filters.length
      assert_instance_of KeyValue, result.filters.first
      assert_equal "status", result.filters.first.key
      assert_equal "active", result.filters.first.value
    end

    def test_builds_from_hash_with_sort_as_hash
      fr = FieldReference.new(name: "tags", relation: {
        sort: { field_name: "name", direction: "asc" }
      })
      result = @generator.generate(nil, fr)
      assert_instance_of SortDescriptor, result.sort
      assert_equal "name", result.sort.field_name
      assert_equal "asc", result.sort.direction
    end

    def test_builds_from_hash_with_sort_as_string
      fr = FieldReference.new(name: "user", relation: { sort: "email:asc" })
      result = @generator.generate(nil, fr)
      assert_instance_of SortDescriptor, result.sort
      assert_equal "email", result.sort.field_name
      assert_equal "asc", result.sort.direction
    end

    def test_builds_from_hash_with_sort_as_string_desc
      fr = FieldReference.new(name: "user", relation: { sort: "created_at:desc" })
      result = @generator.generate(nil, fr)
      assert_equal "created_at", result.sort.field_name
      assert_equal "desc", result.sort.direction
    end

    def test_returns_nil_for_relation_options_object
      existing = RelationFieldOptions.new(show_link: true, link_mode: "redirect")
      fr = FieldReference.new(name: "author", relation: existing)
      result = @generator.generate(nil, fr)
      assert_nil result
    end

    def test_returns_nil_for_unsupported_relation_type
      fr = FieldReference.new(name: "author", relation: "invalid")
      result = @generator.generate(nil, fr)
      assert_nil result
    end

    def test_builds_with_parent_from_field_reference
      fr = FieldReference.new(name: "subcategory", parent: "category")
      result = @generator.generate(nil, fr)
      assert_instance_of RelationFieldOptions, result
      assert_equal "category", result.parent
    end

    def test_builds_with_parent_in_relation_hash
      fr = FieldReference.new(name: "subcategory", relation: { parent: "category", show_link: true })
      result = @generator.generate(nil, fr)
      assert_instance_of RelationFieldOptions, result
      assert_equal "category", result.parent
      assert_equal true, result.show_link
    end

    def test_parent_from_relation_hash_takes_precedence_over_field_reference
      fr = FieldReference.new(name: "subcategory", relation: { parent: "from_hash" }, parent: "from_fr")
      result = @generator.generate(nil, fr)
      assert_equal "from_hash", result.parent
    end

    def test_returns_nil_when_both_relation_and_parent_are_blank
      fr = FieldReference.new(name: "author")
      result = @generator.generate(nil, fr)
      assert_nil result
    end

  end
end
