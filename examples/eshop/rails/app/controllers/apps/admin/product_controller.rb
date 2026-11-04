class Apps::Admin::ProductController < ApplicationController
  include Habarico::Controller

  model Product
  includes [:category]
  default_sorting 'created_at:desc'

  can_read true
  can_create true
  can_update true
  can_delete true

  label 'Products'
  icon 'Inventory'

  # `price_major` is the major-unit reader of the `price` column, which holds minor units; the
  # label keeps that an implementation detail.
  fields [
    :id, :name, :sku, :description, :status, :category,
    Habarico::FieldReference.new(name: :price_major, label: 'Price'),
    :stock, :created_at,
  ]
  read_only_fields [:id, :created_at]
  search_fields [:name, :sku]
  filters [:status, :category]
  sorting_fields [:name, :stock, :created_at]

  views [:list, :show, :create, :edit]
  actions [:show, :create, :edit, :delete]
end
