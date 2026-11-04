require "rails/generators"
require "rails/generators/migration"
# Defines ActiveRecord::Generators::Base, whose next_migration_number is reused below. Railties
# does not autoload it, so without this require the generator fails with a NameError.
require "rails/generators/active_record"

module Habarico
  module Preferences
    module Generators
      # Copies the habarico_user_preferences migration into the host app:
      #   rails g habarico:preferences:install
      class InstallGenerator < Rails::Generators::Base
        include Rails::Generators::Migration

        source_root File.expand_path("templates", __dir__)

        def self.next_migration_number(dirname)
          ActiveRecord::Generators::Base.next_migration_number(dirname)
        end

        def create_migration_file
          migration_template(
            "create_habarico_user_preferences.rb.tt",
            "db/migrate/create_habarico_user_preferences.rb"
          )
        end
      end
    end
  end
end
