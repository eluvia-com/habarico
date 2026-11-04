class ApplicationController < ActionController::API
  # An API controller has neither of these; the session cookie and its CSRF guard need both.
  include ActionController::Cookies
  include ActionController::RequestForgeryProtection
  include Eluvia::ErrorHandler

  protect_from_forgery with: :exception

  # Registered after Eluvia::ErrorHandler's catch-all, so it wins: a missing CSRF token is a 403,
  # not a 500.
  rescue_from(ActionController::InvalidAuthenticityToken) do
    handle_error(Eluvia::Errors::Forbidden.new('CSRF token missing or incorrect.'))
  end

  after_action :set_csrf_cookie

  def current_user
    return @current_user if defined?(@current_user)

    @current_user = User.find_by(id: session[:user_id])
  end

  # The hook Habarico calls before every resource and engine endpoint. The admin is staff-only,
  # so no admin endpoint is reachable anonymously.
  def authenticate_request
    require_signed_in
    raise Eluvia::Errors::Forbidden.new('The admin is open to staff accounts only.') unless current_user.is_staff?
  end

  private

  # Django's SessionAuthentication checks the CSRF token only once a session identifies a user,
  # which is what lets the admin sign in and ask for a reset link before it holds one. Rails
  # would otherwise refuse those three anonymous POSTs.
  def protect_against_forgery?
    super && session[:user_id].present?
  end

  def require_signed_in
    raise Eluvia::Errors::Unauthorized.new('Authentication credentials were not provided.') if current_user.nil?
  end

  # Django names the cookie `csrftoken` and reads the header `X-CSRFToken`. One frontend build
  # talks to both backends, so this one answers to the same two names.
  def set_csrf_cookie
    cookies['csrftoken'] = { value: form_authenticity_token, same_site: :lax }
  end

  def request_authenticity_tokens
    super << request.headers['X-CSRFToken']
  end
end
