module Habarico
  class ArrayBoxParametersGenerator < AbstractGenerator

    def generate(box, context)
      # Validate arguments
      raise Eluvia::Errors::StandardError.new('Argument `box` must be a Habarico::ArrayBox') unless box.is_a?(Habarico::ArrayBox)

      # Create model
      Habarico::ArrayBoxParameters.new(
        target: generate_target(box, context),
        inline: generate_inline(box, context)
      )
    end

    protected

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_target(box, _context)
      box.target
    end

    # Defaults to true unless the box contains nested boxes (then the items are rendered as separate blocks).
    # An explicit `inline` value on the box always wins.
    def generate_inline(box, _context)
      return !!box.inline unless box.inline.nil?
      boxes = box.boxes || []
      boxes.none? { |item| item.is_a?(Habarico::Box) }
    end

  end
end
