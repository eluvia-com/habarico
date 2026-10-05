module Habarico
  module BoxHelper
    def self.get_referenced_definition(box)
      if box.reference
        return Habarico::ResourceService.instance.get_definition(Habarico::ResourceService.instance.get_resource_path(box.reference))
      end
      nil
    end

    def self.get_referenced_model(box)
      referenced_definition = get_referenced_definition(box)
      if referenced_definition
        return referenced_definition.model
      end
      nil
    end

    # The query that ties a box's resource to the record the surrounding view renders.
    #
    # The two say the same id in two languages. `_target` is the child's: the foreign key column on
    # the listed resource that points back, which is what filters the list and what prefills a
    # record created from it. `_source` is the parent's: its resource identity, which is why it can
    # carry a slash where a column name never can.
    #
    # `source` is how the parent resource is named in a query string - the joined resource path,
    # which is the identity the frontend composes too. Returns nil when there is no record to link
    # to, which is every collection schema.
    def self.parent_link_params(box, context, source)
      record_pk = context.respond_to?(:record_pk) ? context.record_pk : nil
      return nil if record_pk.blank? || source.blank?

      params = { "_source" => dump_link_param(source, record_pk) }
      params["_target"] = dump_link_param(box.target, record_pk) if box.target.present?
      params
    end

    # One `{name: pk}` link parameter, written the way the frontend writes the same one:
    # `JSON.stringify` puts no space after the separators, and the frontend composes this very pair
    # for the box's own schema request - a different spelling of one fact would have the client cache
    # the same schema twice.
    def self.dump_link_param(name, pk)
      JSON.generate({ name.to_s => pk.to_s })
    end

  end
end
