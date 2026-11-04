class UserMailer < ApplicationMailer
  def reset_password
    @user = params[:user]
    @url = format(Rails.configuration.x.password_reset_url, token: @user.generate_token_for(:password_reset))
    mail(to: @user.email, subject: 'Reset your password')
  end
end
