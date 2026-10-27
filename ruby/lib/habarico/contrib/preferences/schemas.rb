module Habarico
  module Contrib
    module Preferences
      # Built-in preference value schemas, mirroring the pydantic models in the Python
      # habarico/contrib/preferences/schemas.py. Plain JSON Schema (Draft 2020-12) hashes.
      module Schemas
        THEME = { "enum" => %w[light dark] }.freeze
        LOCALE = { "type" => "string" }.freeze
        APP_PAGE_WIDTH = { "enum" => %w[full centered] }.freeze
        CONTRAST_MODE = { "type" => "boolean" }.freeze
        STRIPED_ROWS = { "type" => "boolean" }.freeze
        APP_DENSITY = { "enum" => %w[compact standard comfortable] }.freeze

        COLUMNS = { "type" => "array", "items" => { "type" => "string" } }.freeze

        COLUMN_WIDTHS = {
          "type" => "object",
          "additionalProperties" => { "type" => "number", "minimum" => 0 },
        }.freeze

        SORT = {
          "type" => "object",
          "required" => %w[field order],
          "properties" => {
            "field" => { "type" => "string" },
            "order" => { "enum" => %w[ASC DESC] },
          },
        }.freeze

        SAVED_QUERIES = {
          "type" => "array",
          "items" => {
            "type" => "object",
            "required" => %w[label],
            "properties" => {
              "label" => { "type" => "string" },
              "value" => {
                "type" => "object",
                "properties" => {
                  "filter" => { "type" => "object" },
                  "displayedFilters" => { "type" => "object", "additionalProperties" => { "type" => "boolean" } },
                  "sort" => { "anyOf" => [SORT, { "type" => "null" }] },
                  "perPage" => { "type" => %w[integer null], "minimum" => 1 },
                },
              },
            },
          },
        }.freeze

        WIDGET_LAYOUT = {
          "type" => "object",
          "required" => %w[x y w h],
          "properties" => {
            "x" => { "type" => "integer", "minimum" => 0 },
            "y" => { "type" => "integer", "minimum" => 0 },
            "w" => { "type" => "integer", "minimum" => 1 },
            "h" => { "type" => "integer", "minimum" => 1 },
            "stackedH" => { "type" => "integer", "minimum" => 1 },
            "minW" => { "type" => "integer", "minimum" => 1 },
            "minH" => { "type" => "integer", "minimum" => 1 },
          },
        }.freeze

        GROUP_BY_BUCKET = {
          "oneOf" => [
            {
              "type" => "object",
              "required" => %w[type granularity],
              "properties" => {
                "type" => { "const" => "trunc" },
                "granularity" => { "enum" => %w[second minute hour day week month quarter year] },
              },
            },
            {
              "type" => "object",
              "required" => %w[type size],
              "properties" => {
                "type" => { "const" => "width" },
                "size" => { "type" => "number" },
              },
            },
          ],
        }.freeze

        GROUP_BY_ITEM = {
          "type" => "object",
          "required" => %w[field],
          "properties" => {
            "field" => { "type" => "string" },
            "bucket" => { "anyOf" => [GROUP_BY_BUCKET, { "type" => "null" }] },
          },
        }.freeze

        CHART_OPTIONS = {
          "type" => "object",
          "properties" => {
            "orientation" => { "enum" => %w[vertical horizontal] },
            "variant" => { "enum" => %w[pie doughnut] },
          },
        }.freeze

        WIDGET_CONFIG = {
          "type" => "object",
          "required" => %w[id type layout],
          "properties" => {
            "id" => { "type" => "string" },
            "type" => { "type" => "string" },
            "resource" => { "type" => %w[string null] },
            "label" => { "type" => %w[string null] },
            "layout" => WIDGET_LAYOUT,
            "filters" => { "type" => %w[object null], "additionalProperties" => { "type" => "string" } },
            "sort" => { "anyOf" => [SORT, { "type" => "null" }] },
            "perPage" => { "type" => %w[integer null], "minimum" => 1 },
            "columns" => { "type" => %w[array null], "items" => { "type" => "string" } },
            "field" => { "type" => %w[string null] },
            "aggregateFunction" => { "type" => %w[string null], "enum" => [nil, "count", "sum", "avg", "min", "max"] },
            "color" => { "type" => %w[string null], "enum" => [nil, "primary", "secondary", "success", "error", "warning", "info", "inherit"] },
            "groupBy" => { "type" => %w[array null], "items" => GROUP_BY_ITEM },
            "chartOptions" => { "anyOf" => [CHART_OPTIONS, { "type" => "null" }] },
          },
        }.freeze

        DASHBOARD = {
          "type" => "object",
          "properties" => {
            "widgets" => { "type" => "array", "items" => WIDGET_CONFIG },
          },
        }.freeze
      end
    end
  end
end
