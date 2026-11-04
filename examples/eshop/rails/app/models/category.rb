class Category < ApplicationRecord
  include Eluvia::ActiveRecord::Filtering
  include Eluvia::ActiveRecord::Ordering

  class Filters
    include Eluvia::ActiveRecord::FiltersModel

    # `id` carries `id__in`, which is how the admin resolves the labels of the records a relation
    # column points at. Every resource reachable through a relation needs it.
    string_attr :id
    string_attr :name
  end

  has_many :products, dependent: :restrict_with_error

  validates :name, presence: true

  def to_s
    name
  end
end
