module Habarico
  class Definition
    include DefinitionModel

    attr_accessor :model, :default_sorting, :force_sorting, :default_filter, :includes, :prefetch, :scopes,

                  # Metadata
                  :tags,

                  # Navigation
                  :icon, :label, :fields, :menu_path, :menu_item, :breadcrumbs,

                  # Search (per-resource; the cross-resource spotlight search adds
                  # `global_fulltext_search_enabled` from habarico-enterprise - HAB-812)
                  :search_fields,

                  # Fields and filters
                  :sorting_fields, :read_only_fields, :write_only_fields, :filters,

                  # Pagination (per resource; `nil` falls back to `Habarico::Config` and then to
                  # the eluvia-base defaults - see `Habarico::Controller#set_list_pagination`)
                  :default_page_limit, :max_page_limit,

                  # Aggregation and dashboard are paid: habarico-enterprise adds
                  # `aggregate_enabled`, `aggregate_max_buckets`, `aggregate_fields`,
                  # `aggregate_schema_generator` and `dashboard_enabled` here (HAB-812).

                  # Views and actions
                  :views, :actions,

                  # Permissions
                  :can, :can_read, :can_create, :can_update, :can_delete, :allow_read_by_id,
                  :policy_scope,

                  # Generator classes - action
                  :link_action_parameters_generator, :resource_action_endpoint_parameters_generator,
                  :resource_action_parameters_generator, :save_action_parameters_generator, :action_schema_generator,
                  :view_action_endpoint_parameters_generator, :view_action_parameters_generator,
                  :confirm_dialog_properties_generator, :global_resource_action_schema_generator,
                  :resource_action_schema_generator, :upload_images_action_parameters_generator,

                  # Generator classes - endpoint
                  :dynamic_render_options_generator, :method_schema_generator, :endpoints_schema_generator,
                  :enum_type_generator, :field_options_generator, :field_schema_generator,
                  :fields_schema_generator, :filter_schema_generator, :filters_schema_generator,
                  :number_field_options_generator, :phone_field_options_generator, :relation_field_options_generator,
                  :search_filter_schema_generator,

                  # Generator classes - menu
                  :menu_group_schema_generator, :menu_link_parameters_generator, :menu_schema_generator,
                  :menu_view_endpoint_parameters_generator, :menu_view_parameters_generator,

                  # Generator classes - resource
                  :action_resource_schema_generator, :global_resource_schema_generator,
                  :local_resource_schema_generator, :object_resource_schema_generator,

                  # Generator classes - view
                  :action_descriptor_generator, :array_box_parameters_generator, :box_options_generator,
                  :box_schema_generator, :field_descriptor_generator, :filter_descriptor_generator,
                  :gallery_box_parameters_generator, :global_view_schema_generator, :grid_item_box_parameters_generator,
                  :list_box_parameters_generator, :object_box_parameters_generator, :sort_descriptor_generator,
                  :tab_box_parameters_generator, :wizard_box_parameters_generator, :detail_view_parameters_generator,
                  :view_endpoint_parameters_generator, :list_view_parameters_generator, :view_schema_generator

    def initialize

      # No column is assumed to exist. Without a declaration the list is ordered by the primary
      # key alone, which `Habarico::Controller#append_order_by_tiebreaker` appends anyway
      # (HAB-915).
      @default_sorting = nil
      @force_sorting = false
      @default_filter = {}
      @includes = []
      @scopes = []

      # Fields and filters
      @fields = []
      @read_only_fields = []
      @write_only_fields = []
      @sorting_fields = []
      @filters = []

      # Aggregation

      # Dashboard

      # Views and actions
      @views = %i[list show]
      @actions = [:show]

      # Search
      @search_fields = []

      # ***********************************************************************
      # Permissions
      # ***********************************************************************

      @can_read = true
      @can_create = false
      @can_update = false
      @can_delete = false
      # Explicit opt-in for ID-based reads without `can_read`: `show` by ID and the id__in-only
      # `index` mode. Cross-service reference resources (resolved via `ReferenceField`) need this.
      @allow_read_by_id = false

      # ***********************************************************************
      # Generator classes
      # ***********************************************************************

      # Action
      @link_action_parameters_generator = Habarico::LinkActionParametersGenerator
      @resource_action_endpoint_parameters_generator = Habarico::ResourceActionEndpointParametersGenerator
      @resource_action_parameters_generator = Habarico::ResourceActionParametersGenerator
      @save_action_parameters_generator = Habarico::SaveActionParametersGenerator
      @action_schema_generator = Habarico::ActionSchemaGenerator
      @view_action_endpoint_parameters_generator = Habarico::ViewActionEndpointParametersGenerator
      @view_action_parameters_generator = Habarico::ViewActionParametersGenerator
      @confirm_dialog_properties_generator = Habarico::ConfirmDialogPropertiesGenerator
      @global_resource_action_schema_generator = Habarico::GlobalResourceActionSchemaGenerator
      @resource_action_schema_generator = Habarico::ResourceActionSchemaGenerator
      @upload_images_action_parameters_generator = Habarico::UploadImagesActionParametersGenerator

      # Endpoint
      @dynamic_render_options_generator = Habarico::DynamicRenderOptionsGenerator
      @method_schema_generator = Habarico::MethodSchemaGenerator
      @endpoints_schema_generator = Habarico::EndpointsSchemaGenerator
      @enum_type_generator = Habarico::EnumTypeGenerator
      @field_options_generator = Habarico::FieldOptionsGenerator
      @field_schema_generator = Habarico::FieldSchemaGenerator
      @fields_schema_generator = Habarico::FieldsSchemaGenerator
      @filter_schema_generator = Habarico::FilterSchemaGenerator
      @filters_schema_generator = Habarico::FiltersSchemaGenerator
      @number_field_options_generator = Habarico::NumberFieldOptionsGenerator
      @phone_field_options_generator = Habarico::PhoneFieldOptionsGenerator
      @relation_field_options_generator = Habarico::RelationFieldOptionsGenerator
      @search_filter_schema_generator = Habarico::SearchFilterSchemaGenerator

      # Aggregate

      # Menu
      @menu_group_schema_generator = Habarico::MenuGroupSchemaGenerator
      @menu_link_parameters_generator = Habarico::MenuLinkParametersGenerator
      @menu_schema_generator = Habarico::MenuSchemaGenerator
      @menu_view_endpoint_parameters_generator = Habarico::MenuViewEndpointParametersGenerator
      @menu_view_parameters_generator = Habarico::MenuViewParametersGenerator

      # Resource
      @action_resource_schema_generator = Habarico::ActionResourceSchemaGenerator
      @global_resource_schema_generator = Habarico::GlobalResourceSchemaGenerator
      @local_resource_schema_generator = Habarico::LocalResourceSchemaGenerator
      @object_resource_schema_generator = Habarico::ObjectResourceSchemaGenerator

      # View
      @action_descriptor_generator = Habarico::ActionDescriptorGenerator
      @array_box_parameters_generator = Habarico::ArrayBoxParametersGenerator
      @box_options_generator = Habarico::BoxOptionsGenerator
      @box_schema_generator = Habarico::BoxSchemaGenerator
      @field_descriptor_generator = Habarico::FieldDescriptorGenerator
      @filter_descriptor_generator = Habarico::FilterDescriptorGenerator
      @gallery_box_parameters_generator = Habarico::GalleryBoxParametersGenerator
      @global_view_schema_generator = Habarico::GlobalViewSchemaGenerator
      @grid_item_box_parameters_generator = Habarico::GridItemBoxParametersGenerator
      @list_box_parameters_generator = Habarico::ListBoxParametersGenerator
      @object_box_parameters_generator = Habarico::ObjectBoxParametersGenerator
      @sort_descriptor_generator = Habarico::SortDescriptorGenerator
      @tab_box_parameters_generator = Habarico::TabBoxParametersGenerator
      @wizard_box_parameters_generator = Habarico::WizardBoxParametersGenerator
      @detail_view_parameters_generator = Habarico::DetailViewParametersGenerator
      @view_endpoint_parameters_generator = Habarico::ViewEndpointParametersGenerator
      @list_view_parameters_generator = Habarico::ListViewParametersGenerator
      @view_schema_generator = Habarico::ViewSchemaGenerator

    end

    def normalized_actions
      @actions.map do |action|
        if action.is_a?(String) || action.is_a?(Symbol)
          case action.to_sym
          when :show then Habarico::ShowAction.new
          when :edit then Habarico::EditAction.new
          when :create then Habarico::CreateAction.new
          when :delete then Habarico::DeleteAction.new
          end
        elsif action.is_a?(Habarico::Action)
          action
        end
      end.compact
    end

    def normalized_views
      @views.map do |view|
        if view.is_a?(String) || view.is_a?(Symbol)
          case view.to_sym
          when :list then Habarico::ListView.new
          when :show then Habarico::ShowView.new
          when :edit then Habarico::EditView.new
          when :create then Habarico::CreateView.new
          end
        elsif view.is_a?(Habarico::View)
          view
        end
      end.compact
    end

  end
end
