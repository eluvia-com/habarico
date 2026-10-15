module Habarico
  class FieldReference
    include DefinitionModel

    attr_accessor :name, :label, :short_label, :help_text, :sortable, :sort_by, :read_only, :write_only, :default_value,
                  :show_query, :required_query, :text_align, :target, :action, :wrapper, :phone, :icons_key,
                  :resize_width, :crop_aspect_ratio, :parent, :ai_source_fields, :relation, :format, :max_size, :accept
  end
end
