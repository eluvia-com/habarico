from __future__ import annotations

from .actions import GlobalResourceActionSchema, ResourceActionSchema
from .base import BaseSchema
from .fields import FieldSchema, FilterSchema
from .menu import MenuSchema
from .views import GlobalViewSchema, ViewSchema


class GlobalResourceSchema(BaseSchema):

    def __init__(
        self,
        *,
        name: str,
        label: str,
        pk_field_name: str,
        views: list[GlobalViewSchema],
        actions: list[GlobalResourceActionSchema],
        menu: MenuSchema | None,
    ):
        """
        Object represents schema of the global resource, returned by the service schema endpoint (`/admin/schema`).

        Args:
            name (str): Name of the resource.
            label (str): Label of the resource.
            pk_field_name (str): Primary key field name.
            views (list[GlobalViewSchema]): Views of the resource.
            actions (list[GlobalResourceActionSchema]): Actions of the resource.
            menu (MenuSchema, optional): Menu of the resource. Defaults to None.

        Optional keys contributed by a pro/enterprise package (e.g. ``aggregate_enabled``,
        ``dashboard_enabled``, ``global_fulltext_search_enabled``) are declared on that package's
        own subclass - see ``AdminSchemaGenerator.schema_class``. None of them is required by
        ``contract/openapi.yaml``, so a free-only install simply omits them.
        """
        self._name = name
        self._label = label
        self._pk_field_name = pk_field_name
        self._views = views
        self._actions = actions
        self._menu = menu


class ObjectResourceSchema(BaseSchema):

    def __init__(
        self,
        *,
        name: str,
        label: str,
        pk_field_name: str,
        actions: list[ResourceActionSchema] | None = None,
    ):
        """
        Object represents schema of the resource.

        Args:
            name (str): Name of the resource.
            label (str): Label of the resource.
            pk_field_name (str): Primary key field name.
            actions (list[ResourceActionSchema] | None): Actions of the resource. Defaults to None.
        """
        self._name = name
        self._label = label
        self._pk_field_name = pk_field_name
        self._actions = actions


class MethodSchema(BaseSchema):

    def __init__(
        self,
        *,
        fields: list[FieldSchema],
        filters: list[FilterSchema] | None = None,
    ):
        """
        Object represents schema of the method.

        Args:
            fields (list[FieldSchema]): Fields of the method.
            filters (list[FilterSchema], optional): Filters of the method.
        """
        self._fields = fields
        self._filters = filters


class EndpointsSchema(BaseSchema):

    def __init__(
        self,
        *,
        get: MethodSchema | None = None,
        post: MethodSchema | None = None,
        put: MethodSchema | None = None,
        patch: MethodSchema | None = None,
        delete: MethodSchema | None = None,
    ):
        """
        Object represents schema of the endpoints, one entry per HTTP method.

        Args:
            get (MethodSchema, optional): GET method. Defaults to None.
            post (MethodSchema, optional): POST method. Defaults to None.
            put (MethodSchema, optional): PUT method. Defaults to None.
            patch (MethodSchema, optional): PATCH method. Defaults to None.
            delete (MethodSchema, optional): DELETE method. Defaults to None.
        """
        self._get = get
        self._post = post
        self._put = put
        self._patch = patch
        self._delete = delete


class LocalResourceSchema(BaseSchema):

    def __init__(
        self,
        *,
        name: str,
        label: str,
        pk_field_name: str,
        actions: list[ResourceActionSchema] | None = None,
        views: list[ViewSchema] | None = None,
        endpoints: EndpointsSchema | None = None,
    ):
        """
        Object represents schema of the resource with methods.

        Args:
            name (str): Name of the resource.
            label (str): Label of the resource.
            pk_field_name (str): Primary key field name.
            views (list[ViewSchema]): Views of the resource.
            actions (list[ResourceActionSchema]): Actions of the resource.
            endpoints (EndpointsSchema): Endpoints contain the methods supported by the resource.
        """
        super().__init__()
        self._name = name
        self._label = label
        self._pk_field_name = pk_field_name
        self._actions = actions
        self._views = views
        self._endpoints = endpoints
