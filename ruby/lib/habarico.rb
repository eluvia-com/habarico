require "eluvia-base"

# *****************************************************************************
# Basic library
# *****************************************************************************

require "habarico/version"
require "habarico/engine"
require "habarico/config"
require "habarico/context"
require "habarico/authenticatable"

# *****************************************************************************
# Active model
# *****************************************************************************

require "habarico/active_model/references"
require "habarico/active_model/extensible_enum"

# *****************************************************************************
# Helpers
# *****************************************************************************

require "habarico/helpers/action_helper"
require "habarico/helpers/attributes_helper"
require "habarico/helpers/box_helper"
require "habarico/helpers/callable_helper"
require "habarico/helpers/order_by_helper"
require "habarico/helpers/reflection_helper"

# *****************************************************************************
# Resolvers
# *****************************************************************************

require "habarico/resolvers/field_path_resolver"
require "habarico/resolvers/file_rules_resolver"
require "habarico/resolvers/filter_params_resolver"
require "habarico/resolvers/record_params_resolver"
require "habarico/resolvers/sorting_resolver"

# *****************************************************************************
# Search
# *****************************************************************************

# Free per-resource search. The global spotlight search and its highlighter are a paid feature and
# are not required here - habarico-enterprise loads them and registers itself through
# `Config.search_highlighter_class` (HAB-812).
require "habarico/search/search_matcher"

# *****************************************************************************
# Schema
# *****************************************************************************

# Shared enum types
require "habarico/schema/types"

# Action schema models
require "habarico/schema/action/link_action_parameters"
require "habarico/schema/action/resource_action_endpoint_parameters"
require "habarico/schema/action/resource_action_parameters"
require "habarico/schema/action/action_schema"
require "habarico/schema/action/save_action_parameters"
require "habarico/schema/action/view_action_endpoint_parameters"
require "habarico/schema/action/view_action_parameters"
require "habarico/schema/action/confirm_dialog_properties"
require "habarico/schema/action/global_resource_action_schema"
require "habarico/schema/action/resource_action_schema"
require "habarico/schema/action/upload_files_action_parameters"

# Aggregate schema models

# Endpoint schema models
require "habarico/schema/endpoint/method_schema"
require "habarico/schema/endpoint/endpoints_schema"
require "habarico/schema/endpoint/enum_type"
require "habarico/schema/endpoint/field_schema"
require "habarico/schema/endpoint/filter_schema"
require "habarico/schema/endpoint/key_value"
require "habarico/schema/endpoint/phone_field_options"
require "habarico/schema/endpoint/relation_field_options"
require "habarico/schema/endpoint/choices_field_options"
require "habarico/schema/endpoint/image_field_options"
require "habarico/schema/endpoint/ai_field_options"
require "habarico/schema/endpoint/field_options"
require "habarico/schema/endpoint/number_field_options"
require "habarico/schema/endpoint/dynamic_render_options"
require "habarico/schema/endpoint/box_options"

# Menu schema models
require "habarico/schema/menu/menu_group_schema"
require "habarico/schema/menu/menu_schema"
require "habarico/schema/menu/action_view_choice"

# Resource schema models
require "habarico/schema/resource/resource_schema"
require "habarico/schema/resource/global_resource_schema"
require "habarico/schema/resource/local_resource_schema"
require "habarico/schema/resource/object_resource_schema"

# View schema models
require "habarico/schema/view/view_action_descriptor_parameters"
require "habarico/schema/view/action_descriptor"
require "habarico/schema/view/array_box_parameters"
require "habarico/schema/view/object_box_parameters"
require "habarico/schema/view/box_schema"
require "habarico/schema/view/field_wrapper_properties"
require "habarico/schema/view/field_descriptor"
require "habarico/schema/view/filter_descriptor"
require "habarico/schema/view/sort_descriptor"
require "habarico/schema/view/global_view_schema"
require "habarico/schema/view/grid_item_box_parameters"
require "habarico/schema/view/sortable_parameters"
require "habarico/schema/view/list_box_parameters"
require "habarico/schema/view/tab_box_parameters"
require "habarico/schema/view/wizard_box_parameters"
require "habarico/schema/view/detail_view_parameters"
require "habarico/schema/view/view_endpoint_parameters"
require "habarico/schema/view/list_view_parameters"
require "habarico/schema/view/view_schema"
require "habarico/schema/view/gallery_box_parameters"

# *****************************************************************************
# Generators
# *****************************************************************************

require "habarico/generators/abstract_generator"

# Aggregate generators

# Action generators
require "habarico/generators/action/link_action_parameters_generator"
require "habarico/generators/action/resource_action_endpoint_parameters_generator"
require "habarico/generators/action/resource_action_parameters_generator"
require "habarico/generators/action/action_schema_generator"
require "habarico/generators/action/view_action_endpoint_parameters_generator"
require "habarico/generators/action/view_action_parameters_generator"
require "habarico/generators/action/confirm_dialog_properties_generator"
require "habarico/generators/action/global_resource_action_schema_generator"
require "habarico/generators/action/resource_action_schema_generator"
require "habarico/generators/action/save_action_parameters_generator"
require "habarico/generators/action/upload_files_action_parameters_generator"
require "habarico/generators/action/trigger_action_schema_generator"

