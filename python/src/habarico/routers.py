from collections import namedtuple

from rest_framework.routers import DefaultRouter, DynamicRoute, Route, escape_curly_brackets

SchemaRoute = namedtuple("SchemaRoute", ["url", "name", "detail", "initkwargs"])


class AdminRouter(DefaultRouter):

    routes = [
        # List route.
        Route(
            url=r"^{prefix}{trailing_slash}$",
            mapping={"get": "list", "post": "create"},
            name="{basename}-list",
            detail=False,
            initkwargs={
                "suffix": "List",
                "action_url_name": "list",
            },
        ),
        Route(
            url=r"^{prefix}/schema{trailing_slash}$",
            mapping={
                "get": "schema_list",
            },
            name="{basename}-schema-list",
            detail=False,
            initkwargs={
                "suffix": "List",
                "action_url_name": "list",
            },
        ),
        # Dynamically generated list routes. Generated using
        # @action(detail=False) decorator on methods of the viewset.
        DynamicRoute(
            url=r"^{prefix}/{url_path}{trailing_slash}$", name="{basename}-{url_name}-list", detail=False, initkwargs={}
        ),
        DynamicRoute(
            url=r"^{prefix}/{url_path}/schema{trailing_slash}$",
            name="{basename}-{url_name}-actionschema-list",
            detail=False,
            initkwargs={},
        ),
        # Detail route.
        Route(
            url=r"^{prefix}/{lookup}{trailing_slash}$",
            mapping={"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"},
            name="{basename}-detail",
            detail=True,
            initkwargs={
                "suffix": "Instance",
                "action_url_name": "detail",
            },
        ),
        Route(
            url=r"^{prefix}/{lookup}/schema{trailing_slash}$",
            mapping={
                "get": "schema_detail",
            },
            name="{basename}-schema-detail",
            detail=True,
            initkwargs={
                "suffix": "Instance",
                "action_url_name": "detail",
            },
        ),
        # Dynamically generated detail routes. Generated using
        # @action(detail=True) decorator on methods of the viewset.
        DynamicRoute(
            url=r"^{prefix}/{lookup}/{url_path}{trailing_slash}$",
            name="{basename}-{url_name}-detail",
            detail=True,
            initkwargs={},
        ),
        DynamicRoute(
            url=r"^{prefix}/{lookup}/{url_path}/schema{trailing_slash}$",
            name="{basename}-{url_name}-actionschema-detail",
            detail=True,
            initkwargs={},
        ),
    ]

    def _get_dynamic_route(self, route, action):
        if "-actionschema-" in route.name:
            mapping = {
                "get": "schema_detail" if action.detail else "schema_list",
            }
        else:
            mapping = action.mapping

        initkwargs = route.initkwargs.copy()
        initkwargs.update(action.kwargs)
        url_path = escape_curly_brackets(action.url_path)

        return Route(
            url=route.url.replace("{url_path}", url_path),
            mapping=mapping,
            name=route.name.replace("{url_name}", action.url_name),
            detail=route.detail,
            initkwargs={
                **initkwargs,
                "action_url_name": route.name.replace("{basename}-", "")
                .replace("{url_name}", action.url_name)
                .replace("-actionschema", ""),
            },
        )
