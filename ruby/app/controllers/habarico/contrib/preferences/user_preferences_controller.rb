module Habarico
  module Contrib
    module Preferences
      # REST endpoints for the per-user preference store. Auth (`authenticate(['public'])`)
      # and `current_user` come from Habarico::ApplicationController. Behavior mirrors the
      # Python UserPreferenceViewSet 1:1 (status codes match doc/openapi.yaml: 200 / 204 /
      # 404 unregistered-or-empty / 422 schema-invalid / 400 malformed body).
      class UserPreferencesController < Habarico::ApplicationController
        # GET user-preferences
        def index
          items = Habarico::Contrib::Preferences.get_values(user_scope).map { |resolved| Serializer.item(resolved) }
          render json: items
        end

        # GET user-preferences/:key
        def show
          resolved = Habarico::Contrib::Preferences.get_value(user_scope, params[:key])
          raise Eluvia::Errors::NotFound.new(not_found_message) if resolved.nil?

          render json: Serializer.item(resolved)
        rescue Habarico::Contrib::Preferences::PreferenceNotRegistered
          raise Eluvia::Errors::NotFound.new(not_found_message)
        end

        # PUT user-preferences/:key
        def update
          resolved = Habarico::Contrib::Preferences.set_value(user_scope, params[:key], value_param)
          render json: Serializer.item(resolved)
        rescue Habarico::Contrib::Preferences::PreferenceNotRegistered
          raise Eluvia::Errors::NotFound.new(not_found_message)
        rescue Habarico::Contrib::Preferences::PreferenceValueTooLarge
          raise Eluvia::Errors::UnprocessableEntity.new({ "value" => value_too_large_message })
        rescue Habarico::Contrib::Preferences::TooManyPreferences
          raise Eluvia::Errors::UnprocessableEntity.new({ "value" => too_many_preferences_message })
        rescue Habarico::Contrib::Preferences::PreferenceValidationError
          raise Eluvia::Errors::UnprocessableEntity.new({ "value" => invalid_value_message })
        end

        # DELETE user-preferences/:key
        def destroy
          Habarico::Contrib::Preferences.delete_value(user_scope, params[:key])
          head :no_content
        rescue Habarico::Contrib::Preferences::PreferenceNotRegistered
          raise Eluvia::Errors::NotFound.new(not_found_message)
        end

        # DELETE user-preferences
        def destroy_all
          Habarico::Contrib::Preferences.delete_values(user_scope)
          head :no_content
        end

        private

        # The auth token subject, stored as a scalar (no DB foreign key).
        def user_scope
          current_user.id.to_s
        end

        # The raw request body IS the preference value (any JSON type: object, array or scalar),
        # mirroring DRF's `request.data`. A malformed body is a 400 (matches openapi BadRequest).
        def value_param
          raw = request.raw_post
          ensure_size_allowed!(raw)
          return nil if raw.nil? || raw.empty?

          JSON.parse(raw)
        rescue JSON::ParserError
          raise Eluvia::Errors::BadRequest.new("Malformed request body.")
        end

        # Refuses an oversized body before it is parsed - the key is in the URL, so its limit is
        # known without looking at the body at all. The registry checks the parsed value as well;
        # this only saves the parse of a body already known to be too big. Raises
        # PreferenceNotRegistered for an unknown key, which `update` turns into the usual 404.
        def ensure_size_allowed!(raw)
          limit = Habarico::Contrib::Preferences.max_bytes_for(params[:key])
          return if limit.nil? || raw.nil?

          size = raw.bytesize
          return if size <= limit

          raise Habarico::Contrib::Preferences::PreferenceValueTooLarge.new(params[:key], limit, size)
        end

        def not_found_message
          I18n.t("habarico.contrib.preferences.not_found", default: "Preference not found.")
        end

        def invalid_value_message
          I18n.t("habarico.contrib.preferences.invalid_value", default: "Invalid value for preference.")
        end

        def value_too_large_message
          I18n.t("habarico.contrib.preferences.value_too_large", default: "Preference value is too large.")
        end

        def too_many_preferences_message
          I18n.t("habarico.contrib.preferences.too_many_preferences",
                 default: "Too many preferences are stored for this user.")
        end
      end
    end
  end
end
