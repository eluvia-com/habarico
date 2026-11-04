class CreateEshop < ActiveRecord::Migration[7.2]
  def change
    create_table :users do |t|
      t.string :email, null: false, index: { unique: true }
      t.string :password_digest, null: false
      t.string :first_name, null: false, default: ''
      t.string :last_name, null: false, default: ''
      t.boolean :is_staff, null: false, default: false
      t.timestamps
    end

    create_table :categories do |t|
      t.string :name, null: false
      t.text :description, null: false, default: ''
      t.timestamps
    end

    create_table :products do |t|
      t.string :name, null: false
      t.string :sku, null: false, index: { unique: true }
      t.text :description, null: false, default: ''
      t.string :status, null: false, default: 'draft'
      t.references :category, null: false, foreign_key: true
      # Minor units - see Product#price_major.
      t.integer :price, null: false, default: 0
      t.integer :stock, null: false, default: 0
      t.timestamps
    end

    create_table :customers do |t|
      t.string :first_name, null: false
      t.string :last_name, null: false
      t.string :email, null: false, index: { unique: true }
      t.timestamps
    end

    create_table :orders do |t|
      t.string :number, null: false, index: { unique: true }
      t.references :customer, null: false, foreign_key: true
      t.string :status, null: false, default: 'new'
      t.integer :total, null: false, default: 0
      t.text :note, null: false, default: ''
      t.timestamps
    end
  end
end
