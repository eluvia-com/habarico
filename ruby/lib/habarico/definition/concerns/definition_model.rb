module Habarico
  module DefinitionModel
    extend ActiveSupport::Concern

    def initialize(params = {})
      self.class.attrs.each do |attr|
        if params.key?(attr)
          self.send("#{attr}=", params[attr])
        end
      end
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

      def attr_accessor(*attrs)
        self.attrs.concat(attrs)
        super(*attrs)
      end
    end

  end
end
