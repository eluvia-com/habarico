require "active_record"

module Habarico
  module Contrib
    module Preferences
      # Per-user preference row. Keyed on the scalar `user_id` (the auth token subject
      # `current_user.id`), NOT a DB foreign key: in the token-based, multi-service
      # setup the user is often not a local ActiveRecord row, so there is no local table
      # to reference. Hosts that do have a local users table can add a FK in their own
      # (generator-copied) migration.
      class UserPreference < ::ActiveRecord::Base
        self.table_name = "habarico_user_preferences"
      end
    end
  end
end
