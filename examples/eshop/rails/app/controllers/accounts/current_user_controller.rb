module Accounts
  class CurrentUserController < ApplicationController
    before_action :require_signed_in

    def show
      render json: UserSerializer.new(current_user).to_h
    end

    def update
      user = current_user
      user.email      = params[:username]   if params.key?(:username)
      user.first_name = params[:first_name] if params.key?(:first_name)
      user.last_name  = params[:last_name]  if params.key?(:last_name)

      unless user.save
        # The admin's profile form calls the e-mail `username`, so the error has to point back at
        # the field the user typed in.
        messages = user.errors.to_hash.transform_keys { |field| field == :email ? :username : field }
        raise Eluvia::Errors::UnprocessableEntity.new(messages)
      end

      render json: UserSerializer.new(user).to_h
    end
  end
end
