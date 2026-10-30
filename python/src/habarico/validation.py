"""
Fail-fast validation of an admin declaration against its model (HAB-553).

``AdminSite.register()`` calls ``Admin.validate_configuration()`` once per admin class, when the
class is registered (at app startup). For ``ModelAdmin`` that hook runs
:class:`AdminConfigurationValidator`, which holds every check and the helpers it needs — the admin
class itself only declares configuration, it does not validate it.
"""

from __future__ import annotations

import difflib
from typing import TYPE_CHECKING, Iterator

from django.core.exceptions import ImproperlyConfigured
from django.db.models import Model
from habarico.schema import (
    CURRENT,
    ActionSchemaGenerator,
    AdminSchemaGenerator,
    Field,
    MenuSchemaGenerator,
    ViewSchemaGenerator,
)
from habarico.schema.actions import generate_action_descriptor, generate_actions_descriptor, get_action_name
from habarico.schema.boxes import ArrayBox, BaseBox, GalleryBox, ListBox, ObjectBox, generate_boxes_descriptor
from habarico.schema.fields import FieldDescriptor, generate_filters_descriptor
from habarico.schema.reference import ContextResourceReference
from habarico.utils import LOOKUP_SEP, walk_to_leaf_field

if TYPE_CHECKING:
    from django.db.models import Field as DjangoField
    from habarico.admin import ModelAdmin
    from habarico.schema.actions import ActionDescriptor


def model_field_names(model: type[Model]) -> list[str]:
    """Return every field name declared on ``model`` — the "did you mean" candidate pool."""
    return [f.name for f in model._meta.get_fields()]


def suggest_close_match(name: str, candidates: list[str]) -> str | None:
    """Return the closest match for ``name`` among ``candidates``, or ``None`` if none is close enough."""
    matches = difflib.get_close_matches(name, candidates, n=1)
    return matches[0] if matches else None


def configuration_error(
    admin_class: type,
    attribute: str,
    value: object,
    reason: str,
    candidates: list[str] | None = None,
) -> ImproperlyConfigured:
    """
    Build a consistent ``ImproperlyConfigured`` naming the admin class, the offending attribute
    and value, the reason, and (when resolvable) a "did you mean" suggestion.
    """
    message = f"{admin_class.__name__}.{attribute} = {value!r}: {reason}."
    if candidates:
        suggestion = suggest_close_match(str(value), candidates)
        if suggestion:
            message += f" Did you mean {suggestion!r}?"
    return ImproperlyConfigured(message)


def resolve_field_path(model: type[Model], name: str, *, allow_lookup: bool = False) -> DjangoField | None:
    """
    Resolve a (possibly relation-traversing, ``__``-separated) field path against ``model``.

    Args:
        model: Model to resolve the path against.
        name: Field path, e.g. ``"title"`` or ``"category__name"``.
        allow_lookup: When True and the full path doesn't resolve to a field, retry after
            stripping a trailing ``__<lookup>`` segment (e.g. ``"title__icontains"``) and confirm
            the stripped segment is a lookup registered on the resolved field. This mirrors how
            ``search_fields`` / ``filter_fields`` are actually consumed (django-filter / the
            search backend apply lookups on top of a real field).

    Returns:
        The resolved Django field, or ``None`` when the path cannot be resolved.
    """
    field = walk_to_leaf_field(model, name)
    if field is not None:
        return field

    if not allow_lookup or LOOKUP_SEP not in name:
        return None

    base_path, lookup = name.rsplit(LOOKUP_SEP, 1)
    field = walk_to_leaf_field(model, base_path)
    if field is not None and field.get_lookup(lookup) is not None:
        return field
    return None


