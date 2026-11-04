module Accounts
  class SessionsController < ApplicationController
    def create
      user = User.find_by(email: params[:username].to_s.strip.downcase)&.authenticate(params[:password].to_s)
      raise Eluvia::Errors::UnprocessableEntity.new(non_field_errors: 'Invalid e-mail or password.') unless user

      reset_session
      session[:user_id] = user.id
      render json: UserSerializer.new(user).to_h
    end

    def destroy
      reset_session
      head :no_content
    end
  end
end
