# The signed-in user in the shape the admin expects: it signs in with `username`, which here is
# the e-mail address.
class UserSerializer
  def initialize(user)
    @user = user
  end

  def to_h
    {
      id: @user.id,
      username: @user.email,
      email: @user.email,
      first_name: @user.first_name,
      last_name: @user.last_name,
    }
  end
end
