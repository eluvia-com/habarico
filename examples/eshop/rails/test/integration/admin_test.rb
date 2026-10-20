require 'test_helper'

# A smoke test of the library itself: the example is in this repository so that a change that
# breaks it fails here, in the same pull request.
class AdminTest < ActionDispatch::IntegrationTest
  def setup
    User.create!(email: 'ada@example.com', password: 'Secret-pass-1', is_staff: true)
    post '/api/auth/login', params: { username: 'ada@example.com', password: 'Secret-pass-1' }, as: :json

    category = Category.create!(name: 'Books')
    Product.create!(name: 'Dune', sku: 'dune', category: category, price: 1290, stock: 40, status: 'published')
  end

  test 'the schema lists the four resources' do
    get '/api/admin/schema'
    assert_response :success
    assert_equal %w[category customer order product], response.parsed_body.map { |resource| resource['name'] }.sort
  end

  test 'a list response carries the record and its money field' do
    get '/api/admin/product'
    assert_response :success

    product = response.parsed_body['objects'].first
    assert_equal 'Dune', product['name']
    assert_in_delta 12.90, product['price_major']
  end

  test 'the money field is published in the currency the initializer sets' do
    get '/api/admin/product/schema'
    assert_response :success

    price = response.parsed_body.dig('endpoints', 'get', 'fields').find { |field| field['name'] == 'price_major' }
    assert_equal 'USD', price.dig('options', 'number', 'currency')
  end
end
