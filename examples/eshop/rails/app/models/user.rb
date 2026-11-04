class User < ApplicationRecord
  has_secure_password

  # The reset link carries this token. It is derived from the password digest, so it stops working
  # the moment the password changes - and in twenty minutes regardless.
  generates_token_for :password_reset, expires_in: 20.minutes do
    password_salt&.last(10)
  end

  normalizes :email, with: ->(email) { email.strip.downcase }

  validates :email, presence: true, uniqueness: true
  validates :password, length: { minimum: 8 }, allow_nil: true
end
