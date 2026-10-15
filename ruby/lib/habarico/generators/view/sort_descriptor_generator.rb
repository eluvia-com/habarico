module Habarico
  class SortDescriptorGenerator < AbstractGenerator

    def generate(sort_descriptor, context)
      # Nothing declared, nothing published - the frontend then sorts by the primary key, which is
      # what the backend orders by too (HAB-915).
      return nil if sort_descriptor.blank?

      Habarico::SortDescriptor.new(
        field_name: generate_field_name(sort_descriptor, context),
        direction: generate_direction(sort_descriptor, context),
      )
    end

    protected

    # ***********************************************************************
    # Attribute generators
    # ***********************************************************************

    def generate_field_name(sort_descriptor, _context)
      Habarico::OrderByHelper.field_name(sort_descriptor)
    end

    def generate_direction(sort_descriptor, _context)
      Habarico::OrderByHelper.direction(sort_descriptor)
    end

  end
end
