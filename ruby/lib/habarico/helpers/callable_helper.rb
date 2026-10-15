module Habarico
  module CallableHelper

    def self.resolve(callable_or_value, context)
      if callable_or_value.respond_to?(:call)
        callable_or_value.call(context)
      elsif callable_or_value.is_a?(::String)
        callable_or_value.to_s.sub(/{id}/, context.record_pk.to_s)
      else
        callable_or_value
      end
    end

  end
end
