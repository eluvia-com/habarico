# The admin's own routes are drawn by the engine from Habarico::Config.resources; these are the
# auth contract the frontend expects, on the same paths the Django backend serves them.
Rails.application.routes.draw do
  scope 'api/auth', module: 'accounts', format: false do
    post  'login',                        to: 'sessions#create'
    post  'logout',                       to: 'sessions#destroy'
    get   'current-user',                 to: 'current_user#show'
    patch 'current-user',                 to: 'current_user#update'
    post  'current-user/change-password', to: 'passwords#change'
    post  'forgotten-password',           to: 'passwords#forgotten'
    post  'reset-password',               to: 'passwords#reset'
  end
end
