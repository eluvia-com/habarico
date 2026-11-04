class Apps::Admin::CustomerController < ApplicationController
  include Habarico::Controller

  model Customer
  default_sorting 'last_name:asc'

  can_read true
  can_create true
  can_update true
  can_delete true

  label 'Customers'
  icon 'People'

  fields [:id, :first_name, :last_name, :email, :created_at]
  read_only_fields [:id, :created_at]
  search_fields [:first_name, :last_name, :email]
  sorting_fields [:last_name, :created_at]

  views [:list, :show, :create, :edit]
  actions [:show, :create, :edit, :delete]
end
