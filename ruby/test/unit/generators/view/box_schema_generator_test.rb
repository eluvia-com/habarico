require 'test_helper'

class BoxSchemaGeneratorTest < Minitest::Test

  def stub_model
    model = Object.new
    model.define_singleton_method(:primary_key) { 'id' }
    model.define_singleton_method(:model_name) { ActiveModel::Name.new(model, nil, 'Thing') }
    model.define_singleton_method(:i18n_scope) { :activerecord }
    model.define_singleton_method(:columns_hash) { {} }
    model.define_singleton_method(:reflect_on_association) { |_| nil }
    model
  end

  def stub_context
    ctx = Object.new
    ctx.define_singleton_method(:can?) { |_permission| true }
    ctx
  end

  def build_definition
    definition = Habarico::Definition.new
    definition.model = stub_model
    definition.label = 'Things'
    definition.views = []
    definition.actions = []
    definition.menu_item = false
    definition
  end

  def build_generator
    Habarico::BoxSchemaGenerator.new(build_definition, ['things'])
  end

  def build_view
    Habarico::ListView.new
  end

  def build_box(attrs = {})
    box = Habarico::Box.new
    attrs.each { |k, v| box.send(:"#{k}=", v) }
    box
  end

  # ---------------------------------------------------------------------------
  # Argument validation
  # ---------------------------------------------------------------------------

  def test_raises_when_view_is_not_a_habarico_view
    assert_raises(Eluvia::Errors::StandardError) do
      build_generator.generate('not a view', Habarico::Box.new, 0, stub_context)
    end
  end

  def test_raises_when_view_is_nil
    assert_raises(Eluvia::Errors::StandardError) do
      build_generator.generate(nil, Habarico::Box.new, 0, stub_context)
    end
  end

  def test_raises_when_box_is_not_a_habarico_box
    assert_raises(Eluvia::Errors::StandardError) do
      build_generator.generate(build_view, 'not a box', 0, stub_context)
    end
  end

  def test_nil_box_does_not_raise
    result = build_generator.generate(build_view, nil, 0, stub_context)
    assert_instance_of Habarico::BoxSchema, result
  end

  def test_nil_box_defaults_to_simple_type
    result = build_generator.generate(build_view, nil, 0, stub_context)
    assert_equal 'simple', result.type
  end

  # ---------------------------------------------------------------------------
  # generate_type
  # ---------------------------------------------------------------------------

  def test_generate_type_returns_box_type
    box = build_box
    box.type = 'tab'
    assert_equal 'tab', build_generator.send(:generate_type, build_view, box, 0, stub_context)
  end

  def test_generate_type_returns_simple_for_default_box
    assert_equal 'simple', build_generator.send(:generate_type, build_view, Habarico::Box.new, 0, stub_context)
  end

  def test_generate_type_returns_list_for_list_box
    box = Habarico::ListBox.new(reference: 'items', target: 'parent_id')
    assert_equal 'list', build_generator.send(:generate_type, build_view, box, 0, stub_context)
  end

  # ---------------------------------------------------------------------------
  # generate_name
  # ---------------------------------------------------------------------------

  def test_generate_name_returns_box_name_when_set
    box = build_box(name: 'main')
    assert_equal 'main', build_generator.send(:generate_name, build_view, box, 0, stub_context)
  end

  def test_generate_name_falls_back_to_index_string_when_name_is_nil
    assert_equal '3', build_generator.send(:generate_name, build_view, Habarico::Box.new, 3, stub_context)
  end

  def test_generate_name_index_zero_produces_string_zero
    assert_equal '0', build_generator.send(:generate_name, build_view, Habarico::Box.new, 0, stub_context)
  end

  # ---------------------------------------------------------------------------
  # generate_label
  # ---------------------------------------------------------------------------

  def test_generate_label_returns_box_label
    box = build_box(label: 'Main Box')
    assert_equal 'Main Box', build_generator.send(:generate_label, build_view, box, 0, stub_context)
  end

  def test_generate_label_returns_nil_when_not_set
    assert_nil build_generator.send(:generate_label, build_view, Habarico::Box.new, 0, stub_context)
  end

  # ---------------------------------------------------------------------------
  # generate_read_only
  # ---------------------------------------------------------------------------

  def test_generate_read_only_returns_false_by_default
    assert_equal false, build_generator.send(:generate_read_only, build_view, Habarico::Box.new, 0, stub_context)
  end

  def test_generate_read_only_returns_true_when_set
    box = build_box(read_only: true)
    assert_equal true, build_generator.send(:generate_read_only, build_view, box, 0, stub_context)
  end

  def test_generate_read_only_coerces_to_boolean
    box = build_box(read_only: 'truthy')
    assert_equal true, build_generator.send(:generate_read_only, build_view, box, 0, stub_context)
  end

  # ---------------------------------------------------------------------------
  # generate_card
  # ---------------------------------------------------------------------------

  def test_generate_card_returns_nil_by_default
    assert_nil build_generator.send(:generate_card, build_view, Habarico::Box.new, 0, stub_context)
  end

  def test_generate_card_returns_false_when_disabled
    box = build_box(card: false)
    assert_equal false, build_generator.send(:generate_card, build_view, box, 0, stub_context)
  end

  def test_generate_card_returns_true_when_set
    box = build_box(card: true)
    assert_equal true, build_generator.send(:generate_card, build_view, box, 0, stub_context)
  end

  # ---------------------------------------------------------------------------
  # generate_toolbar_actions
  # ---------------------------------------------------------------------------

  def test_generate_toolbar_actions_returns_nil_by_default
    result = build_generator.send(:generate_toolbar_actions, build_view, Habarico::Box.new, 0, stub_context)
    assert_nil result
  end

  def test_generate_toolbar_actions_returns_action_descriptors_for_simple_box
    box = build_box(toolbar_actions: [Habarico::ActionReference.new(name: 'upload-files')])
    result = build_generator.send(:generate_toolbar_actions, build_view, box, 0, stub_context)
    assert_equal 1, result.size
    assert_instance_of Habarico::ActionDescriptor, result.first
    assert_equal 'upload-files', result.first.name
  end

  def test_generate_toolbar_actions_returns_box_root_descriptors_for_list_box
    box = Habarico::ListBox.new(reference: 'items', target: 'parent_id', toolbar_actions: [Habarico::ActionReference.new(name: 'refresh')])
    result = build_generator.send(:generate_toolbar_actions, build_view, box, 0, stub_context)
    assert_equal 1, result.size
    assert_instance_of Habarico::ActionDescriptor, result.first
    assert_equal 'refresh', result.first.name
  end

  # ---------------------------------------------------------------------------
  # generate_bottom_actions
  # ---------------------------------------------------------------------------

  def test_generate_bottom_actions_returns_nil_by_default
    result = build_generator.send(:generate_bottom_actions, build_view, Habarico::Box.new, 0, stub_context)
    assert_nil result
  end

  def test_generate_bottom_actions_returns_action_descriptors_when_configured
    box = build_box(bottom_actions: [Habarico::ActionReference.new(name: 'save')])
    result = build_generator.send(:generate_bottom_actions, build_view, box, 0, stub_context)
    assert_equal 1, result.size
    assert_instance_of Habarico::ActionDescriptor, result.first
    assert_equal 'save', result.first.name
  end

  # ---------------------------------------------------------------------------
  # generate_collapsible
  # ---------------------------------------------------------------------------

  def test_generate_collapsible_returns_nil_by_default
    assert_nil build_generator.send(:generate_collapsible, build_view, Habarico::Box.new, 0, stub_context)
  end

  def test_generate_collapsible_returns_string_state_when_set
    box = build_box(collapsible: :open)
    assert_equal 'open', build_generator.send(:generate_collapsible, build_view, box, 0, stub_context)
  end

  # ---------------------------------------------------------------------------
  # generate_boxes
  # ---------------------------------------------------------------------------

  def test_generate_boxes_returns_nil_when_no_boxes_on_box_or_view
    view = build_view  # view.boxes is nil
    box = Habarico::Box.new  # box.boxes is nil
    assert_nil build_generator.send(:generate_boxes, view, box, 0, stub_context)
  end

  def test_generate_boxes_returns_nil_when_box_boxes_is_empty
    view = build_view
    box = build_box(boxes: [])
    assert_nil build_generator.send(:generate_boxes, view, box, 0, stub_context)
  end

  def test_generate_boxes_uses_box_boxes_over_view_boxes
    view = Habarico::ListView.new
    view.boxes = ['name']
    box = build_box(boxes: ['title'])
    result = build_generator.send(:generate_boxes, view, box, 0, stub_context)
    assert_equal 1, result.size
    assert_equal 'title', result[0].name
  end

  def test_generate_boxes_uses_view_boxes_when_box_boxes_is_nil
    view = Habarico::ListView.new
    view.boxes = ['title']
    result = build_generator.send(:generate_boxes, view, Habarico::Box.new, 0, stub_context)
    assert_equal 1, result.size
    assert_instance_of Habarico::FieldDescriptor, result[0]
  end

  def test_generate_boxes_returns_field_descriptors_for_string_field_names
    box = build_box(boxes: %w[title name])
    result = build_generator.send(:generate_boxes, build_view, box, 0, stub_context)
    assert_equal 2, result.size
    assert_instance_of Habarico::FieldDescriptor, result[0]
    assert_instance_of Habarico::FieldDescriptor, result[1]
    assert_equal 'title', result[0].name
    assert_equal 'name', result[1].name
  end

  def test_generate_boxes_returns_box_schemas_for_box_instances
    box = build_box(boxes: [Habarico::Box.new])
    result = build_generator.send(:generate_boxes, build_view, box, 0, stub_context)
    assert_equal 1, result.size
    assert_instance_of Habarico::BoxSchema, result[0]
  end

  def test_generate_boxes_handles_mixed_field_and_box_children
    box = build_box(boxes: ['title', Habarico::Box.new])
    result = build_generator.send(:generate_boxes, build_view, box, 0, stub_context)
    assert_equal 2, result.size
    assert_instance_of Habarico::FieldDescriptor, result[0]
    assert_instance_of Habarico::BoxSchema, result[1]
  end

  def test_generate_boxes_assigns_sequential_index_to_child_boxes
    child1 = Habarico::Box.new
    child2 = Habarico::Box.new
    box = build_box(boxes: [child1, child2])
    result = build_generator.send(:generate_boxes, build_view, box, 0, stub_context)
    assert_equal 2, result.size
    assert_equal '0', result[0].name
    assert_equal '1', result[1].name
  end

  # ---------------------------------------------------------------------------
  # generate_grid_item
  # ---------------------------------------------------------------------------

  def test_generate_grid_item_returns_nil_for_box_without_placement
    assert_nil build_generator.send(:generate_grid_item, build_view, Habarico::Box.new, 0, stub_context)
  end

  def test_generate_grid_item_returns_nil_for_list_box_without_placement
    assert_nil build_generator.send(:generate_grid_item, build_view, Habarico::ListBox.new, 0, stub_context)
  end

  def test_generate_grid_item_returns_parameters_for_placed_box
    box = Habarico::Box.new(grid_item: { md: 6 })
    result = build_generator.send(:generate_grid_item, build_view, box, 0, stub_context)
    assert_instance_of Habarico::GridItemBoxParameters, result
  end

  def test_generate_grid_item_includes_grid_dimensions
    box = Habarico::Box.new(grid_item: { xs: 12, md: 6 })
    result = build_generator.send(:generate_grid_item, build_view, box, 0, stub_context)
    assert_equal 12, result.xs
    assert_equal 6, result.md
  end

  def test_generate_grid_item_reads_the_grid_item_hash_of_any_box_type
    box = Habarico::ListBox.new(reference: 'items', grid_item: { md: 9 })
    result = build_generator.send(:generate_grid_item, build_view, box, 0, stub_context)
    assert_instance_of Habarico::GridItemBoxParameters, result
    assert_equal 9, result.md
  end

  def test_generate_grid_item_accepts_string_keys_in_the_grid_item_hash
    box = Habarico::Box.new(grid_item: { 'md' => 4 })
    result = build_generator.send(:generate_grid_item, build_view, box, 0, stub_context)
    assert_equal 4, result.md
  end

  # ---------------------------------------------------------------------------
  # generate_list
  # ---------------------------------------------------------------------------

  def test_generate_list_returns_nil_for_simple_box
    assert_nil build_generator.send(:generate_list, build_view, Habarico::Box.new, 0, stub_context)
  end

  def test_generate_list_returns_parameters_for_list_box
    box = Habarico::ListBox.new(reference: 'items', target: 'parent_id')
    result = build_generator.send(:generate_list, build_view, box, 0, stub_context)
    assert_instance_of Habarico::ListBoxParameters, result
  end

  def test_generate_list_passes_sortable_to_parameters
    box = Habarico::ListBox.new(reference: 'items', target: 'parent_id', sortable_field_name: 'position')
    result = build_generator.send(:generate_list, build_view, box, 0, stub_context)
    assert_instance_of Habarico::SortableParameters, result.sortable
    assert_equal 'position', result.sortable.field_name
  end

  # ---------------------------------------------------------------------------
  # generate_tab
  # ---------------------------------------------------------------------------

  def test_generate_tab_returns_nil_for_simple_box
    assert_nil build_generator.send(:generate_tab, build_view, Habarico::Box.new, 0, stub_context)
  end

  def test_generate_tab_returns_parameters_for_tab_box
    result = build_generator.send(:generate_tab, build_view, Habarico::TabBox.new, 0, stub_context)
    assert_instance_of Habarico::TabBoxParameters, result
  end

  def test_generate_tab_defaults_show_toolbar_navigation_to_false
    result = build_generator.send(:generate_tab, build_view, Habarico::TabBox.new, 0, stub_context)
    assert_equal false, result.show_toolbar_navigation
  end

  def test_generate_tab_includes_show_toolbar_navigation
    box = Habarico::TabBox.new(show_toolbar_navigation: true)
    result = build_generator.send(:generate_tab, build_view, box, 0, stub_context)
    assert_equal true, result.show_toolbar_navigation
  end

  # ---------------------------------------------------------------------------
  # generate_wizard
  # ---------------------------------------------------------------------------

  def test_generate_wizard_returns_nil_for_simple_box
    assert_nil build_generator.send(:generate_wizard, build_view, Habarico::Box.new, 0, stub_context)
  end

  def test_generate_wizard_returns_parameters_for_wizard_box
    result = build_generator.send(:generate_wizard, build_view, Habarico::WizardBox.new, 0, stub_context)
    assert_instance_of Habarico::WizardBoxParameters, result
  end

  def test_generate_wizard_defaults_show_toolbar_navigation_and_validate_steps_to_true
    result = build_generator.send(:generate_wizard, build_view, Habarico::WizardBox.new, 0, stub_context)
    assert_equal true, result.show_toolbar_navigation
    assert_equal true, result.validate_steps
  end

  def test_generate_wizard_respects_overrides
    box = Habarico::WizardBox.new(show_toolbar_navigation: false, validate_steps: false)
    result = build_generator.send(:generate_wizard, build_view, box, 0, stub_context)
    assert_equal false, result.show_toolbar_navigation
    assert_equal false, result.validate_steps
  end

  # ---------------------------------------------------------------------------
  # generate_array
  # ---------------------------------------------------------------------------

  def test_generate_array_returns_nil_for_simple_box
    assert_nil build_generator.send(:generate_array, build_view, Habarico::Box.new, 0, stub_context)
  end

  def test_generate_array_returns_parameters_for_array_box
    result = build_generator.send(:generate_array, build_view, Habarico::ArrayBox.new, 0, stub_context)
    assert_instance_of Habarico::ArrayBoxParameters, result
  end

  def test_generate_array_passes_target
    box = Habarico::ArrayBox.new(target: 'section_id')
    result = build_generator.send(:generate_array, build_view, box, 0, stub_context)
    assert_equal 'section_id', result.target
  end

  def test_generate_array_inline_defaults_to_true_without_nested_boxes
    box = Habarico::ArrayBox.new(target: 'items', boxes: %i[name phone])
    result = build_generator.send(:generate_array, build_view, box, 0, stub_context)
    assert_equal true, result.inline
  end

  def test_generate_array_inline_defaults_to_false_with_nested_boxes
    box = Habarico::ArrayBox.new(target: 'items', boxes: [Habarico::Box.new(boxes: [:name])])
    result = build_generator.send(:generate_array, build_view, box, 0, stub_context)
    assert_equal false, result.inline
  end

  def test_generate_array_inline_explicit_value_wins
    box = Habarico::ArrayBox.new(target: 'items', inline: false, boxes: [:name])
    result = build_generator.send(:generate_array, build_view, box, 0, stub_context)
    assert_equal false, result.inline
  end

  # ---------------------------------------------------------------------------
  # generate_object
  # ---------------------------------------------------------------------------

  def test_generate_object_returns_nil_for_simple_box
    assert_nil build_generator.send(:generate_object, build_view, Habarico::Box.new, 0, stub_context)
  end

  def test_generate_object_returns_parameters_for_object_box_with_target
    box = Habarico::ObjectBox.new(target: 'address_id')
    result = build_generator.send(:generate_object, build_view, box, 0, stub_context)
    assert_instance_of Habarico::ObjectBoxParameters, result
    assert_equal 'address_id', result.target
  end

  def test_generate_object_raises_when_target_not_set
    box = Habarico::ObjectBox.new
    assert_raises(Eluvia::Errors::StandardError) do
      build_generator.send(:generate_object, build_view, box, 0, stub_context)
    end
  end

  # ---------------------------------------------------------------------------
  # generate_gallery
  # ---------------------------------------------------------------------------

  def test_generate_gallery_returns_nil_for_simple_box
    assert_nil build_generator.send(:generate_gallery, build_view, Habarico::Box.new, 0, stub_context)
  end

  def test_generate_gallery_returns_parameters_for_gallery_box
    box = Habarico::GalleryBox.new(reference: 'images', image_field: 'photo')
    result = build_generator.send(:generate_gallery, build_view, box, 0, stub_context)
    assert_instance_of Habarico::GalleryBoxParameters, result
  end

  def test_generate_gallery_passes_reference_and_image_field
    box = Habarico::GalleryBox.new(reference: 'photos', image_field: 'thumbnail')
    result = build_generator.send(:generate_gallery, build_view, box, 0, stub_context)
    assert_equal 'photos', result.reference.resource
    assert_equal 'thumbnail', result.image_field
  end

  # ---------------------------------------------------------------------------
  # Full generate — return type and basic attributes
  # ---------------------------------------------------------------------------

  def test_generate_returns_box_schema_instance
    result = build_generator.generate(build_view, Habarico::Box.new, 0, stub_context)
    assert_instance_of Habarico::BoxSchema, result
  end

  def test_generate_sets_type_from_box
    box = build_box
    box.type = 'grid'
    result = build_generator.generate(build_view, box, 0, stub_context)
    assert_equal 'grid', result.type
  end

  def test_generate_sets_name_from_box
    box = build_box(name: 'details')
    result = build_generator.generate(build_view, box, 0, stub_context)
    assert_equal 'details', result.name
  end

  def test_generate_sets_name_to_index_string_when_not_set
    result = build_generator.generate(build_view, Habarico::Box.new, 5, stub_context)
    assert_equal '5', result.name
  end

  def test_generate_sets_label_from_box
    box = build_box(label: 'Details Section')
    result = build_generator.generate(build_view, box, 0, stub_context)
    assert_equal 'Details Section', result.label
  end

  def test_generate_read_only_is_false_by_default
    result = build_generator.generate(build_view, Habarico::Box.new, 0, stub_context)
    assert_equal false, result.read_only
  end

  def test_generate_read_only_is_true_when_configured
    box = build_box(read_only: true)
    result = build_generator.generate(build_view, box, 0, stub_context)
    assert_equal true, result.read_only
  end

  def test_generate_card_is_nil_by_default
    result = build_generator.generate(build_view, Habarico::Box.new, 0, stub_context)
    assert_nil result.card
  end

  def test_generate_card_is_false_when_disabled
    box = build_box(card: false)
    result = build_generator.generate(build_view, box, 0, stub_context)
    assert_equal false, result.card
  end

  def test_generate_card_is_true_when_configured
    box = build_box(card: true)
    result = build_generator.generate(build_view, box, 0, stub_context)
    assert_equal true, result.card
  end

  def test_generate_toolbar_actions_is_nil_by_default
    result = build_generator.generate(build_view, Habarico::Box.new, 0, stub_context)
    assert_nil result.toolbar_actions
  end

  def test_generate_toolbar_actions_is_set_when_configured
    box = build_box(toolbar_actions: [Habarico::ActionReference.new(name: 'upload-files')])
    result = build_generator.generate(build_view, box, 0, stub_context)
    assert_equal 1, result.toolbar_actions.size
    assert_equal 'upload-files', result.toolbar_actions.first.name
  end

  def test_generate_boxes_are_nil_when_no_boxes_defined
    result = build_generator.generate(build_view, Habarico::Box.new, 0, stub_context)
    assert_nil result.boxes
  end

  def test_generate_boxes_from_box_boxes
    box = build_box(boxes: ['title'])
    result = build_generator.generate(build_view, box, 0, stub_context)
    assert_equal 1, result.boxes.size
    assert_instance_of Habarico::FieldDescriptor, result.boxes[0]
  end

  def test_generate_includes_options
    result = build_generator.generate(build_view, Habarico::Box.new, 0, stub_context)
    assert_instance_of Habarico::BoxOptions, result.options
  end

  # ---------------------------------------------------------------------------
  # Full generate — type-specific parameters are exclusive
  # ---------------------------------------------------------------------------

  def test_generate_sets_list_params_for_list_box_and_clears_others
    box = Habarico::ListBox.new(reference: 'items', target: 'parent_id')
    result = build_generator.generate(build_view, box, 0, stub_context)
    assert_instance_of Habarico::ListBoxParameters, result.list
    assert_nil result.grid_item
    assert_nil result.tab
    assert_nil result.wizard
    assert_nil result.array
    assert_nil result.object
    assert_nil result.gallery
  end

  def test_generate_sets_grid_item_params_for_placed_box_and_clears_others
    box = Habarico::Box.new(grid_item: { md: 6 })
    result = build_generator.generate(build_view, box, 0, stub_context)
    assert_instance_of Habarico::GridItemBoxParameters, result.grid_item
    assert_nil result.list
    assert_nil result.tab
    assert_nil result.wizard
    assert_nil result.array
    assert_nil result.object
    assert_nil result.gallery
  end

  # A placement is not a type: a box can be a grid cell and carry its own type parameters at once.
  def test_generate_sets_grid_item_and_list_params_for_a_placed_list_box
    box = Habarico::ListBox.new(reference: 'items', target: 'parent_id', grid_item: { md: 9 })
    result = build_generator.generate(build_view, box, 0, stub_context)
    assert_equal 'list', result.type
    assert_instance_of Habarico::ListBoxParameters, result.list
    assert_instance_of Habarico::GridItemBoxParameters, result.grid_item
    assert_equal 9, result.grid_item.md
  end

  def test_generate_sets_tab_params_for_tab_box_and_clears_others
    box = Habarico::TabBox.new
    result = build_generator.generate(build_view, box, 0, stub_context)
    assert_instance_of Habarico::TabBoxParameters, result.tab
    assert_nil result.wizard
    assert_nil result.list
    assert_nil result.grid_item
  end

  def test_generate_sets_wizard_params_for_wizard_box_and_clears_others
    box = Habarico::WizardBox.new
    result = build_generator.generate(build_view, box, 0, stub_context)
    assert_instance_of Habarico::WizardBoxParameters, result.wizard
    assert_nil result.tab
    assert_nil result.list
    assert_nil result.grid_item
  end

  def test_generate_sets_array_params_for_array_box_and_clears_others
    box = Habarico::ArrayBox.new
    result = build_generator.generate(build_view, box, 0, stub_context)
    assert_instance_of Habarico::ArrayBoxParameters, result.array
    assert_nil result.list
    assert_nil result.grid_item
  end

  def test_generate_sets_object_params_for_object_box_and_clears_others
    box = Habarico::ObjectBox.new(target: 'address_id')
    result = build_generator.generate(build_view, box, 0, stub_context)
    assert_instance_of Habarico::ObjectBoxParameters, result.object
    assert_nil result.list
    assert_nil result.grid_item
  end

  def test_generate_sets_gallery_params_for_gallery_box_and_clears_others
    box = Habarico::GalleryBox.new(reference: 'images', image_field: 'photo')
    result = build_generator.generate(build_view, box, 0, stub_context)
    assert_instance_of Habarico::GalleryBoxParameters, result.gallery
    assert_nil result.list
    assert_nil result.grid_item
  end

  def test_generate_simple_box_has_no_type_specific_parameters
    result = build_generator.generate(build_view, Habarico::Box.new, 0, stub_context)
    assert_nil result.list
    assert_nil result.grid_item
    assert_nil result.tab
    assert_nil result.wizard
    assert_nil result.array
    assert_nil result.object
    assert_nil result.gallery
  end

end
