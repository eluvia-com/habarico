class Apps::Admin::OrderController < ApplicationController
  include Habarico::Controller

  model Order
  includes [:customer]
  default_sorting 'created_at:desc'

  can_read true
  can_create true
  can_update true

  label 'Orders'
  icon 'ShoppingCart'

  fields [
    :id, :number, :customer, :status,
    Habarico::FieldReference.new(name: :total_major, label: 'Total'),
    :note, :created_at,
  ]
  read_only_fields [:id, :created_at]
  search_fields [:number]
  filters [:status, :customer]
  sorting_fields [:number, :created_at]

  views [:list, :show, :create, :edit]
  actions [:show, :create, :edit]
end
