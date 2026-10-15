module Habarico
  class RelationFieldOptionsGenerator < AbstractGenerator

    def generate(model, field_reference)
      relation = field_reference.relation
      parent = field_reference.parent

      return nil if relation.present? && !relation.is_a?(Hash)
      return nil if relation.blank? && parent.blank?

      hash = relation.is_a?(Hash) ? relation : {}

      Habarico::RelationFieldOptions.new(
        show_link: generate_show_link(model, hash),
        link_mode: generate_link_mode(model, hash),
        dialog_width: generate_dialog_width(model, hash),
        keep_linked_parent: generate_keep_linked_parent(model, hash),
        show_edit_button: generate_show_edit_button(model, hash),
        show_create_button: generate_show_create_button(model, hash),
        preserve_order: generate_preserve_order(model, hash),
        filters: generate_filters(model, hash),
        sort: generate_sort(model, hash),
        parent: generate_parent(model, hash, parent),
      )
    end

    protected

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_show_link(_model, hash)
      hash[:show_link]
    end

    def generate_link_mode(_model, hash)
      hash[:link_mode]
    end

    def generate_dialog_width(_model, hash)
      hash[:dialog_width]
    end

    def generate_keep_linked_parent(_model, hash)
      hash[:keep_linked_parent]
    end

    def generate_show_edit_button(_model, hash)
      hash[:show_edit_button]
    end

    def generate_show_create_button(_model, hash)
      hash[:show_create_button]
    end

    def generate_preserve_order(_model, hash)
      hash[:preserve_order]
    end

    def generate_filters(_model, hash)
      Array(hash[:filters]).map do |f|
        next f if f.is_a?(Habarico::KeyValue)
        Habarico::KeyValue.new(key: f[:key] || f['key'], value: f[:value] || f['value'])
      end.presence
    end

    def generate_sort(_model, hash)
      sort = hash[:sort]
      if sort.is_a?(String)
        # Support 'field_name:direction' format (e.g. 'email:asc', 'created_at:desc')
        parts = sort.split(':')
        Habarico::SortDescriptor.new(
          field_name: parts[0],
          direction: parts[1] == 'desc' ? 'desc' : 'asc'
        )
      elsif sort.is_a?(Hash)
        Habarico::SortDescriptor.new(
          field_name: sort[:field_name] || sort['field_name'],
          direction: sort[:direction] || sort['direction']
        )
      end
    end

    def generate_parent(_model, hash, field_reference_parent)
      hash[:parent] || field_reference_parent
    end

  end
end