def resolve_field_name(
    model: type[Model],
    name: str,
    *,
    allow_lookup: bool = False,
    serializer_class: type | None = None,
    extra_names: set[str] | None = None,
) -> bool:
    """
    Check whether ``name`` resolves to a real field, either on ``model`` or — as a fallback, to
    tolerate computed/nested fields (``SerializerMethodField``, a nested serializer declared with
    a different ``source=``, e.g. ``VersionSerializer.revision_data``) — among the fields declared
    directly on ``serializer_class``, or among ``extra_names`` (e.g. custom filters declared
    directly on a ``filterset_class``, such as ``VersionFilterSet.reference``).

    A declared serializer field is opaque from the model's point of view: its ``source=`` may
    point anywhere, and it may expose an entirely different nested serializer's own fields under
    dotted sub-paths (e.g. ``revision_data__date_created``). Once the *first* path segment
    matches a declared field, the rest isn't re-validated against ``model`` — that structure is
    the serializer's concern, not the admin's.
    """
    if resolve_field_path(model, name, allow_lookup=allow_lookup) is not None:
        return True
    if serializer_class is not None:
        declared_fields = getattr(serializer_class, "_declared_fields", {})
        if name in declared_fields or name.split(LOOKUP_SEP, 1)[0] in declared_fields:
            return True
    if extra_names and name in extra_names:
        return True
    return False


def iter_model_field_descriptors(
    boxes: list | None, model: type[Model]
) -> Iterator[tuple[type[Model], FieldDescriptor]]:
    """
    Recursively walk a raw, unprocessed list of boxes/fields, yielding ``(model, FieldDescriptor)``
    pairs — the model each descriptor's name should be resolved against.

    ``ObjectBox`` / ``ArrayBox`` usually nest a *different* model's fields, reached via their
    ``target`` — a relation field name on the current ``model``. When ``target`` resolves to a
    relation, descending into the box switches the yielded model to the related model. ``target``
    isn't always a plain model relation though — it may instead be a serializer field declared
    with a remapping ``source=`` (e.g. ``VersionSerializer.revision_data``, sourced from
    ``revision`` but exposed through its own nested serializer). Resolving that would require
    introspecting the serializer's nested field tree, which is out of scope here — when ``target``
    doesn't resolve to a model relation, the subtree is skipped rather than raised on or
    mis-validated against the wrong model. ``ListBox`` / ``GalleryBox`` reference an entirely
    different admin resource (via ``reference``); resolving that model isn't attempted here (out
    of scope — see HAB-553 plan), so their contents are skipped the same way.
    """
    for item in generate_boxes_descriptor(boxes):
        if isinstance(item, (ListBox, GalleryBox)):
            continue
        if isinstance(item, (ObjectBox, ArrayBox)):
            target = (item._get_object_kwargs() if isinstance(item, ObjectBox) else item._get_array_kwargs())["target"]
            nested_field = walk_to_leaf_field(model, target)
            nested_model = getattr(nested_field, "related_model", None)
            if nested_model is not None:
                yield from iter_model_field_descriptors(item._boxes, nested_model)
            continue
        if isinstance(item, BaseBox):
            yield from iter_model_field_descriptors(item._boxes, model)
        elif isinstance(item, FieldDescriptor):
            if item._wrapper is not None:
                # A wrapper's name is presentational only — it never backs a model/serializer
                # field, so only its sub-fields are validated.
                for sub in item._wrapper._fields:
                    yield model, sub
            else:
                yield model, item


def iter_filter_names(filters) -> Iterator[str]:
    """Yield each filter name from a raw ``Filters`` value (``Filter`` descriptors or plain strings)."""
    for filter_ in generate_filters_descriptor(filters) or []:
        yield filter_.get_name()


def ordering_lookup_name(entry) -> str:
    """
    The ORM path one ``ordering_fields`` entry orders by, which is not always the name a client
    sends.

    ``get_ordering_triple`` in ``eluvia_base_django`` reads a bare string and a ``(name, label)``
    pair as key and lookup at once, but a ``(key, lookup, label)`` triple as two different things -
    ``author_name`` for the client, ``author__name`` for the query. Only the second one has to
    resolve against the model.
    """
    if isinstance(entry, tuple) and len(entry) >= 3:
        return entry[1]
    return entry[0] if isinstance(entry, tuple) else entry


def iter_action_descriptors(actions) -> Iterator[ActionDescriptor]:
    """Yield each entry of a raw ``Actions`` value as a descriptor (plain strings normalized)."""
    yield from generate_actions_descriptor(actions) or []


