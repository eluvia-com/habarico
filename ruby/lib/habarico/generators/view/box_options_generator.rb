module Habarico
  class BoxOptionsGenerator < AbstractGenerator

    def generate(box)
      Habarico::BoxOptions.new(
        dynamic_render: generate_dynamic_render(box)
      )
    end

    protected

    def generate_dynamic_render(box)
      dynamic_render_options_generator.generate(definition.model, box)
    end

    private

    def dynamic_render_options_generator
      @dynamic_render_options_generator ||= definition.dynamic_render_options_generator.new(definition, resource_path)
    end

  end
end
