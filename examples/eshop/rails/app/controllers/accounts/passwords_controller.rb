module Accounts
  class PasswordsController < ApplicationController
    before_action :require_signed_in, only: :change

    def change
      user = current_user
      unless user.authenticate(params[:old_password].to_s)
        raise Eluvia::Errors::UnprocessableEntity.new(old_password: 'The password is not correct.')
      end

      user.password = params[:new_password].to_s
      raise Eluvia::Errors::UnprocessableEntity.new(new_password: user.errors[:password]) unless user.save

      # A fresh session id after a credential change; this browser stays signed in.
      reset_session
      session[:user_id] = user.id
      head :no_content
    end

    # Answers the same whether the address exists or not.
    def forgotten
      user = User.find_by(email: params[:email].to_s.strip.downcase)
      UserMailer.with(user: user).reset_password.deliver_now if user
      head :no_content
    end

    def reset
      user = User.find_by_token_for(:password_reset, params[:token].to_s)
      raise Eluvia::Errors::UnprocessableEntity.new(non_field_errors: 'The link is invalid or has expired.') if user.nil?

      user.password = params[:password].to_s
      raise Eluvia::Errors::UnprocessableEntity.new(password: user.errors[:password]) unless user.save

      head :no_content
    end
  end
end
