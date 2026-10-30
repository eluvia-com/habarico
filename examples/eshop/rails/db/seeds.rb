# Creates the admin user admin@habarico.com / admin1234 and a few records to look at.
admin = User.find_or_initialize_by(email: 'admin@habarico.com')
if admin.new_record?
  admin.update!(password: 'admin1234', first_name: 'Ada', last_name: 'Admin', is_staff: true)
end

books = Category.find_or_create_by!(name: 'Books')
games = Category.find_or_create_by!(name: 'Board games')

[
  ['dune',        'Dune',        books, 1290, 40],
  ['hobbit',      'The Hobbit',  books,  950, 25],
  ['catan',       'Catan',       games, 4400,  8],
  ['carcassonne', 'Carcassonne', games, 3500,  0],
].each do |sku, name, category, price, stock|
  Product.find_or_create_by!(sku: sku) do |product|
    product.name = name
    product.category = category
    product.price = price
    product.stock = stock
    product.status = 'published'
  end
end

zoe = Customer.find_or_create_by!(email: 'zoe@example.com') do |customer|
  customer.first_name = 'Zoë'
  customer.last_name = 'Müller'
end

Order.find_or_create_by!(number: '2026-0001') do |order|
  order.customer = zoe
  order.total = 5690
end

puts 'Sign in as admin@habarico.com / admin1234'
