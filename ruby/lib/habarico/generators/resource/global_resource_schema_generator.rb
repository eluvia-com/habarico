module Habarico
  class GlobalResourceSchemaGenerator < ResourceSchemaGenerator

    def generate(context)
      Habarico::GlobalResourceSchema.new(
        name: generate_name,
        label: generate_label,
        pk_field_name: generate_pk_field_name,
        actions: generate_actions(context),
        views: generate_views(context),
        menu: generate_menu(context),
      )
    end

    protected

    def global_resource_action_schema_generator
      @global_resource_action_schema_generator ||= definition.global_resource_action_schema_generator.new(definition, resource_path)
    end

    def global_view_schema_generator
      @global_view_schema_generator ||= definition.global_view_schema_generator.new(definition, resource_path)
    end

    def menu_schema_generator
      @menu_schema_generator ||= definition.menu_schema_generator.new(definition, resource_path)
    end

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_actions(context)
      # Generate and filter actions based on permissions
      definition.normalized_actions.select do |action|

        # Action must be allowed by permissions
        context.can?(action.permission)

      end.map do |action|

        # Generate action schema
        global_resource_action_schema_generator.generate(action)

      end
    end

    def generate_views(context)
      # Generate and filter views based on permissions
      definition.normalized_views.select do |view|

        # View must be allowed by permissions
        context.can?(view.permission)

      end.map do |view|

        # Generate view schema
        global_view_schema_generator.generate(view)

      end
    end

    def generate_menu(context)
      return nil unless context.can?(:read)
      return nil if definition.menu_item == false
      menu_schema_generator.generate(definition.menu_item || Habarico::ViewMenuItem.new(view_name: 'list'), definition.menu_path)
    end

  end
end
