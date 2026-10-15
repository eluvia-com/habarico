module Habarico
  module ActionHelper

    def self.is_standard_action?(action)
      %w[show create update delete].include?(action.name)
    end

  end
end
