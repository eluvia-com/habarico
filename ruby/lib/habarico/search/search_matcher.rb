module Habarico
  module Search

    # Applies a typed fulltext search over a resource's `search_fields`. Ruby port of the Python
    # `SearchFilter` (MR !198): Habarico owns the whole search query rather than delegating to
    # the base library's `filter_2!({search:})`, whose `apply_search` matches a separate FiltersModel field
    # list, cannot traverse relations and always unaccents. Owning it here makes
    # `Definition#search_fields` the single source of truth shared with SearchHighlighter and lets
    # `Config.search_unaccent_enabled` govern matching and highlighting consistently.
    #
    # Semantics mirror the Python matcher: AND across query words, OR across fields. Per field the
    # leaf type (from `Habarico::FieldPathResolver`) decides the match:
    #
    # - text    -> `lower([unaccent](col)) LIKE %word%`
    # - choices -> the word is matched against the human-readable enum labels; the resulting raw
    #              values feed an `IN (...)` lookup (no match -> the field contributes nothing)
    # - boolean -> matched against the translated Yes/No labels -> `IN (true/false)`
    # - numeric -> `lower(CAST(col AS text)) LIKE %word%`
    #
    # Relations (`author__name`) are reached with `left_outer_joins`; matches are collected as
    # primary keys and folded back with `where(pk IN ...)` so joins never duplicate rows or skew
    # kaminari's `total_count`.
    class SearchMatcher

      # Unicode combining marks, dropped when matching diacritics-insensitively. Lives here, in the
      # free core, because the free matcher needs it; a pro/enterprise highlighter reuses it from
      # here rather than the other way round (HAB-812).
      COMBINING_MARK = /\p{Mn}/

      def initialize(model:, search_fields:, unaccent: nil)
        @model = model
        @search_fields = search_fields.to_a
        @unaccent = unaccent.nil? ? Habarico::Config.search_unaccent_enabled : unaccent
      end

      # Narrows `scope` to records matching every query word in at least one `search_fields` path.
      # Returns `scope` unchanged when the query is blank or no search fields are declared.
      def apply(scope, query)
        return scope if query.nil?

        words = query.to_s.split(/\s+/).reject(&:empty?)
        return scope if words.empty? || @search_fields.empty?

        matched = nil
        words.each do |word|
          word_ids = ids_for_word(scope, word)
          matched = matched.nil? ? word_ids : (matched & word_ids)
          break if matched.empty?
        end

        scope.where(primary_key => matched || [])
      end

      private

      def primary_key
        @model.primary_key
      end

      # Primary keys of records where any field matches `word` (OR across fields).
      def ids_for_word(scope, word)
        resolver = Habarico::FieldPathResolver.new(@model)
        @search_fields.each_with_object([]) do |path, acc|
          leaf = resolver.resolve(path)
          next if leaf.nil?

          relation = field_relation(scope, path, leaf, word)
          acc.concat(relation.pluck(primary_key)) unless relation.nil?
        end.uniq
      end

      # A relation selecting records where `leaf` matches `word`, or nil when the field cannot
      # match this word at all (e.g. a choices/boolean word matching no label).
      def field_relation(scope, path, leaf, word)
        joined = join_for(scope, path)
        column = qualified_column(leaf)

        if leaf.choices?
          values = matching_choice_values(leaf, word)
          values.empty? ? nil : joined.where("#{column} IN (?)", values)
        elsif leaf.boolean?
          values = matching_boolean_values(word)
          values.empty? ? nil : joined.where("#{column} IN (?)", values)
        elsif leaf.numeric?
          joined.where("lower(CAST(#{column} AS text)) LIKE ?", like_pattern(word, unaccent: false))
        else
          joined.where("lower(#{text_expr(column)}) LIKE ?", like_pattern(word, unaccent: @unaccent))
        end
      end

      # Left-joins the relation hops of `path` so a leaf on a related table can be referenced.
      def join_for(scope, path)
        hops = path.to_s.split(Habarico::FieldPathResolver::RELATION_SEPARATOR)[0..-2].map(&:to_sym)
        return scope if hops.empty?

        association = hops.reverse.reduce { |nested, hop| { hop => nested } }
        scope.left_outer_joins(association)
      end

      # `table.column` for the leaf, using the leaf's owning table (the joined table for relations).
      def qualified_column(leaf)
        "#{leaf.model.table_name}.#{leaf.name}"
      end

      # Wraps the column in `unaccent(...)` when diacritics-insensitive matching is on.
      def text_expr(column)
        @unaccent ? "unaccent(#{column})" : column
      end

      # A `%word%` LIKE pattern, lowercased and (optionally) accent-stripped to match `text_expr`.
      def like_pattern(word, unaccent:)
        normalized = normalize(word, unaccent: unaccent)
        "%#{normalized}%"
      end

      # Raw enum values whose human-readable label contains `word`.
      def matching_choice_values(leaf, word)
        choices = leaf.model.find_enum_attr(leaf.name)
        return [] if choices.nil?

        needle = normalize(word, unaccent: @unaccent)
        choices.values
               .select { |choice| normalize(choice[:label], unaccent: @unaccent).include?(needle) }
               .map { |choice| choice[:value] }
      end

      # Boolean raw values whose translated Yes/No label contains `word`.
      def matching_boolean_values(word)
        needle = normalize(word, unaccent: @unaccent)
        values = []
        values << true if normalize(yes_label, unaccent: @unaccent).include?(needle)
        values << false if normalize(no_label, unaccent: @unaccent).include?(needle)
        values
      end

      def normalize(value, unaccent:)
        value = value.to_s.downcase
        return value unless unaccent

        value.unicode_normalize(:nfkd).each_char.grep_v(COMBINING_MARK).join
      end

      def yes_label
        defined?(I18n) ? I18n.t('search.yes', default: 'Yes') : 'Yes'
      end

      def no_label
        defined?(I18n) ? I18n.t('search.no', default: 'No') : 'No'
      end

    end
  end
end
