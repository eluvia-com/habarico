module Habarico
  class ApplicationController < Habarico::Config.base_controller_class.constantize
    include Eluvia::ErrorHandler
    include Habarico::Authenticatable

    # ***************************************************************************
    # JSON as default format
    # ***************************************************************************

    before_action do
      request.format = :json if %w[text/html */*].include?(request.format.to_s)
    end

  end
end
