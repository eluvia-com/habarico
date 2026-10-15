"""
Pagination for the admin list endpoints.

``eluvia_base_django`` resolves the ``limit`` query parameter through overridable getters
(``LimitResolutionMixin``) and hands the paginator the view it is paginating for. Habarico uses
both: the view carries the ``ModelAdmin``, so a single resource can declare its own page size
without a paginator subclass, and without the viewset writing into the paginator from outside.
"""

from eluvia_base_django.rest_framework.paginations import ModelPagination
from habarico.settings import admin_api_settings
from rest_framework.fields import empty
from rest_framework.request import Request


class AdminModelPagination(ModelPagination):
    """
    Limit/offset pagination resolving its limits per admin.

    A limit is looked up in three layers, the first one that has an opinion wins:

    1. ``ModelAdmin.default_page_limit`` / ``ModelAdmin.max_page_limit`` of the admin being
       listed (``None`` means "not set");
    2. ``DEFAULT_PAGE_LIMIT`` / ``MAX_PAGE_LIMIT`` in the project's ``ADMIN_REST_FRAMEWORK``
       block, so the admin API can be paginated differently from the rest of the API;
    3. what ``eluvia_base_django`` itself resolves - the Django settings of the same names, then
       its ``default_limit`` / ``max_limit`` class attributes (``20`` and ``1000``), which is
       why neither setting has to be defined for a list endpoint to work.

    Layer 2 is passed down in ``__init__``, which keeps an explicit constructor argument stronger
    than any setting - the precedence ``eluvia_base_django`` documents - and hands anything the
    project did not set to layer 3 untouched. Layer 1 sits in the getters and therefore wins over
    everything; outside a DRF view (no ``self.view``) it simply does not apply.
    """

    def __init__(
        self,
        default_limit: int | None = None,
        max_limit: int | None | type[empty] = empty,
        disable_errors: bool | None = None,
    ):
        """
        Args:
            default_limit (int | None): Page size for a request without a ``limit`` parameter.
                ``None`` resolves it from the settings instead.
            max_limit (int | None): Upper bound for ``limit``. The ``empty`` sentinel resolves it
                from the settings; an explicit ``None`` removes the cap.
            disable_errors (bool | None): ``True`` falls back to the default limit instead of
                raising on an invalid ``limit``. ``None`` keeps the class attribute.
        """
        # Each value stays at its "not configured here" marker when the project's block is silent
        # - None for the default limit, the `empty` sentinel for the maximum - so the library
        # resolves it from the Django settings and then from its own class attributes. The
        # sentinel is what keeps an explicit `MAX_PAGE_LIMIT = None` ("no cap") distinguishable
        # from an absent one.
        if default_limit is None:
            default_limit = admin_api_settings.DEFAULT_PAGE_LIMIT
        if max_limit is empty:
            max_limit = admin_api_settings.MAX_PAGE_LIMIT
        super().__init__(default_limit=default_limit, max_limit=max_limit, disable_errors=disable_errors)

    def get_default_limit(self, request: Request) -> int:
        """
        Page size for a request that sends no ``limit``.

        Args:
            request (Request): DRF request being paginated.

        Returns:
            int: The admin's ``default_page_limit``, or what the settings resolved to.
        """
        value = self._admin_limit("default_page_limit")
        return super().get_default_limit(request) if value is None else value

    def get_max_limit(self, request: Request) -> int | None:
        """
        Upper bound for the ``limit`` query parameter.

        Args:
            request (Request): DRF request being paginated.

        Returns:
            int | None: The admin's ``max_page_limit``, or what the settings resolved to.
                ``None`` means the limit is not capped.
        """
        value = self._admin_limit("max_page_limit")
        return super().get_max_limit(request) if value is None else value

    def _admin_limit(self, name: str) -> int | None:
        """
        Read one limit declaration off the admin of the view being paginated.

        Args:
            name (str): Attribute name, ``"default_page_limit"`` or ``"max_page_limit"``.

        Returns:
            int | None: The declared value, or ``None`` when the admin does not declare it -
                including when the paginator runs outside a DRF view, or on a view that is not
                an admin viewset.
        """
        admin = getattr(self.view, "admin", None)
        return None if admin is None else getattr(admin, name, None)
