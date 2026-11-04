module Habarico
  class GridItemBoxParametersGenerator < AbstractGenerator

    def generate(box, context)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `box` must be a Habarico::Box') unless box.is_a?(Habarico::Box)

      # Create model
      Habarico::GridItemBoxParameters.new(
        xs: generate_xs(box, context),
        sm: generate_sm(box, context),
        md: generate_md(box, context),
        lg: generate_lg(box, context),
        xl: generate_xl(box, context),
      )
    end

    protected

    # Breakpoint spans of the box, given as a `grid_item` hash on any box type ({ md: 9 }).
    def grid_item_spans(box)
      spans = box.grid_item || {}
      spans.respond_to?(:symbolize_keys) ? spans.symbolize_keys : spans
    end

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_xs(box, _context)
      grid_item_spans(box)[:xs]
    end

    def generate_sm(box, _context)
      grid_item_spans(box)[:sm]
    end

    def generate_md(box, _context)
      grid_item_spans(box)[:md]
    end

    def generate_lg(box, _context)
      grid_item_spans(box)[:lg]
    end

    def generate_xl(box, _context)
      grid_item_spans(box)[:xl]
    end
  end
end
