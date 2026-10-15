from __future__ import annotations

from typing import TYPE_CHECKING

from django.db.models import Model
from django.utils.functional import cached_property
from habarico.export.config import can_export
from habarico.export.wiring import add_export_list_action, compose_export_viewset
from habarico.schema import (
    ActionSchemaGenerator,
    AdminSchemaGenerator,
    CreateActionSchemaGenerator,
    CreateViewSchemaGenerator,
    DeleteActionSchemaGenerator,
    EditActionSchemaGenerator,
    EditViewSchemaGenerator,
    ListViewSchemaGenerator,
    MenuSchemaGenerator,
    ShowActionSchemaGenerator,
    ShowViewSchemaGenerator,
    ViewSchemaGenerator,
)
from habarico.settings import admin_api_settings
from habarico.utils import cap_first, get_model_name
from habarico.validation import AdminConfigurationValidator
from rest_framework.request import Request

if TYPE_CHECKING:
    from habarico.export.generators import ExportActionDescriptorGenerator
    from habarico.schema import BaseSchema, Fields, Filters, SortingOrStr
    from habarico.schema.actions import ExportActionDescriptor
    from habarico.views import AdminModelViewSet
    from rest_framework.routers import BaseRouter
    from rest_framework.viewsets import ViewSet

admin_classes = {}


class AdminBase(type):
    """
    Metaclass for IS core classes. Its main purpose is automatic registration cores to your application.
    """

    def __new__(cls, *args, **kwargs):
        from habarico.site import site

        name, _, attrs = args

        abstract = attrs.pop("abstract", False)
        super_new = super(AdminBase, cls).__new__
        new_class = super_new(cls, *args, **kwargs)

        if not abstract:
            site.register(new_class)
        return new_class


class Admin(metaclass=AdminBase):
    abstract = True
    name = None
    menu_schema_generator = None
    schema_generator_class = None
    view_schema_generators = []
    action_schema_generators = []

    def validate_configuration(self) -> None:
        """
        Validate the admin declaration.

        Called once per admin class by ``AdminSite.register()``, when the class is registered
        (at app startup). Raise ``ImproperlyConfigured`` from an override to reject a bad
        declaration before the resource is wired up. The base implementation does nothing.
        """

    def get_viewset(self) -> ViewSet:
        """
        Get the viewset for the model.

        Returns:
            ViewSet: viewset for the model.
        """

        raise NotImplementedError

    def get_router(self) -> BaseRouter:
        """
        Get the router for the model.

        Returns:
            BaseRouter: router for the model.
        """
        raise NotImplementedError

    def get_menu_schema_generator(self, request: Request) -> MenuSchemaGenerator:
        """
        Get the menu schema generator for the admin.

        Args:
            request (Request): DRF request.

        Returns:
            MenuSchemaGenerator: menu schema generator for the admin.
        """
        return self.menu_schema_generator

    def get_schema_generator(self, request: Request):
        """
        Get the schema generator for the admin.

        Args:
            request (Request): DRF request.

        Returns:
            AdminSchemaGenerator: schema generator for the admin.
        """
        return self.schema_generator_class(self)

    def get_schema(self, request: Request):
        """
        Get the schema for the admin.

        Args:
            request (Request): DRF request.

        Returns:
            AdminSchemaGenerator: schema generator for the admin.
        """
        return self.get_schema_generator(request)

    def get_view_schema_generators(self, request: Request, obj: Model | None = None) -> list[ViewSchemaGenerator]:
        """
        Get the view schema generators for the model.

        Args:
            request (Request): DRF request.
            obj (Model | None): model instance.

        Returns:
            list[ViewSchemaGenerator]: list of view schema generators.
        """
        return list(self.view_schema_generators)

    def get_action_schema_generators(self, request: Request, obj: Model | None = None) -> list[ActionSchemaGenerator]:
        """
        Get the action schema generators for the model.

        Args:
            request (Request): DRF request.
            obj (Model | None): model instance.

        Returns:
            list[ActionSchemaGenerator]: list of action schema generators.
        """
        return list(self.action_schema_generators)

    def get_view_schemas(self, request: Request, obj: Model | None = None) -> list[BaseSchema]:
        """
        Get the view schemas for the model. View schemas can be generated from the view schema generators.

        Args:
            request (Request): DRF request.
            obj (Model | None): model instance.

        Returns:
            list[BaseSchema]: list of view schemas.
        """
        schemas = []
        for schema in self.get_view_schema_generators(request, obj):
            if isinstance(schema, ViewSchemaGenerator):
                schema = schema.bind(admin=self)
            schemas.append(schema)
        return schemas

    def get_action_schemas(self, request: Request, obj: Model | None = None) -> list[BaseSchema]:
        """
        Get the action schemas for the model. Action schemas can be generated from the action schema generators.

        Args:
            request (Request): DRF request.
            obj (Model | None): model instance.

        Returns:
            list[BaseSchema]: list of action schemas.
        """
        schemas = []
        for schema in self.get_action_schema_generators(request, obj):
            if isinstance(schema, ActionSchemaGenerator):
                schema = schema.bind(admin=self)
            schemas.append(schema)
        return schemas

    def get_menu_schema(self, request: Request) -> BaseSchema:
        """
        Get the menu schema for the admin. Menu schema can be generated from the menu schema generator.

        Args:
            request (Request): DRF request.

        Returns:
            BaseSchema: menu schema for the admin.
        """
        menu_schema_generator = self.get_menu_schema_generator(request)
        if isinstance(menu_schema_generator, MenuSchemaGenerator):
            return menu_schema_generator.bind(admin=self)
        return menu_schema_generator

    def get_search_result(self, query: str, limit: int, request: Request):
        """
        Return this admin's contribution to the application-wide fulltext search.

        The base implementation returns ``None`` (not included in results). A pro/enterprise
        package's ``ModelAdmin`` mixin (e.g. ``SearchAdminMixin``) overrides this to opt resources
        into the global search - see ``AdminSite.get_search_result()``, which calls this on every
        registered admin and skips those returning a falsy value.
        """
        return None


