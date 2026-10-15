from django.conf import settings
from django.test.signals import setting_changed
from rest_framework.settings import APISettings

DEFAULTS = {
    "DEFAULTS": {},
    # Largest serialized size (bytes) one preference value may have. Looked up by the exact
    # key -- or the pattern string -- a preference was registered under, falling back to
    # "default". `None` (for one entry or for the whole setting) means no limit.
    #
    # The values below sit an order of magnitude above what the frontend actually writes:
    # 100 datagrid columns are ~2 KB of `columns`/`columnWidths`, a 30-widget dashboard
    # ~19 KB and 20 saved queries ~11 KB at their fullest.
    "MAX_VALUE_BYTES": {
        "default": 16 * 1024,
        "preferences.dashboard": 32 * 1024,
        r"[a-zA-Z][a-zA-Z0-9_./-]*\.savedQueries": 32 * 1024,
    },
    # Largest number of preference rows one user may hold, or `None` for no limit. Checked
    # only when a NEW key is created, so a user already past the limit can still shrink or
    # overwrite what they already have. The cap is needed because the pattern keys match an
    # unbounded set of names, so the per-value limit alone does not bound the per-user total.
    "MAX_KEYS_PER_USER": 2000,
}


class PreferenceSettings(APISettings):
    """Lazy settings object for `HABARICO_PREFERENCES` (mirrors `AdminAPISettings`)."""

    @property
    def user_settings(self):
        if not hasattr(self, "_user_settings"):
            self._user_settings = getattr(settings, "HABARICO_PREFERENCES", {})
        return self._user_settings


preference_settings = PreferenceSettings(None, DEFAULTS, [])


def reload_preference_settings(*args, **kwargs):
    if kwargs["setting"] == "HABARICO_PREFERENCES":
        preference_settings.reload()


setting_changed.connect(reload_preference_settings)
