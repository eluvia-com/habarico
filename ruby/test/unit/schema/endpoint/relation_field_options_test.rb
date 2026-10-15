require "test_helper"

module Habarico
  class RelationFieldOptionsTest < Minitest::Test

    def test_accepts_show_link
      opts = RelationFieldOptions.new(show_link: true)
      assert_equal true, opts.show_link
    end

    def test_accepts_link_mode
      opts = RelationFieldOptions.new(link_mode: "dialog")
      assert_equal "dialog", opts.link_mode
    end

    def test_accepts_dialog_width
      opts = RelationFieldOptions.new(dialog_width: "sm")
      assert_equal "sm", opts.dialog_width
    end

    def test_accepts_keep_linked_parent
      opts = RelationFieldOptions.new(keep_linked_parent: true)
      assert_equal true, opts.keep_linked_parent
    end

    def test_accepts_show_edit_button
      opts = RelationFieldOptions.new(show_edit_button: true)
      assert_equal true, opts.show_edit_button
    end

    def test_accepts_show_create_button
      opts = RelationFieldOptions.new(show_create_button: true)
      assert_equal true, opts.show_create_button
    end

    def test_accepts_preserve_order
      opts = RelationFieldOptions.new(preserve_order: false)
      assert_equal false, opts.preserve_order
    end

    def test_accepts_filters
      filters = [KeyValue.new(key: "status", value: "active")]
      opts = RelationFieldOptions.new(filters: filters)
      assert_equal filters, opts.filters
    end

    def test_accepts_sort
      sort = SortDescriptor.new(field_name: "name", direction: "asc")
      opts = RelationFieldOptions.new(sort: sort)
      assert_equal sort, opts.sort
    end

    def test_accepts_parent
      opts = RelationFieldOptions.new(parent: "category")
      assert_equal "category", opts.parent
    end

    def test_defaults_are_nil
      opts = RelationFieldOptions.new
      assert_nil opts.show_link
      assert_nil opts.link_mode
      assert_nil opts.dialog_width
      assert_nil opts.keep_linked_parent
      assert_nil opts.show_edit_button
      assert_nil opts.show_create_button
      assert_nil opts.preserve_order
      assert_nil opts.filters
      assert_nil opts.sort
      assert_nil opts.parent
    end

    def test_all_options_together
      sort = SortDescriptor.new(field_name: "created_at", direction: "desc")
      filters = [KeyValue.new(key: "type", value: "article")]
      opts = RelationFieldOptions.new(
        show_link: true,
        link_mode: "redirect",
        dialog_width: "md",
        keep_linked_parent: false,
        show_edit_button: true,
        show_create_button: true,
        preserve_order: true,
        filters: filters,
        sort: sort,
      )
      assert_equal true, opts.show_link
      assert_equal "redirect", opts.link_mode
      assert_equal "md", opts.dialog_width
      assert_equal false, opts.keep_linked_parent
      assert_equal true, opts.show_edit_button
      assert_equal true, opts.show_create_button
      assert_equal true, opts.preserve_order
      assert_equal filters, opts.filters
      assert_equal sort, opts.sort
    end

    def test_all_options_with_parent
      opts = RelationFieldOptions.new(show_link: true, parent: "category")
      assert_equal true, opts.show_link
      assert_equal "category", opts.parent
    end

  end
end
