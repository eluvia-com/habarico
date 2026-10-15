module Habarico
  class GridItemBoxParametersGenerator < AbstractGenerator

    def generate(box, context)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `box` must be a Habarico::GridItemBox') unless box.is_a?(Habarico::GridItemBox)

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

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_xs(box, _context)
      box.xs
    end

    def generate_sm(box, _context)
      box.sm
    end

    def generate_md(box, _context)
      box.md
    end

    def generate_lg(box, _context)
      box.lg
    end

    def generate_xl(box, _context)
      box.xl
    end
  end
end