class AdminConfigurationValidator:
    """
    Validate a ``ModelAdmin`` declaration against its model.

    Runs a battery of fail-fast checks — class-type checks, numeric constraints, field/filter/
    sorting name resolution, box/field descriptor resolution, and action-vs-permission
    consistency — so misconfiguration (typos, removed model fields, dropped relation paths, wrong
    subclasses) is reported at registration time with a clear ``ImproperlyConfigured`` message
    instead of surfacing lazily as an opaque request-time traceback.

    Subclass to add checks or to opt out of a slice, and point
    ``ModelAdmin.configuration_validator_class`` at the subclass (``None`` disables validation for
    that admin).
    """

    #: Built-in CRUD action names checked by ``validate_actions()`` against the matching
    #: ``can_*`` flag. Free-form/custom action names (e.g. resource actions registered directly
    #: on a viewset) aren't enumerable from the admin alone and are left unvalidated.
    BUILTIN_CRUD_ACTIONS = {
        "create": "can_create",
        "show": "can_read",
        "edit": "can_update",
        "delete": "can_delete",
    }

    def __init__(self, admin: ModelAdmin):
        """
        Args:
            admin: Admin instance to validate. Only read from — the validator holds no state
                beyond the instance and is discarded once ``validate()`` returns.
        """
        self.admin = admin
        self.admin_class = type(admin)
        self.model = admin.model

    def validate(self) -> None:
        """Run every check. Raises ``ImproperlyConfigured`` on the first problem found."""
        self.validate_classes()
        self.validate_constraints()
        self.validate_field_lists()
        self.validate_export_formats()
        self.validate_descriptors()
        self.validate_actions()

    def error(
        self, attribute: str, value: object, reason: str, candidates: list[str] | None = None
    ) -> ImproperlyConfigured:
        """Build an ``ImproperlyConfigured`` naming the validated admin class."""
        return configuration_error(self.admin_class, attribute, value, reason, candidates)

    def unresolved_field_error(self, attribute: str, name: str, model: type[Model]) -> ImproperlyConfigured:
        """Build the "does not resolve to a field on <model>" error, with a "did you mean" hint."""
        return self.error(attribute, name, f"does not resolve to a field on {model.__name__}", model_field_names(model))

    def validate_classes(self) -> None:
        """Validate that class-type attributes point at their expected base classes."""
        from django_filters import FilterSet
        from habarico.serializers import AdminModelSerializer
        from habarico.views import AdminModelViewSet

        admin = self.admin

        if not (isinstance(self.model, type) and issubclass(self.model, Model)):
            raise self.error("model", self.model, "must be a Django Model subclass")

        if admin.base_viewset is not None and not (
            isinstance(admin.base_viewset, type) and issubclass(admin.base_viewset, AdminModelViewSet)
        ):
            raise self.error("base_viewset", admin.base_viewset, f"must be a subclass of {AdminModelViewSet.__name__}")

        if admin.base_serializer_class is not None and not (
            isinstance(admin.base_serializer_class, type)
            and issubclass(admin.base_serializer_class, AdminModelSerializer)
        ):
            raise self.error(
                "base_serializer_class",
                admin.base_serializer_class,
                f"must be a subclass of {AdminModelSerializer.__name__}",
            )

        if admin.menu_schema_generator is not None and not isinstance(admin.menu_schema_generator, MenuSchemaGenerator):
            raise self.error(
                "menu_schema_generator",
                admin.menu_schema_generator,
                f"must be an instance of {MenuSchemaGenerator.__name__} (or None to hide from the menu)",
            )

        if not (
            isinstance(admin.schema_generator_class, type)
            and issubclass(admin.schema_generator_class, AdminSchemaGenerator)
        ):
            raise self.error(
                "schema_generator_class",
                admin.schema_generator_class,
                f"must be a subclass of {AdminSchemaGenerator.__name__}",
            )

        for generator in admin.view_schema_generators:
            if not isinstance(generator, ViewSchemaGenerator):
                raise self.error(
                    "view_schema_generators",
                    generator,
                    f"every entry must be an instance of {ViewSchemaGenerator.__name__}",
                )

        for generator in admin.action_schema_generators:
            if not isinstance(generator, ActionSchemaGenerator):
                raise self.error(
                    "action_schema_generators",
                    generator,
                    f"every entry must be an instance of {ActionSchemaGenerator.__name__}",
                )

        filterset_class = getattr(admin.base_viewset, "filterset_class", None)
        if filterset_class is not None:
            if not (isinstance(filterset_class, type) and issubclass(filterset_class, FilterSet)):
                raise self.error(
                    "base_viewset.filterset_class",
                    filterset_class,
                    f"must be a subclass of {FilterSet.__name__}",
                )
            filterset_model = getattr(getattr(filterset_class, "Meta", None), "model", None)
            if filterset_model is not None and filterset_model is not self.model:
                raise self.error(
                    "base_viewset.filterset_class",
                    filterset_class,
                    f"Meta.model ({filterset_model.__name__}) does not match {self.model.__name__}",
                )

    def validate_constraints(self) -> None:
        """
        Validate numeric/value constraints on the admin declaration.

        Core checks the pagination limits (HAB-946); a pro/enterprise validator subclass
        overrides this method (calling ``super()``) to check the attributes its own
        ``ModelAdmin`` mixins contribute, e.g. ``aggregate_max_buckets``.
        """
        admin = self.admin

        default_page_limit = admin.default_page_limit
        if default_page_limit is not None and (not isinstance(default_page_limit, int) or default_page_limit < 0):
            # Zero is deliberate, not a mistake: it asks for the meta block without any objects.
            raise self.error("default_page_limit", default_page_limit, "must be a non-negative integer")

        max_page_limit = admin.max_page_limit
        if max_page_limit is not None and (not isinstance(max_page_limit, int) or max_page_limit <= 0):
            # None is how an admin says "not declared here"; a cap of zero would make every
            # request invalid, so it is a typo rather than an intent.
            raise self.error("max_page_limit", max_page_limit, "must be a positive integer")

        if default_page_limit is not None and max_page_limit is not None and default_page_limit > max_page_limit:
            raise self.error(
                "default_page_limit", default_page_limit, f"must not exceed max_page_limit ({max_page_limit})"
            )

    def get_declared_filter_names(self) -> set[str]:
        """
        Names of filters declared directly on ``base_viewset.filterset_class`` (e.g.
        ``VersionFilterSet.reference``) — these have no backing model field at all, so
        ``filter_fields``/``filters`` entries referencing them are legitimate.
        """
        filterset_class = getattr(self.admin.base_viewset, "filterset_class", None)
        return set(getattr(filterset_class, "declared_filters", {}))

    def get_declared_ordering_names(self) -> set[str]:
        """
        Names that are orderable without being a field of the model: annotations on the viewset's
        queryset, and whatever ``extra_ordering_fields`` declares on it.

        ``OrderingFilter`` accepts both - its default field list takes a serializer field whose
        source is a ``queryset_annotation_key``, and ``get_valid_fields`` appends
        ``extra_ordering_fields`` outright - so a validator refusing them would refuse a
        configuration that works (HAB-915). An annotation added in a custom ``get_queryset()``
        cannot be seen from here; an admin ordering by one points
        ``configuration_validator_class`` at a subclass, as the class docstring describes.
        """
        viewset = self.admin.base_viewset
        queryset = getattr(viewset, "queryset", None)

        names = set(queryset.query.annotations) if queryset is not None else set()

        # Read off the class, so anything computed per request - `AdminModelViewSet` declares
        # `extra_ordering_fields` as a property - comes back as its descriptor rather than a list.
        # What habarico puts there is the primary key and the default sorting, both checked
        # elsewhere; only a plain declaration is of interest here.
        declared = getattr(viewset, "extra_ordering_fields", None)
        if isinstance(declared, (list, tuple, set)):
            names |= {ordering_lookup_name(entry) for entry in declared}

        return names

    def validate_field_lists(self) -> None:
        """
        Validate field-name lists (``search_fields``, ``filter_fields``, ``ordering_fields``,
        ``fields``, ``read_only_fields``, ``export_fields``) resolve against the model, tolerating
        ``__`` relation paths (and, for ``search_fields``/``filter_fields``, a trailing lookup
        expression).
        """
        admin = self.admin
        serializer_class = admin.base_serializer_class

        for name in admin.get_search_fields():
            if name == "search":
                continue
            if not resolve_field_name(self.model, name, allow_lookup=True, serializer_class=serializer_class):
                raise self.unresolved_field_error("search_fields", name, self.model)

        declared_filter_names = self.get_declared_filter_names()
        for name in admin.filter_fields:
            if name == "search":
                continue
            if not resolve_field_name(
                self.model,
                name,
                allow_lookup=True,
                serializer_class=serializer_class,
                extra_names=declared_filter_names,
            ):
                raise self.unresolved_field_error("filter_fields", name, self.model)

        # `default_sorting` is deliberately not checked, here or on the view generators: an
        # ordering may name an annotation, and where that annotation comes from is not knowable at
        # registration time. It may sit on the viewset's queryset, be added in a custom
        # `get_queryset()`, or be attached by the ordering filter itself - `OrderingFilter`
        # annotates `<field>__choice_label` inside `_order_queryset`, and any lookup class may do
        # the same from `BaseOrderingLookup.update_queryset`. A check that cannot see those would
        # refuse working configurations; a typo surfaces on the first list request instead, as a
        # Django `FieldError` naming the keyword (HAB-915).
        for entry in admin.get_ordering_fields() or []:
            name = ordering_lookup_name(entry)
            if not resolve_field_name(
                self.model, name, serializer_class=serializer_class, extra_names=self.get_declared_ordering_names()
            ):
                raise self.unresolved_field_error("ordering_fields", name, self.model)

        for entry in admin.fields:
            name = entry.get_name() if isinstance(entry, Field) else entry
            if not resolve_field_name(self.model, name, serializer_class=serializer_class):
                raise self.unresolved_field_error("fields", name, self.model)

        for name in admin.read_only_fields:
            if not resolve_field_name(self.model, name, serializer_class=serializer_class):
                raise self.unresolved_field_error("read_only_fields", name, self.model)

        for name in admin.export_fields or []:
            if not resolve_field_name(self.model, name, serializer_class=serializer_class):
                raise self.unresolved_field_error("export_fields", name, self.model)

    def validate_export_formats(self) -> None:
        """
        Validate that every format in ``export_formats`` has a renderer registered in
        ``ADMIN_REST_FRAMEWORK["EXPORT_RENDERER_CLASSES"]`` — otherwise the export endpoint would
        raise ``ImproperlyConfigured`` on every request instead of once, at registration.
        """
        from habarico.export.config import get_registered_renderer_classes

        formats = self.admin.export_formats
        if not formats:
            return

        registered = [renderer_class.format for renderer_class in get_registered_renderer_classes()]
        for export_format in formats:
            if export_format not in registered:
                raise self.error(
                    "export_formats",
                    export_format,
                    "has no renderer registered in ADMIN_REST_FRAMEWORK['EXPORT_RENDERER_CLASSES'] "
                    f"(registered: {', '.join(registered) or '-'})",
                    registered,
                )

    def get_declared_boxes(self, generator: ViewSchemaGenerator) -> list:
        """
        Return the boxes declared on a view schema generator, always as a list.

        The two generator families declare their content differently: ``ListViewSchemaGenerator``
        holds a list in ``boxes``, while the detail generators (create/show/edit) hold a single
        root box in ``box`` — a ``boxes=`` constructor argument is wrapped into one ``Box``. Only
        one of the two attributes is declared per class, so whichever one is set also says which
        family the generator belongs to.

        Their public ``get_boxes()`` / ``get_box()`` accessors can't be used here: both fall back
        to ``self.context.serializer`` when nothing is declared, and there is no context outside a
        request. A generator that declares neither therefore yields an empty list — its content is
        derived from the serializer at render time and there is nothing to validate statically.
        """
        boxes = getattr(generator, "boxes", None)
        if boxes is not None:
            return list(boxes)

        box = getattr(generator, "box", None)
        return [box] if box is not None else []

    def validate_descriptors(self) -> None:
        """
        Validate field/filter/sorting descriptors nested in the view schema generators resolve
        against the model — recursively, through ``TabBox``/``WizardBox``/``GridBox``/``ObjectBox``/
        ``ArrayBox`` containers (switching to the nested model for ``ObjectBox``/``ArrayBox``).
        ``ListBox``/``GalleryBox`` contents reference a different admin resource and are skipped.
        """
        declared_filter_names = self.get_declared_filter_names()

        for generator in self.admin.view_schema_generators:
            for model, descriptor in iter_model_field_descriptors(self.get_declared_boxes(generator), self.model):
                if not descriptor.is_serializer_field:
                    continue
                name = descriptor.get_name()
                serializer_class = self.admin.base_serializer_class if model is self.model else None
                if not resolve_field_name(model, name, serializer_class=serializer_class):
                    raise self.unresolved_field_error("fields", name, model)

            for name in iter_filter_names(getattr(generator, "filters", None)):
                if name == "search":
                    continue
                if not resolve_field_name(
                    self.model,
                    name,
                    allow_lookup=True,
                    serializer_class=self.admin.base_serializer_class,
                    extra_names=declared_filter_names,
                ):
                    raise self.unresolved_field_error("filters", name, self.model)

    def validate_actions(self) -> None:
        """
        Validate that built-in CRUD action names (``create``/``show``/``edit``/``delete``)
        referenced in the view schema generators are consistent with the corresponding
        ``can_*`` flag. Free-form/custom action names aren't validated (see
        ``BUILTIN_CRUD_ACTIONS``).
        """
        for generator in self.admin.view_schema_generators:
            for attr in ("row_actions", "toolbar_actions", "bottom_actions", "list_actions"):
                for descriptor in iter_action_descriptors(getattr(generator, attr, None)):
                    self.validate_builtin_action(get_action_name(descriptor), descriptor)

            for attr in ("double_click_action", "single_click_action"):
                descriptor = generate_action_descriptor(getattr(generator, attr, None))
                if descriptor is not None:
                    self.validate_builtin_action(get_action_name(descriptor), descriptor)

    def validate_builtin_action(self, name: str | None, descriptor: ActionDescriptor | None = None) -> None:
        """Check one built-in CRUD action name against the ``can_*`` flag that must enable it.

        A flag declared as a method (HAB-948) cannot be evaluated here - registration happens at
        startup, long before any request - and is truthy, so it passes: the action stays declared
        and ``AdminPermission`` settles it per request. Only a literal ``False``, which is knowable
        now, is refused.

        A descriptor carrying a ``reference`` names an action of another resource, so the flag is
        read off that admin rather than this one.
        """
        required_flag = self.BUILTIN_CRUD_ACTIONS.get(name)
        if required_flag is None:
            return

        target, target_name = self.resolve_action_permission_target(descriptor)
        if target is None:
            return
        if not getattr(target, required_flag):
            where = f" on {target_name}" if target_name else ""
            raise self.error("action", name, f"requires {required_flag}=True{where}")

    def resolve_action_permission_target(self, descriptor) -> tuple["ModelAdmin | None", str | None]:
        """
        The admin whose ``can_*`` flag governs a descriptor, and its name when it is not this one.

        Returns ``(None, None)`` when the target cannot be resolved here, which is not a failure:
        a reference may point into another service, whose admins this registry never sees, and a
        bare name may belong to an admin that registers after this one. Either way the flag is
        unknowable at registration time and ``AdminPermission`` settles it per request.
        """
        from habarico.site import site

        reference = getattr(descriptor, "_reference", None)
        if reference is None:
            return self.admin, None

        # `CURRENT` is the schema being generated, which for a descriptor declared here is this
        # admin. Any other sentinel stands for an address this registry cannot see from the
        # descriptor alone - `LIST` is the box it sits in - so the flag is left to `AdminPermission`.
        if isinstance(reference, ContextResourceReference):
            return (self.admin, None) if reference is CURRENT else (None, None)

        resource = reference.qualified_name
        if site.exists_admin(resource):
            return site.get_admin(resource), resource
        return None, None
