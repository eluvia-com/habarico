class CreateHabaricoUserPreferences < ActiveRecord::Migration[7.0]
  def change
    create_table :habarico_user_preferences, id: :uuid do |t|
      # Auth token subject (current_user.id). Stored as a scalar string - no FK, because the
      # user may live in another service. Add a FK here yourself if your app has a local users table.
      t.string :user_id, null: false
      t.string :key, null: false
      t.jsonb :value, null: false
      t.datetime :updated_at, null: false
    end

    add_index :habarico_user_preferences, %i[user_id key], unique: true,
              name: "idx_habarico_user_prefs_user_key"
  end
end
