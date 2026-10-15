from importlib import import_module

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.test.signals import setting_changed
from rest_framework.fields import empty
from rest_framework.settings import APISettings

#: The paid extension package. ``habarico`` never imports its classes - it reads the dict of
#: import strings below, and only when the package happens to be installed - but it does know the
#: name, which is what makes ``pip install habarico-enterprise`` the whole configuration.
#: See ``discover_extension_settings()``.
EXTENSION_PACKAGE = "habarico_enterprise"
EXTENSION_MODULE = f"{EXTENSION_PACKAGE}.extensions"

DEFAULTS = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.BasicAuthentication",
    ],
    # Fail closed: an unconfigured project must not expose anonymous CRUD over every registered
    # model (HAB-894/HAB-900). Overriding with ``AllowAny`` trips the ``habarico.W001`` check.
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "habarico.pagination.AdminModelPagination",
    # Page size of the admin list endpoints, resolved by ``AdminModelPagination`` (HAB-946).
    # Both are admin-only knobs, so the admin API can be paginated independently of the rest of
    # the API - exactly like the permission and authentication defaults above. ``None`` /
    # ``empty`` means "not set here", which hands the decision down to eluvia-base-django (its
    # Django settings of the same names). ``MAX_PAGE_LIMIT`` needs the sentinel rather than
    # ``None``, because an explicit ``None`` is what removes the cap entirely.
    "DEFAULT_PAGE_LIMIT": None,
    "MAX_PAGE_LIMIT": empty,
    # Extension points (HAB-811): each resolves to the core implementation by default.
    # A pro/enterprise package points these settings at its own subclass (which calls
    # super()) instead of the core requiring any knowledge of that package.
    "DEFAULT_MODEL_ADMIN_CLASS": "habarico.admin.ModelAdmin",
    "DEFAULT_VIEWSET_CLASS": "habarico.views.AdminModelViewSet",
    "DEFAULT_FIELD_SCHEMA_GENERATOR_CLASS": "habarico.schema.generators.FieldSchemaGenerator",
    "DEFAULT_ADMIN_SITE_CLASS": "habarico.site.AdminSite",
    "DEFAULT_FIELD_TYPE_RESOLVER_CLASS": "habarico.schema.generators.FieldTypeResolver",
    # Mixed into AdminFileSerializer / AdminImageFileSerializer, so an extension can give every
    # admin file field extra behavior without core knowing what that behavior is (chunked uploads
    # live in habarico_enterprise since HAB-845). None on a free-only install. A contributed mixin
    # must implement ``is_pending_upload(value)`` - see
    # ``AdminModelSerializer._pop_upload_references``. One class, not a list: an extension composes
    # its own mixins into a single class first, exactly as it does for ``ModelAdmin``.
    "DEFAULT_FILE_FIELD_MIXIN_CLASS": None,
    # Export (HAB-405). Off unless a resource opts in with ``ModelAdmin.export_enabled`` - there is
    # no installation-wide switch. This is the viewset serving ``GET <resource>/export/``, mixed
    # into the base viewset of an exporting admin; ``habarico_enterprise`` points it at its
    # asynchronous export viewset (HAB-628).
    "EXPORT_VIEWSET_CLASS": "habarico.export.views.ExportAdminModelViewSet",
    # Generator of the export action rendered in the ``list_actions`` slot of the list views.
    "EXPORT_ACTION_SCHEMA_GENERATOR_CLASS": "habarico.export.generators.ExportActionDescriptorGenerator",
    # Document formats an exporting resource offers, in the offered order - the first one is the
    # default of both the export endpoint and the export action. Registering the renderer is what
    # offers the format: XLSX is left out because it needs the optional ``openpyxl`` dependency
    # (``pip install 'habarico[export-xlsx]'``), so a project adds
    # ``habarico.export.renderers.XlsxRenderer`` here once it has it.
    "EXPORT_RENDERER_CLASSES": [
        "habarico.export.renderers.CsvRenderer",
    ],
    # Set to False to ignore installed extensions entirely and run on the core defaults - an
    # escape hatch for debugging ("is this the extension?") and for a project that wants its
    # ADMIN_REST_FRAMEWORK block to be the only source of truth.
    "EXTENSION_DISCOVERY_ENABLED": True,
}


# List of settings that may be in string import notation.
IMPORT_STRINGS = [
    "DEFAULT_AUTHENTICATION_CLASSES",
    "DEFAULT_PERMISSION_CLASSES",
    "DEFAULT_PAGINATION_CLASS",
    "DEFAULT_MODEL_ADMIN_CLASS",
    "DEFAULT_VIEWSET_CLASS",
    "DEFAULT_FIELD_SCHEMA_GENERATOR_CLASS",
    "DEFAULT_ADMIN_SITE_CLASS",
    "DEFAULT_FIELD_TYPE_RESOLVER_CLASS",
    "DEFAULT_FILE_FIELD_MIXIN_CLASS",
    "EXPORT_VIEWSET_CLASS",
    "EXPORT_ACTION_SCHEMA_GENERATOR_CLASS",
    "EXPORT_RENDERER_CLASSES",
]


