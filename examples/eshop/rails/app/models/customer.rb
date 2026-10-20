class Customer < ApplicationRecord
  include Eluvia::ActiveRecord::Filtering
  include Eluvia::ActiveRecord::Ordering

  class Filters
    include Eluvia::ActiveRecord::FiltersModel

    # See Category::Filters — `id__in` is what resolves a relation column's labels.
    string_attr :id
    string_attr :email
  end

  has_many :orders, dependent: :restrict_with_error

  validates :first_name, :last_name, presence: true
  validates :email, presence: true, uniqueness: true

  def to_s
    "#{first_name} #{last_name}"
  end
end
