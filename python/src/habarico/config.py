from django.conf import settings

NAMESPACE = "habarico"

#: Name of the DRF action serving the export (``habarico.export``). Declared here, next to the
#: permission map, so that ``AdminPermission`` checks it without importing the export.
EXPORT_ACTION = "export"

#: Viewset actions whose permission ``AdminPermission`` evaluates, mapped to the ``ModelAdmin``
#: flag that governs each one. Anything outside this map - the generated ``schema`` routes, a
#: project's own ``@action`` - is let through unchecked, so "AdminPermission said yes" does not
#: mean "this action was checked". A caller that lets user input pick the action must therefore
#: refuse the ones that are not listed here; see ``AdminFilterSet.filter__reverse_field``.
PERMISSION_FLAG_PER_ACTION = {
    "list": "can_read",
    "retrieve": "can_read",
    "create": "can_create",
    "update": "can_update",
    "partial_update": "can_update",
    "destroy": "can_delete",
    # Exporting a resource is reading it: without this entry an export would be served for a
    # resource the user may not read.
    EXPORT_ACTION: "can_read",
}

MENU_GENERATOR_DEFAULT_PRIORITY = getattr(settings, "ADMIN_MENU_GENERATOR_DEFAULT_PRIORITY", 5)

SEARCH_UNACCENT_ENABLED = getattr(settings, "ADMIN_SEARCH_UNACCENT_ENABLED", False)
