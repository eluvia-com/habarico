require 'test_helper'

class AuthTest < ActionDispatch::IntegrationTest
  def setup
    @user = User.create!(email: 'ada@example.com', password: 'Secret-pass-1', is_staff: true)
  end

  def login(username: 'ada@example.com', password: 'Secret-pass-1')
    post '/api/auth/login', params: { username: username, password: password }, as: :json
  end

  def csrf
    { 'X-CSRFToken' => cookies['csrftoken'] }
  end

  test 'login with the e-mail, whatever its case' do
    ['ada@example.com', 'ADA@example.com'].each do |username|
      reset! # a browser that holds no session yet
      login(username: username)
      assert_response :success
      assert_equal 'ada@example.com', response.parsed_body['username']
    end
  end

  test 'the frontend sends the Django paths, trailing slash and all' do
    post '/api/auth/login/', params: { username: 'ada@example.com', password: 'Secret-pass-1' }, as: :json
    assert_response :success
  end

  test 'login with a wrong password is a form error' do
    login(password: 'wrong')
    assert_response :unprocessable_entity
    assert_equal 'non_field_errors', response.parsed_body['errors'][0]['source']
  end

  test 'the admin api is 401 without a session' do
    get '/api/admin/schema'
    assert_response :unauthorized
  end

  test 'the admin api is 403 for a user who is not staff' do
    User.create!(email: 'bob@example.com', password: 'Secret-pass-1')
    login(username: 'bob@example.com')
    get '/api/admin/schema'
    assert_response :forbidden
  end

  test 'a write needs the csrf token' do
    login
    patch '/api/auth/current-user', params: { first_name: 'A' }, as: :json
    assert_response :forbidden

    patch '/api/auth/current-user', params: { first_name: 'Ada' }, headers: csrf, as: :json
    assert_response :success
    assert_equal 'Ada', response.parsed_body['first_name']
  end

  test 'logout ends the session' do
    login
    post '/api/auth/logout', headers: csrf
    assert_response :no_content

    get '/api/auth/current-user'
    assert_response :unauthorized
  end

  test 'change password keeps the session' do
    login
    post '/api/auth/current-user/change-password',
         params: { old_password: 'wrong', new_password: 'Another-pass-2' }, headers: csrf, as: :json
    assert_response :unprocessable_entity
    assert_equal 'old_password', response.parsed_body['errors'][0]['source']

    post '/api/auth/current-user/change-password',
         params: { old_password: 'Secret-pass-1', new_password: 'short' }, headers: csrf, as: :json
    assert_response :unprocessable_entity
    assert_equal 'new_password', response.parsed_body['errors'][0]['source']

    post '/api/auth/current-user/change-password',
         params: { old_password: 'Secret-pass-1', new_password: 'Another-pass-2' }, headers: csrf, as: :json
    assert_response :no_content

    get '/api/auth/current-user'
    assert_response :success
  end

  test 'password reset' do
    post '/api/auth/forgotten-password', params: { email: 'ada@example.com' }, as: :json
    assert_response :no_content
    token = ActionMailer::Base.deliveries.last.body.to_s[%r{reset-password/(\S+)}, 1]

    post '/api/auth/reset-password', params: { token: token, password: 'Reset-pass-3' }, as: :json
    assert_response :no_content

    login(password: 'Reset-pass-3')
    assert_response :success

    # The token hangs off the password digest, so changing the password spends it.
    reset!
    post '/api/auth/reset-password', params: { token: token, password: 'Again-pass-4' }, as: :json
    assert_response :unprocessable_entity
  end

  test 'forgotten password does not reveal unknown addresses' do
    post '/api/auth/forgotten-password', params: { email: 'nobody@example.com' }, as: :json
    assert_response :no_content
    assert_empty ActionMailer::Base.deliveries
  end
end
