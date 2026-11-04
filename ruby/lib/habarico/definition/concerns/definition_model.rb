module Habarico
  module DefinitionModel
    extend ActiveSupport::Concern

    def initialize(params = {})
      assign(params)
    end

    # Whether the author said anything about this attribute, as opposed to leaving it alone.
    #
    # The distinction an action slot needs: a slot nobody mentioned publishes the resource's default
    # actions, while `nil` and `[]` are both decisions to render none of them.
    def assigned?(attr)
      @assigned_attrs.present? && @assigned_attrs.include?(attr)
    end

    def assign(params = {})
      self.class.attrs.each do |attr|
        if params.key?(attr)
          self.send("#{attr}=", params[attr])
        end
      end
    end

    class_methods do

      def attrs
        if @attrs.nil?
          @attrs = []
          @attrs.concat(self.superclass.attrs) if self.superclass.respond_to?(:attrs)
        end
        @attrs
      end

      # Records every assignment, so `assigned?` can tell a slot left alone from one emptied on
      # purpose - whichever way the host app wrote it, a constructor hash or a plain setter.
      def attr_accessor(*attrs)
        self.attrs.concat(attrs)
        super(*attrs)
        attrs.each do |attr|
          define_method("#{attr}=") do |value|
            (@assigned_attrs ||= []) << attr
            instance_variable_set("@#{attr}", value)
          end
        end
      end
    end

  end
end
