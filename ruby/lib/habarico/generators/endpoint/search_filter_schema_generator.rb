module Habarico
  class SearchFilterSchemaGenerator < AbstractGenerator

    def generate(model)
      Habarico::FilterSchema.new(
        name: generate_name(model),
        type: generate_type(model),
        format: generate_format(model),
        label: generate_label(model),
        help_text: generate_help_text(model),
      )
    end

    protected

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_name(_model)
      'search'
    end

    def generate_type(_model)
      'string'
    end

    def generate_format(_model)
      'search'
    end

    def generate_label(model)
      # Per-model override first (e.g. "Search by VS or counter-account"), then Habarico's
      # generic translated label, and finally the literal 'search' as a last resort.
      I18n.t("#{model.i18n_scope}.attributes.#{model.model_name.i18n_key}.search",
             default: I18n.t('filters.common.search', default: 'search'))
    end

    def generate_help_text(model)
      generate_label(model)
    end

  end
end