def discover_extension_settings(known_settings: dict) -> dict:
    """
    Collect the settings contributed by the extension package, when it is installed.

    ``habarico_enterprise.extensions.CONTRIBUTIONS`` is a dict of setting name -> value in the same
    string import notation a project would write. The result sits *between* core's ``DEFAULTS`` and
    the project's ``ADMIN_REST_FRAMEWORK``: installing the package is enough to switch the features
    on, and a project still overrides any single key.

    Only the module name is known here - no class of the extension is imported, and a free-only
    install never touches it.

    Args:
        known_settings (dict): Setting names core understands (its ``DEFAULTS``).

    Returns:
        dict: Contributed settings, empty when the extension is not installed.

    Raises:
        ImproperlyConfigured: The extension contributes a setting name core does not know.
    """
    module_name = EXTENSION_MODULE
    try:
        module = import_module(module_name)
    except ModuleNotFoundError as error:
        # "Not installed" is the normal case and stays silent. An ImportError raised *inside* the
        # extension must not be: swallowing it would disable every paid feature without a word.
        # The package name is derived from ``module_name`` rather than read from EXTENSION_PACKAGE,
        # so the check still holds when the module is pointed elsewhere (as the tests do).
        if error.name in (module_name, module_name.split(".")[0]):
            return {}
        raise

    contributions = dict(module.CONTRIBUTIONS)
    unknown = sorted(set(contributions) - set(known_settings))
    if unknown:
        raise ImproperlyConfigured(
            f"{module_name} contributes unknown setting(s) {', '.join(unknown)}. "
            f"Known settings: {', '.join(sorted(known_settings))}."
        )
    return contributions


class AdminAPISettings(APISettings):
    """
    A settings object similar to DRF settings, but with a different prefix name.
    Its purpose is to configure different base settings for admin views.
    """

    #: Class-level so ``__getattr__`` can read it even before ``__init__`` has run - a missing
    #: instance attribute there would recurse into ``__getattr__`` itself.
    _extensions_applied = False

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Shared instances built by ``get_instance()``, keyed by setting name. Dropped by
        # ``reload()`` so a changed setting always yields an instance of the new class.
        self._instances = {}
        # Core's own defaults, kept pristine: ``self.defaults`` becomes core + contributions.
        self._core_defaults = dict(self.defaults)
        self._extensions_applied = False

    def _apply_extension_settings(self) -> None:
        """
        Fold the installed extensions' contributions into ``self.defaults``.

        Deferred until the first setting is read - this object is built when
        ``habarico.settings`` is imported, which may happen before Django settings are configured,
        and the opt-out flag lives in those settings.
        """
        enabled = self.user_settings.get(
            "EXTENSION_DISCOVERY_ENABLED", self._core_defaults["EXTENSION_DISCOVERY_ENABLED"]
        )
        # Deliberately before the flag is set: a broken extension must raise on every access
        # instead of failing once and then degrading silently to the core defaults.
        contributions = discover_extension_settings(self._core_defaults) if enabled else {}
        self.defaults = {**self._core_defaults, **contributions}
        self._extensions_applied = True

    def __getattr__(self, attr):
        # Private names are skipped deliberately: ``_apply_extension_settings()`` reads
        # ``self.user_settings``, whose ``hasattr(self, "_user_settings")`` probe lands back here.
        # Without this guard that is an infinite recursion on the very first setting read.
        if not self._extensions_applied and not attr.startswith("_"):
            self._apply_extension_settings()
        return super().__getattr__(attr)

    def get_instance(self, setting_name: str):
        """
        Return the shared instance of a ``DEFAULT_*_CLASS`` setting, built on first use.

        Stateless helper classes behind an extension point (e.g.
        ``DEFAULT_FIELD_TYPE_RESOLVER_CLASS``) are resolved for every field of every schema;
        instantiating them per call would make any subclass that does real work in ``__init__``
        pay for it hundreds of times per request. The instance lives as long as the settings do -
        ``reload()`` drops it, and that runs whenever ``ADMIN_REST_FRAMEWORK`` / ``REST_FRAMEWORK``
        changes (see ``reload_api_settings``), so an overridden setting takes effect immediately.

        Args:
            setting_name (str): Name of the ``DEFAULT_*_CLASS`` setting to instantiate.

        Returns:
            Any: The shared instance of the configured class.
        """
        if setting_name not in self._instances:
            self._instances[setting_name] = getattr(self, setting_name)()
        return self._instances[setting_name]

    def reload(self):
        self._instances.clear()
        self._extensions_applied = False
        super().reload()

    @property
    def user_settings(self):
        if not hasattr(self, "_user_settings"):
            base_settings = getattr(settings, "REST_FRAMEWORK", {})
            admin_settings = getattr(settings, "ADMIN_REST_FRAMEWORK", {})
            self._user_settings = {
                **base_settings,
                **admin_settings,
            }
        return self._user_settings


admin_api_settings = AdminAPISettings(None, DEFAULTS, IMPORT_STRINGS)


def reload_api_settings(*args, **kwargs):
    """
    Reload settings when values are changed.
    """
    setting = kwargs["setting"]
    if setting in {"ADMIN_REST_FRAMEWORK", "REST_FRAMEWORK"}:
        admin_api_settings.reload()


setting_changed.connect(reload_api_settings)
