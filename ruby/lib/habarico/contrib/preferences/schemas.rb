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
      end
    end
  end
end
