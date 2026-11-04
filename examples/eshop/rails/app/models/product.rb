class Product < ApplicationRecord
  include Eluvia::ActiveModel::AmountAttribute
  include Eluvia::ActiveModel::EnumAttribute
  include Eluvia::ActiveRecord::Filtering
  include Eluvia::ActiveRecord::Ordering

  # What the resource may be filtered by. eluvia-base looks the class up by name, so every model
  # a Habarico resource serves needs one.
  class Filters
    include Eluvia::ActiveRecord::FiltersModel

    string_attr :id
    string_attr :status
    has_one_attr :category, 'Category::Filters'
  end

  # The `price` column holds minor units. The resource exposes `price_major`, which Habarico
  # renders as money in Habarico::Config.currency.
  amount_attr :price

  enum_attr :status, [
    { value: 'draft',     label: 'Draft',     color: 'inherit' },
    { value: 'published', label: 'Published', color: 'success' },
    { value: 'archived',  label: 'Archived',  color: 'warning' },
  ], default: 'draft'

  belongs_to :category

  validates :name, presence: true
  validates :sku, presence: true, uniqueness: true

  def to_s
    name
  end
end
