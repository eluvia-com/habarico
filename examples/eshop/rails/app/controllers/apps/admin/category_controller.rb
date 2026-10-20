class Apps::Admin::CategoryController < ApplicationController
  include Habarico::Controller

  model Category
  default_sorting 'name:asc'

  can_read true
  can_create true
  can_update true
  can_delete true

  label 'Categories'
  icon 'Category'

  fields [:id, :name, :description]
  read_only_fields [:id]
  search_fields [:name]
  sorting_fields [:name]

  views [:list, :show, :create, :edit]
  actions [:show, :create, :edit, :delete]
end