class ModelAdmin(Admin):
    """
    Base class for admin classes. It is used to define the fields, filters, and schema generators for a model.

    Args:
        model (Model): Model class that the admin class is for. There can be multiple admin classes for a single model,
                       but the `name` property must be set (or it will be generated from the model name).
                       Name must be unique.
        abstract (bool): If set to True, the admin class will not be registered in the admin site. It can be used to
                         create a base model admin class for more specific admin classes.
        search_fields (list[str]): List of fields that will be used for full-text search. Default is the primary key
                                   field. Paths may traverse relations via ``__`` (e.g. ``author__name``).

                                   Recommended field types (produce useful matches AND aligned highlights):

                                   - ``CharField``, ``TextField`` and their subclasses (``EmailField``, ``SlugField``,
                                     ``URLField``).
                                   - Fields with ``choices``: matched against the human-readable choice labels;
                                     highlight is rendered on the display value.
                                   - ``BooleanField``: matched against the translated ``gettext("Yes")`` /
                                     ``gettext("No")`` labels; highlight is rendered on the localized "Yes"/"No"
                                     string.
                                   - Numeric fields (``IntegerField``, ``DecimalField``, ``FloatField``,
                                     ``MoneyField``): matched via cast-to-text ``__icontains`` (e.g. ``12`` matches
                                     ``121.00``). Highlight offsets refer to the raw string form.

                                   Not recommended:

                                   - ``DateField``, ``DateTimeField``, ``TimeField``: the DB query technically works
                                     (matches the ISO representation, e.g. ``2024-01-15``), but the FE typically
                                     renders dates in the local format (``15.01.2024``). Highlight offsets from the
                                     ISO string won't align with what the user sees. Use ``filter_fields`` with a
                                     range filter for dates instead.
                                   - ``UUIDField``: technically works, but users rarely search UUIDs by substring
                                     and the raw form is opaque.
                                   - ``FileField`` / ``ImageField``: matches against the storage path, which is
                                     usually not what the user expects.
        filter_fields (list[str]): List of fields that will be used for filtering. Default is the primary key field.
                                   You can use LOOKUP_SEP to specify the lookup operator (e.g., id__icontains).
        fields (list[str]): List of fields that will be used for the DRF serializer.
        read_only_fields (list[str]): List of fields that will be read-only in the DRF serializer.
        label (str): Label of the administration resource. Default is the plural verbose name of the model.
        view_schema_generators (list[ViewSchemaGenerator]): List of view schema generators that will be used to generate
                                                            the schema for the views. If you remove one of the default
                                                            view schema generators, the view will not be rendered in the
                                                            administration.
        action_schema_generators (list[ActionSchemaGenerator]): List of action schema generators that will be used to
                                                                generate the schema for the actions. If you remove one
                                                                of the default action schema generators, the action
                                                                will not be rendered in the administration.
        menu_schema_generator (MenuSchemaGenerator): Menu schema generator that will be used to generate the schema for
                                                     the menu.
        base_viewset (AdminModelViewSet): Base viewset class that will be used to create the viewset for the model.
                                          It must be a subclass of AdminModelViewSet.
        base_serializer_class (AdminModelSerializer): Base serializer class that will be used to create the serializer
                                                      for the model. It must be a subclass of AdminModelSerializer.
        can_create (bool | Callable): True allows the create view in the administration; a method
                                      taking the request decides per user (``has_create_permission``).
        can_read (bool | Callable): True allows the read view in the administration; a method taking
                                    the request decides per user (``has_read_permission``).
        can_update (bool | Callable): True allows the update view in the administration; a method
                                      taking the request decides per user (``has_update_permission``).
        can_delete (bool | Callable): True allows the delete view in the administration; a method
                                      taking the request decides per user (``has_delete_permission``).
        name (str): Name of the administration resource. Default is the lower case name of the model. Must be unique.
        auto_advisory_lock_for_update_enabled (bool): If set to True, the advisory lock will be acquired for the update
                                                      action.
        auto_advisory_lock_for_destroy_enabled (bool): If set to True, the advisory lock will be acquired for the
                                                       destroy action.
        default_page_limit (int): Page size of this resource's list endpoint when the request sends no ``limit``.
                                  None (the default) falls back to the project configuration
                                  (``ADMIN_REST_FRAMEWORK["DEFAULT_PAGE_LIMIT"]``, then the Django setting of the
                                  same name, then 20). Zero is a valid value - it answers with the ``meta`` block
                                  and no objects.
        max_page_limit (int): Upper bound for this resource's ``limit`` query parameter; a larger one is rejected
                              with 422. None (the default) falls back to the project configuration
                              (``ADMIN_REST_FRAMEWORK["MAX_PAGE_LIMIT"]``, then the Django setting of the same
                              name, then 1000). To lift the cap altogether, set ``MAX_PAGE_LIMIT = None`` project
                              wide - an admin declares a number or nothing at all.
        default_sorting (SortingOrStr): Ordering this resource's list endpoint answers with when the request sends
                                        no ``order_by``. Django-style (``"placed_at"`` ascending, ``"-placed_at"``
                                        descending) or a ``Sorting`` descriptor. None (the default) leaves the
                                        queryset in the order it already has - the model's ``Meta.ordering``, or
                                        none. A ``ListViewSchemaGenerator`` without its own ``default_sorting``
                                        publishes this one, so the frontend opens the list sorted the same way the
                                        endpoint answers it (HAB-915).
        export_enabled (bool): If set to True, the resource serves ``GET <resource>/export/`` and offers the export
                               action in its list views. Default is False. This is the static counterpart of
                               ``can_read`` and friends; the per-request decision is the ``can_export(request)``
                               method below.
        export_fields (list[str] | None): Columns to export, nested values addressed with the lookup path
                                          (e.g. ``author__name``). Default is None — the resource exports its
                                          serializer fields.
        export_formats (list[str] | None): Document formats the resource offers, the first one being the default of
                                           both the export endpoint and the export action. Default is None — every
                                           format registered in the ``EXPORT_RENDERER_CLASSES`` setting.
        export_action_schema_generator (ExportActionDescriptorGenerator | None): Generator of the export action
                                                                                 appended to the list views. Declare
                                                                                 one to configure the action (label,
                                                                                 icon, format, …). Default is None —
                                                                                 an instance of
                                                                                 ``export_action_schema_generator_class``.
    """

    model = None
    abstract = True
    search_fields = []
    filter_fields = []
    ordering_fields = None
    default_sorting = None
    fields = []
    read_only_fields = []
    label = None
    menu_schema_generator = MenuSchemaGenerator()
    schema_generator_class = AdminSchemaGenerator
    base_viewset = None
    base_serializer_class = None
    permission_classes = None
    icon = None
    color = None
    can_create = False
    can_read = True
    can_update = False
    can_delete = False

    auto_advisory_lock_for_update_enabled = True
    auto_advisory_lock_for_destroy_enabled = True

    #: Pagination limits of this resource's list endpoint (HAB-946). None means "not declared
    #: here", which hands the decision to the project configuration and then to the library
    #: default - see ``habarico.pagination.AdminModelPagination``.
    default_page_limit: int | None = None
    max_page_limit: int | None = None

    #: Export of the list data (HAB-405). Off unless the resource opts in - there is no
    #: installation-wide switch, so a resource exports only where its admin asks for it.
    export_enabled = False
    export_fields: list[str] | None = None
    export_formats: list[str] | None = None
    export_action_schema_generator: ExportActionDescriptorGenerator | None = None

    #: Validator run once per admin class, when the class is registered (see
    #: ``AdminSite.register``). Point it at an ``AdminConfigurationValidator`` subclass to add or
    #: relax checks, or set it to ``None`` to skip configuration validation for this admin.
    configuration_validator_class: type[AdminConfigurationValidator] | None = AdminConfigurationValidator

    @cached_property
    def viewset(self) -> AdminModelViewSet:
        """
        The DRF viewset built from this admin, cached per instance.

        Built lazily so that instantiating an admin stays cheap — a fresh instance is created for
        every request (``AdminSite.get_admin`` / ``get_schema``) — and so that
        ``validate_configuration()`` gets to report a misconfigured ``model`` / ``base_viewset``
        before the viewset factory trips over it with an opaque error.
        """
        return self.get_viewset()

    def validate_configuration(self) -> None:
        """
        Validate the admin declaration against the model.

        Called once per admin class by ``AdminSite.register()`` — at app startup, not on every
        instantiation — so misconfiguration (typos, removed model fields, dropped relation paths,
        wrong subclasses) raises ``ImproperlyConfigured`` with a clear message before the resource
        is wired up, instead of surfacing lazily as an opaque request-time traceback.

        The checks themselves live in ``configuration_validator_class``
        (:class:`~habarico.validation.AdminConfigurationValidator`); override this method to add
        admin-specific checks on top. A pro/enterprise package adds its own checks by pointing
        ``configuration_validator_class`` at a validator subclass, not by hooking in here.
        """
        if self.configuration_validator_class is not None:
            self.configuration_validator_class(self).validate()

    def _resolve_permission(self, flag: str, request: Request | None) -> bool:
        """
        Resolve one ``can_*`` declaration into an answer for ``request``.

        A declaration may be a bool for a fixed answer, or a method taking the request for
        per-user rules, and a caller cannot tell which - this is their always-callable form
        (HAB-948). Before it, the declaration was read as a plain truthy value, so a method,
        being always truthy, silently granted the action and was never called.

        Internal: the four ``has_*_permission`` methods are how a caller asks, and
        ``AdminPermission`` asks through them. A subclass declaring a ``can_*`` of its own - the
        paid layer's ``can_read_aggregations``, say - resolves it by calling this from its own
        ``has_*_permission``, so a permission rule is not written twice across packages.

        Args:
            flag (str): name of the declaration, e.g. ``"can_read"``.
            request (Request | None): the request being served, or None where there is none - the
                registration-time checks and the schema generators. A per-request rule cannot be
                evaluated without one, so it counts as "may be allowed" there rather than being
                called with nothing: the action stays declared, and ``AdminPermission`` settles it
                on every actual request. A literal False is knowable either way and drops the
                action outright.

        Returns:
            bool: whether the action the declaration guards is allowed.
        """
        value = getattr(self, flag)
        if callable(value):
            return True if request is None else bool(value(request))
        return bool(value)

    def has_read_permission(self, request: Request | None) -> bool:
        """Whether ``request``'s user may list and retrieve this resource (``can_read``)."""
        return self._resolve_permission("can_read", request)

    def has_create_permission(self, request: Request | None) -> bool:
        """Whether ``request``'s user may create in this resource (``can_create``)."""
        return self._resolve_permission("can_create", request)

    def has_update_permission(self, request: Request | None) -> bool:
        """Whether ``request``'s user may update this resource (``can_update``)."""
        return self._resolve_permission("can_update", request)

    def has_delete_permission(self, request: Request | None) -> bool:
        """Whether ``request``'s user may delete from this resource (``can_delete``)."""
        return self._resolve_permission("can_delete", request)

    @property
    def name(self) -> str:
        return get_model_name(self.model)

    @property
    def view_schema_generators(self) -> list[ViewSchemaGenerator]:
        generators = []
        if self.can_create:
            generators.append(CreateViewSchemaGenerator())
        if self.can_read:
            generators.append(ShowViewSchemaGenerator())
            generators.append(ListViewSchemaGenerator())
        if self.can_update:
            generators.append(EditViewSchemaGenerator())
        return generators

    @property
    def action_schema_generators(self) -> list[ActionSchemaGenerator]:
        generators = []
        if self.can_create:
            generators.append(CreateActionSchemaGenerator())
        if self.can_read:
            generators.append(ShowActionSchemaGenerator())
        if self.can_update:
            generators.append(EditActionSchemaGenerator())
        if self.can_delete:
            generators.append(DeleteActionSchemaGenerator())
        return generators

    def get_advisory_lock_name(self, action: str) -> str:
        if action in {"update", "destroy"}:
            return f"admin_{self.name}_update_or_destroy"
        else:
            raise NotImplementedError

    def get_label(self) -> str:
        """
        Get the label of the administration resource.

        Returns:
            str: label of the administration resource.
        """
        return cap_first(self.model._meta.verbose_name_plural) if self.label is None else self.label

    def get_search_fields(self) -> list[str]:
        """
        Get the search fields for the model.

        Returns:
            list[str]: list of search fields.
        """
        return list(self.search_fields) if self.search_fields else [self.model._meta.pk.name]

    def get_filter_fields(self) -> Filters:
        """
        Get the filter fields for the model.

        Returns:
            Filters: list of filter fields.
        """
        filter_fields = list(self.filter_fields)
        if self.search_fields and "search" not in filter_fields:
            filter_fields.append("search")
        return filter_fields

    def get_fields(self, action=None, request=None) -> Fields:
        """
        Get the fields for the model. You can return different fields for different REST actions
        or for different requests (for example user in request).

        Args:
            action (str): DRF action.
            request (Request): DRF request.

        Returns:
            Fields: list of fields.
        """
        return list(self.fields)

    def get_ordering_fields(self) -> list[str | tuple[str, str] | tuple[str, str, str]] | None:
        """
        Get the ordering fields for the model.

        Returns:
            list[str | tuple[str, str] | tuple[str, str, str]] | None: list of ordering fields.
        """
        return list(self.ordering_fields) if self.ordering_fields else self.ordering_fields

    def get_default_sorting(self, request: Request = None) -> SortingOrStr | None:
        """
        Get the ordering the list endpoint falls back to when the request sends no ``order_by``.

        Override to decide it per request - a different default for an internal client, say. The
        list view schema publishes whatever this returns, so the frontend and the endpoint stay in
        step. It is also called without a request when the admin is registered, to check that the
        field it names exists.

        Args:
            request (Request, optional): request being served, or None outside one.

        Returns:
            SortingOrStr | None: Django-style ordering string or a ``Sorting`` descriptor, or None
                to leave the queryset ordering untouched.
        """
        return self.default_sorting

    def get_read_only_fields(self, action=None, request=None) -> list[str]:
        """
        Get the read-only fields for the model. You can return different read-only fields for different REST actions
        or for different requests (for example user in request).

        Args:
            action (str): DRF action.
            request (Request): DRF request.

        Returns:
            list[str]: list of read-only fields.
        """
        return list(self.read_only_fields)

    def get_base_viewset(self) -> type[AdminModelViewSet] | None:
        """
        Get the base viewset class the resource viewset is built from.

        An exporting resource gets the export viewset mixed into the one it already uses, so the
        endpoint is added without dropping the viewset of the application. A resource that does
        not export (see ``export_enabled``) has no export endpoint at all.

        Override to derive the base viewset instead of declaring it.

        Returns:
            type[AdminModelViewSet] | None: base viewset class, or None to use the default one.
        """
        base_viewset = self.base_viewset
        if not self.export_enabled:
            return base_viewset

        # Without a declared base viewset the export is composed onto the configured default -
        # returning the export viewset alone would drop whatever DEFAULT_VIEWSET_CLASS points at
        # (an extension contributes its own viewset through that setting).
        return compose_export_viewset(
            admin_api_settings.EXPORT_VIEWSET_CLASS,
            base_viewset or admin_api_settings.DEFAULT_VIEWSET_CLASS,
        )

    def can_export(self, request: Request | None) -> bool:
        """
        Whether the request may export the resource.

        Consulted by both ends of the export: a refused request gets no export action in the
        schema and HTTP 404 from the export endpoint. Defaults to whether the resource exports at
        all; override it to restrict the export per user:

        ```python
        def can_export(self, request):
            return super().can_export(request) and request is not None and request.user.is_staff
        ```

        It runs for every schema that renders a list view - the resource schema as well as the
        per-record schema of every row of a list response - so keep it cheap: decide from the
        request in memory, and cache anything that needs the database on the request.

        Args:
            request (Request | None): Current request, or None outside the request cycle.

        Returns:
            bool: True when the resource may be exported.
        """
        return self.export_enabled

    def get_export_action_schema_generator(self) -> ExportActionDescriptorGenerator:
        """
        Get the generator building the export action of the list views.

        Returns:
            ExportActionDescriptorGenerator: The declared generator, or the shared instance of the
            class configured in the ``EXPORT_ACTION_SCHEMA_GENERATOR_CLASS`` setting.
        """
        generator = self.export_action_schema_generator
        if generator is not None:
            return generator
        # Shared instance: the generator is bound (copied) per use, so one instance serves every
        # request and every per-record schema instead of being rebuilt for each of them.
        return admin_api_settings.get_instance("EXPORT_ACTION_SCHEMA_GENERATOR_CLASS")

    def get_export_action(self, request: Request) -> ExportActionDescriptor | None:
        """
        Build the export action of the resource.

        Args:
            request (Request): DRF request.

        Returns:
            ExportActionDescriptor | None: Descriptor of the export action, or None when the
            request may not export the resource (``can_export``).
        """
        if not can_export(self, request):
            return None
        return self.get_export_action_schema_generator().bind(admin=self, request=request).get_schema()

    def get_view_schemas(self, request: Request, obj: Model | None = None) -> list[BaseSchema]:
        """
        Get the view schemas of the resource, with the export action in the list views.

        Args:
            request (Request): DRF request.
            obj (Model | None): model instance.

        Returns:
            list[BaseSchema]: Schemas of the admin, the list view ones carrying the export action
            when the resource exports.
        """
        schemas = super().get_view_schemas(request, obj)
        # get_view_schemas() binds (copies) every ViewSchemaGenerator, so a list view generator
        # here is a per-request copy - the declared instance, shared across requests, stays what
        # it is.
        list_generators = [generator for generator in schemas if isinstance(generator, ListViewSchemaGenerator)]
        if not list_generators:
            # Nothing renders the action - and this runs for every per-record schema too, so
            # can_export() is not consulted needlessly.
            return schemas

        export_action = self.get_export_action(request)
        if export_action is not None:
            for generator in list_generators:
                add_export_list_action(generator, export_action)
        return schemas

    def get_viewset(self) -> AdminModelViewSet:
        """
        Get the viewset for the model.

        Returns:
            AdminModelViewSet: viewset for the model.
        """
        from habarico.views import model_viewset_factory

        return model_viewset_factory(
            self.model,
            self,
            self.get_base_viewset(),
            self.base_serializer_class,
        )

    def get_obj_repr(self, obj: Model) -> str:
        """
        Get the representation string of the model instance. It is used in the administration for the object title.
        Default is the string representation of the model instance (result of __str__ method).

        Args:
            obj (Model): model instance.

        Returns:
            str: string representation of the model instance.
        """
        return str(obj)

    def get_router(self) -> BaseRouter:
        from .routers import AdminRouter

        router = AdminRouter()
        router.register(self.name, self.viewset, basename=self.name)
        return router