# Endpoint generators
require "habarico/generators/endpoint/method_schema_generator"
require "habarico/generators/endpoint/endpoints_schema_generator"
require "habarico/generators/endpoint/enum_type_generator"
require "habarico/generators/endpoint/field_schema_generator"
require "habarico/generators/endpoint/fields_schema_generator"
require "habarico/generators/endpoint/filter_schema_generator"
require "habarico/generators/endpoint/filters_schema_generator"
require "habarico/generators/endpoint/search_filter_schema_generator"
require "habarico/generators/endpoint/field_options_generator"
require "habarico/generators/endpoint/number_field_options_generator"
require "habarico/generators/endpoint/dynamic_render_options_generator"
require "habarico/generators/endpoint/relation_field_options_generator"
require "habarico/generators/endpoint/phone_field_options_generator"

# Menu generators
require "habarico/generators/menu/menu_group_schema_generator"
require "habarico/generators/menu/menu_link_parameters_generator"
require "habarico/generators/menu/menu_schema_generator"
require "habarico/generators/menu/menu_view_endpoint_parameters_generator"
require "habarico/generators/menu/menu_view_parameters_generator"

# Resource generators
require "habarico/generators/resource/resource_schema_generator"
require "habarico/generators/resource/action_resource_schema_generator"
require "habarico/generators/resource/global_resource_schema_generator"
require "habarico/generators/resource/local_resource_schema_generator"
require "habarico/generators/resource/object_resource_schema_generator"

# View generators
require "habarico/generators/view/action_descriptor_generator"
require "habarico/generators/view/array_box_parameters_generator"
require "habarico/generators/view/box_options_generator"
require "habarico/generators/view/box_schema_generator"
require "habarico/generators/view/field_descriptor_generator"
require "habarico/generators/view/filter_descriptor_generator"
require "habarico/generators/view/sort_descriptor_generator"
require "habarico/generators/view/global_view_schema_generator"
require "habarico/generators/view/grid_item_box_parameters_generator"
require "habarico/generators/view/list_box_parameters_generator"
require "habarico/generators/view/object_box_parameters_generator"
require "habarico/generators/view/tab_box_parameters_generator"
require "habarico/generators/view/wizard_box_parameters_generator"
require "habarico/generators/view/detail_view_parameters_generator"
require "habarico/generators/view/view_endpoint_parameters_generator"
require "habarico/generators/view/list_view_parameters_generator"
require "habarico/generators/view/view_schema_generator"
require "habarico/generators/view/gallery_box_parameters_generator"

# *****************************************************************************
# Definition
# *****************************************************************************

# Concerns
require "habarico/definition/concerns/definition_model"

# Actions
require "habarico/definition/actions/action"
require "habarico/definition/actions/view_action"
require "habarico/definition/actions/resource_action"
require "habarico/definition/actions/link_action"
require "habarico/definition/actions/create_action"
require "habarico/definition/actions/delete_action"
require "habarico/definition/actions/edit_action"
require "habarico/definition/actions/save_action"
require "habarico/definition/actions/show_action"
require "habarico/definition/actions/upload_files_action"

# Menu
require "habarico/definition/menu/menu_item"
require "habarico/definition/menu/view_menu_item"
require "habarico/definition/menu/link_menu_item"
require "habarico/definition/menu/text_menu_item"

# Boxes
require "habarico/definition/boxes/box"
require "habarico/definition/boxes/array_box"
require "habarico/definition/boxes/gallery_box"
require "habarico/definition/boxes/grid_box"
require "habarico/definition/boxes/grid_item_box"
require "habarico/definition/boxes/list_box"
require "habarico/definition/boxes/object_box"
require "habarico/definition/boxes/tab_box"
require "habarico/definition/boxes/tab_item_box"
require "habarico/definition/boxes/wizard_box"

# Views
require "habarico/definition/views/view"
require "habarico/definition/views/action_view"
require "habarico/definition/views/create_view"
require "habarico/definition/views/edit_view"
require "habarico/definition/views/list_view"
require "habarico/definition/views/show_view"

# Root
require "habarico/definition/action_reference"
require "habarico/definition/field_reference"
require "habarico/definition/filter_reference"
require "habarico/definition/response"
require "habarico/definition/definition"

# *****************************************************************************
# Serializer
# *****************************************************************************

# Controller
require "habarico/queries/records_query"
require "habarico/validators/order_by_validator"
require "habarico/controller"

# Serializer
require "habarico/serializers/compact_json"
require "habarico/serializers/fields_serializer"
require "habarico/serializers/meta_serializer"
require "habarico/serializers/record_serializer"
require "habarico/serializers/response_serializer"

# *****************************************************************************
# Services
# *****************************************************************************

require "habarico/services/resource_service"
require "habarico/services/routing_service"
require "habarico/services/schema_service"

module Habarico
  def self.setup
    yield Habarico::Config
  end
end
