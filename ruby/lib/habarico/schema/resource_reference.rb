module Habarico
  # Address of a resource, optionally narrowed to one record and one of its actions.
  #
  # The parts are the ones a route is built from: the service, `admin/{resource_name}`, then the
  # optional `{record_pk}` and `{action_name}` segments, then the query. A bare name belongs to this
  # service and leaves `service` out - a backend cannot name its own service.
  class ResourceReference
    include ::ActiveModel::Model
    include Eluvia::ActiveModel::Attributes

    # Written by an author in place of a resource name, and resolved by the generator that knows the
    # address it stands for, so what reaches the client is always a plain address.
    class ContextReference
      def initialize(label)
        @label = label
      end

      def inspect
        @label
      end
      alias to_s inspect
    end

    # The resource the schema is being generated for - the page a descriptor was authored on.
    CURRENT = ContextReference.new('CURRENT').freeze

    # The collection a surrounding box lists, which its header toolbar renders outside of.
    LIST = ContextReference.new('LIST').freeze

    # Service the resource belongs to; absent means this one
    string_attr :service

    # Name of the resource, without a service
    string_attr :resource

    # Primary key of the record the address is narrowed to
    string_attr :record_pk

    # Name of the controller action whose own schema is addressed
    string_attr :action_name

    # Query of the addressed request
    has_many_attr :params, 'String', underlying_type: :hash

    # Compose an address from a name that may carry its service, which is how an author writes one.
    #
    # The one place a `service/resource` string is taken apart: the address itself keeps the halves
    # apart, the way the wire carries them.
    def self.build(name, record_pk: nil, action_name: nil, params: nil)
      return nil if name.blank?
      raise Eluvia::Errors::StandardError.new("#{name.class} is an address already, not a resource name. Pass the name, or write the address out.") if name.is_a?(ResourceReference)
      raise Eluvia::Errors::StandardError.new("#{name.inspect} stands in place of an address, not inside one. Pass it as the reference itself.") if name.is_a?(ContextReference)

      service, _, resource = name.to_s.rpartition('/')
      new(
        service: service.presence,
        resource: resource,
        record_pk: record_pk,
        action_name: action_name,
        params: params,
      )
    end

    # The address as one `service/resource` name, or the bare resource when it has no service.
    #
    # The form a query string names a resource by: `_source` carries it as a key.
    def qualified_name
      service.present? ? "#{service}/#{resource}" : resource
    end

  end
end
