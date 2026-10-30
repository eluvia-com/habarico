class Order < ApplicationRecord
  include Eluvia::ActiveModel::AmountAttribute
  include Eluvia::ActiveModel::EnumAttribute
  include Eluvia::ActiveRecord::Filtering
  include Eluvia::ActiveRecord::Ordering

  class Filters
    include Eluvia::ActiveRecord::FiltersModel

    string_attr :id
    string_attr :status
    has_one_attr :customer, 'Customer::Filters'
  end

  amount_attr :total

  enum_attr :status, [
    { value: 'new',       label: 'New',       color: 'inherit' },
    { value: 'paid',      label: 'Paid',      color: 'success' },
    { value: 'shipped',   label: 'Shipped',   color: 'info' },
    { value: 'cancelled', label: 'Cancelled', color: 'error' },
  ], default: 'new'

  belongs_to :customer

  validates :number, presence: true, uniqueness: true

  def to_s
    number
  end
end
