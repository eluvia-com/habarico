require 'test_helper'
require 'active_record'
require 'sqlite3'

# *****************************************************************************
# Integration test harness
# *****************************************************************************
#
# The unit suite runs against duck-typed stubs. The search matcher and the
# highlight wiring, however, need a real ActiveRecord stack (typed columns,
# enum attributes, relation joins, ILIKE/unaccent SQL) to be exercised
# faithfully. This helper spins up an in-memory SQLite database with a small
# fixture schema and base-library-backed models.
#
# SQLite has no `unaccent()` function (it is a PostgreSQL extension), so we
# register a Ruby shim mirroring the highlighter's accent stripping (NFKD form,
# combining marks dropped). Diacritics-insensitive matching therefore behaves
# the same as it would on PostgreSQL.
module Habarico
  module IntegrationHarness

    COMBINING_MARK = /\p{Mn}/

    module_function

    # Strips accents the same way SearchHighlighter#strip_accents_with_offsets does,
    # so the SQLite `unaccent` shim aligns with the Ruby-side highlighting.
    def strip_accents(value)
      return value if value.nil?

      value.to_s.unicode_normalize(:nfkd).each_char.grep_v(COMBINING_MARK).join
    end

    # Establishes the in-memory connection, registers the unaccent shim and loads
    # the fixture schema. Idempotent - safe to call from every test file.
    def setup!
      return if @setup

      ActiveRecord::Base.establish_connection(adapter: 'sqlite3', database: ':memory:')
      register_unaccent!
      load_schema!
      @setup = true
    end

    def register_unaccent!
      ActiveRecord::Base.connection.raw_connection.create_function('unaccent', 1) do |func, value|
        func.result = strip_accents(value)
      end
    end

    def load_schema!
      ActiveRecord::Schema.verbose = false
      ActiveRecord::Schema.define do
        create_table :authors, force: true do |t|
          t.string :name
          t.boolean :active, default: true, null: false
        end

        create_table :articles, force: true do |t|
          t.string :title
          t.text :content
          t.string :status
          t.integer :view_count, default: 0, null: false
          t.decimal :price, precision: 10, scale: 2
          t.references :author
        end

        create_table :habarico_user_preferences, id: false, force: true do |t|
          t.string :id, primary_key: true
          t.string :user_id, null: false
          t.string :key, null: false
          t.json :value, null: false
          t.datetime :updated_at, null: false
        end
        add_index :habarico_user_preferences, %i[user_id key], unique: true, name: "idx_habarico_user_prefs_user_key"
      end
    end

  end
end

Habarico::IntegrationHarness.setup!

# *****************************************************************************
# Fixture enum support
# *****************************************************************************
#
# Habarico's search discovers enum ("choices") fields through a small duck-typed contract: the
# model class answers `has_enum_attr?` / `find_enum_attr`, and each record exposes a `{field}_obj`
# accessor returning the matched choice hash (`SearchMatcher`, `FieldPathResolver`, `SearchHighlighter`
# consume nothing else). We implement exactly that contract here rather than mixing in the real
# `Eluvia::ActiveModel::EnumAttribute`: that module's DTO-oriented `initialize` is incompatible with
# ActiveRecord on Rails 7.1, where it runs `assign_attributes` before `@attributes` is built and
# every `create` raises `undefined method 'write_from_user' for nil`. A test double only needs to
# satisfy the interface, so the fixtures declare choices with the same shape the search code reads.
module FixtureEnum
  extend ActiveSupport::Concern

  class_methods do
    # Declares an enum field. `choices` is an array of `{ value:, label: }` hashes, matching the
    # subset of the base library's choice shape that the search code touches.
    def enum_attr(name, choices)
      name = name.to_sym
      _enum_attrs[name] = choices.to_h { |choice| [choice[:value].to_s, choice] }

      define_method("#{name}_obj") do
        self.class.find_enum_attr(name)&.fetch(public_send(name).to_s, nil)
      end
    end

    def _enum_attrs
      @_enum_attrs ||= {}
    end

    def has_enum_attr?(name)
      _enum_attrs.key?(name.to_sym)
    end

    def find_enum_attr(name)
      _enum_attrs[name.to_sym]
    end
  end
end

# *****************************************************************************
# Fixture models
# *****************************************************************************

class Author < ActiveRecord::Base
  include FixtureEnum

  has_many :articles

  def representation
    name
  end
end

class Article < ActiveRecord::Base
  include FixtureEnum

  belongs_to :author

  enum_attr :status, [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
  ]

  def representation
    title
  end
end
