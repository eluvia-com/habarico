from __future__ import annotations

from copy import copy
from typing import TYPE_CHECKING, Any
from urllib.parse import urljoin

from django.core.validators import RegexValidator, URLValidator
from django.db.models import Model
from django.forms.models import ModelChoiceIteratorValue
from django.urls import NoReverseMatch
from django.utils.translation import gettext_lazy as _
from django_filters.filters import (
    BooleanFilter,
    ChoiceFilter,
    DateFilter,
    DateTimeFilter,
)
from django_filters.filters import Filter as DjangoFilter
from django_filters.filters import (
    ModelChoiceFilter,
    ModelMultipleChoiceFilter,
    MultipleChoiceFilter,
    NumberFilter,
    TimeFilter,
)
from drf_extra_fields.fields import RangeField
from eluvia_base_django.rest_framework.filters.ordering import BaseOrderingFilter
from eluvia_base_django.rest_framework.serializers import Base64FileSerializer, Base64ImageFileSerializer
from habarico.config import MENU_GENERATOR_DEFAULT_PRIORITY, NAMESPACE
from habarico.filters.filters import AdminRelatedFilterMixin, RangeFilter
from habarico.serializers.fields import AdminRelatedFieldMixin
from habarico.settings import admin_api_settings
from habarico.utils import (
    CLONE_REQUEST_QUERY_PARAMS,
    DEFAULT_PK,
    build_validator_rule,
    cap_first,
    check_view_permissions,
    clone_view,
    get_and_bind_drf_field,
    get_reference_from_model,
    merge_validator_rules,
    reverse_action,
)
from rest_framework.fields import empty
from rest_framework.request import Request
from rest_framework.serializers import (
    BooleanField,
    ChoiceField,
    DateField,
    DateTimeField,
    DecimalField,
    EmailField,
    Field,
    FloatField,
    IntegerField,
    ListField,
    ListSerializer,
    ManyRelatedField,
    MultipleChoiceField,
    PrimaryKeyRelatedField,
    Serializer,
    TimeField,
    URLField,
    UUIDField,
)

from .actions import (
    ActionDescriptor,
    Actions,
    DefaultActions,
    GlobalResourceActionSchema,
    ResourceActionSchema,
    SaveActionDescriptor,
    generate_action_descriptor,
)
from .base import BaseSchema
from .boxes import BaseBox, Box, Boxes, ReadonlyBoxWrapper
from .fields import (
    EnumType,
    FieldDescriptor,
    FieldSchema,
    FilterDescriptor,
    Filters,
    FilterSchema,
    SortingOrStr,
)
from .menu import ActionViewChoice, MenuGroup, MenuSchema
from .reference import build_endpoint_reference, build_resource_reference
from .resource import (
    EndpointsSchema,
    GlobalResourceSchema,
    LocalResourceSchema,
    MethodSchema,
    ObjectResourceSchema,
)
from .types import (
    ActionScopeType,
    ActionType,
    ColorType,
    DialogWidthType,
    FieldFormatType,
    FieldType,
    LinkTargetType,
    PkType,
    RequestMethodType,
    ValidatorRuleType,
    ViewModeType,
    ViewType,
)
from .views import DetailViewParameters, GlobalViewSchema, ListViewParameters, ViewEndpointParameters, ViewSchema

if TYPE_CHECKING:
    from habarico.admin import ModelAdmin
    from rest_framework.views import APIView


DEFAULT_FIELD_TYPES = {
    IntegerField: FieldType.INTEGER,
    FloatField: FieldType.NUMBER,
    BooleanField: FieldType.BOOLEAN,
    ManyRelatedField: FieldType.ARRAY,
    Base64FileSerializer: FieldType.OBJECT,
    ListField: FieldType.ARRAY,
    ListSerializer: FieldType.ARRAY,
    Serializer: FieldType.OBJECT,
    MultipleChoiceField: FieldType.ARRAY,
    RangeField: FieldType.OBJECT,
}


DEFAULT_FIELD_FORMATS = {
    DateField: FieldFormatType.DATE,
    DateTimeField: FieldFormatType.DATETIME,
    TimeField: FieldFormatType.TIME,
    PrimaryKeyRelatedField: FieldFormatType.RELATION,
    AdminRelatedFieldMixin: FieldFormatType.RELATION,
    Base64ImageFileSerializer: FieldFormatType.IMAGE,
    Base64FileSerializer: FieldFormatType.FILE,
    UUIDField: FieldFormatType.UUID,
    EmailField: FieldFormatType.EMAIL,
    URLField: FieldFormatType.URL,
    MultipleChoiceField: None,
    ChoiceField: FieldFormatType.CHOICES,
    DecimalField: FieldFormatType.DECIMAL,
    RangeField: FieldFormatType.RANGE,
}


DEFAULT_FILTER_TYPES = {
    NumberFilter: FieldType.NUMBER,
    BooleanFilter: FieldType.BOOLEAN,
    ModelMultipleChoiceFilter: FieldType.ARRAY,
    MultipleChoiceFilter: FieldType.ARRAY,
    RangeFilter: FieldType.OBJECT,
}


DEFAULT_FILTER_FORMATS = {
    AdminRelatedFilterMixin: FieldFormatType.RELATION,
    DateFilter: FieldFormatType.DATE,
    DateTimeFilter: FieldFormatType.DATETIME,
    TimeFilter: FieldFormatType.TIME,
    ModelChoiceFilter: FieldFormatType.RELATION,
    ModelMultipleChoiceFilter: FieldFormatType.RELATION,
    ChoiceFilter: FieldFormatType.CHOICES,
    MultipleChoiceFilter: FieldFormatType.CHOICES,
    RangeFilter: FieldFormatType.RANGE,
}

EXCLUDED_VIEW_FIELDS = ["meta"]


class FieldTypeResolver:
    """
    Resolves the ``FieldType``/``FieldFormatType`` of DRF serializer fields and
    django-filter filters via an isinstance-ordered lookup.

    Swappable via ``DEFAULT_FIELD_TYPE_RESOLVER_CLASS`` (habarico.settings): a
    pro/enterprise package overrides one of the ``get_*`` methods, checks for its own
    field/filter classes, and falls back to ``super().get_*(...)`` for everything else -
    no need to touch or copy the built-in dicts.
    """

    FIELD_TYPES = DEFAULT_FIELD_TYPES
    FIELD_FORMATS = DEFAULT_FIELD_FORMATS
    FILTER_TYPES = DEFAULT_FILTER_TYPES
    FILTER_FORMATS = DEFAULT_FILTER_FORMATS

    def get_field_type(self, field: Field) -> FieldType:
        for serializer_class, field_type in self.FIELD_TYPES.items():
            if isinstance(field, serializer_class):
                return field_type
        return FieldType.STRING

    def get_field_format(self, field: Field) -> FieldFormatType | None:
        if getattr(field, "format", None):
            return field.format

        for serializer_class, field_format in self.FIELD_FORMATS.items():
            if isinstance(field, serializer_class):
                return field_format
        return None

    def get_filter_type(self, filter: DjangoFilter) -> FieldType:
        if getattr(filter, "type", None):
            return filter.type

        for filter_class, field_type in self.FILTER_TYPES.items():
            if isinstance(filter, filter_class):
                return field_type
        return FieldType.STRING

    def get_filter_format(self, filter: DjangoFilter) -> FieldFormatType | None:
        if getattr(filter, "format", None):
            return filter.format

        for filter_class, field_format in self.FILTER_FORMATS.items():
            if isinstance(filter, filter_class):
                return field_format
        return None


def get_field_type_resolver() -> FieldTypeResolver:
    """
    Get the shared ``DEFAULT_FIELD_TYPE_RESOLVER_CLASS`` instance.

    One instance per settings load, not one per resolved field - see
    ``AdminAPISettings.get_instance()``.

    Returns:
        FieldTypeResolver: The configured resolver.
    """
    return admin_api_settings.get_instance("DEFAULT_FIELD_TYPE_RESOLVER_CLASS")


def get_field_type(field: Field) -> FieldType:
    """
    Get the type of field. The types are very similar to the JSON schema types.

    Args:
        field (Field): The field to get the type of.

    Returns:
        FieldType: The type of the field
    """
    return get_field_type_resolver().get_field_type(field)


def get_field_format(field: Field) -> FieldFormatType | None:
    """
    Get the format of a field. Formats are used to provide additional information about the field.
    React admin can use this information to render the field in a specific way.

    Args:
        field (Field): The field to get the format of.

    Returns:
        FieldFormatType: The format of the field.
    """
    return get_field_type_resolver().get_field_format(field)


def get_filter_type(filter: DjangoFilter) -> FieldType:
    """
    Get the type of filter. Filter and field types are the same.

    Args:
        filter (DjangoFilter): The filter to get the type of.

    Returns:
        FieldType: The type of the filter.
    """
    return get_field_type_resolver().get_filter_type(filter)


def get_filter_format(filter: DjangoFilter) -> FieldFormatType | None:
    """
    Get the format of a filter. Formats are used to provide additional information about the filter.

    Args:
        filter (DjangoFilter): The filter to get the format of.

    Returns:
        FieldFormatType: The format of the filter or None if the filter does not have a format.
    """
    return get_field_type_resolver().get_filter_format(filter)


def get_filter_reference(filter: DjangoFilter) -> str | None:
    """
    Prepared for relations. Get the API endpoint reference name. Reference is used to build the UI field or inputs and
    tells the React admin where to get the data of the relation.

    Args:
        filter (DjangoFilter): The filter to get the reference of.

    Returns:
        str: The reference of the filter or None if the filter does not have a reference.
    """
    if isinstance(filter, AdminRelatedFilterMixin):
        return filter.reference
    if isinstance(filter, (ModelChoiceFilter, ModelMultipleChoiceFilter)):
        model = filter.queryset.model
        return get_reference_from_model(model)
    return None


def get_field_validators(field: Field) -> list[dict] | None:
    """
    Extract validation constraints from a DRF field so the frontend can enforce them before submit.

    Length and value bounds are taken from the field attributes (`max_length`, `min_length`,
    `max_value`, `min_value`). A regex rule is taken from the first `RegexValidator` found in
    `field.validators`; `URLValidator` is skipped because its pattern is not JavaScript-compatible
    (URL fields are validated on the frontend via their format instead).

    Each extracted rule is emitted as a `ValidatorRule` (a `{type, value, message}` dict). The
    rules are intentionally kept as plain dicts, not `ValidatorRule` objects: they are
    merged with the serializer-options and descriptor rules in dict space (see
    `merge_validator_rules`), which reconciles those heterogeneous sources by rule `type`.

    Auto-extracted rules never carry a `message`. DRF messages are localized on the backend to the
    request locale (and eagerly binding a lazy message here would freeze that locale into the
    schema), whereas schema-driven validation is localized on the frontend — so the frontend
    renders its own translated default. A custom message must be set explicitly via the descriptor
    validators (`RegexValidatorRule(pattern, "…")`), which is the developer's responsibility
    to localize.

    Args:
        field (Field): The field to extract the validators from.

    Returns:
        list[dict]: Extracted validation rules or None if the field has no extractable constraint.
    """
    rules = [
        build_validator_rule(ValidatorRuleType.MAX_LENGTH, getattr(field, "max_length", None)),
        build_validator_rule(ValidatorRuleType.MIN_LENGTH, getattr(field, "min_length", None)),
        build_validator_rule(ValidatorRuleType.MAX_VALUE, getattr(field, "max_value", None)),
        build_validator_rule(ValidatorRuleType.MIN_VALUE, getattr(field, "min_value", None)),
    ]

    regex_validator = next(
        (
            validator
            for validator in getattr(field, "validators", [])
            if isinstance(validator, RegexValidator) and not isinstance(validator, URLValidator)
        ),
        None,
    )
    if regex_validator is not None:
        rules.append(build_validator_rule(ValidatorRuleType.REGEX, regex_validator.regex.pattern))

    rules = [rule for rule in rules if rule is not None]
    return rules or None


def get_field_reference(field: Field) -> str | None:
    """
    Prepared for relations. Get the API endpoint reference name. Reference is used to build the UI field or inputs and
    tells the React admin where to get the data of the relation.

    Args:
        field (Field): The field to get the reference of.

    Returns:
        str: The reference of the field or None if the field does not have a reference.
    """
    from habarico.site import site

    if isinstance(field, AdminRelatedFieldMixin):
        return field.reference
    elif isinstance(field, PrimaryKeyRelatedField) and field.get_queryset() is not None:
        reference = field.get_queryset().model.__name__.lower()
        return reference if site.exists_admin(reference) else None
    elif isinstance(field, ManyRelatedField):
        return get_field_reference(field.child_relation)
    else:
        return None


class SchemaGenerator(BaseSchema):
    """
    Base class for schema generators. Every generator is responsible for generating a part of the administration schema.
    """

    def __init__(self, is_bound: bool = False):
        self._is_bound = is_bound

    def get_schema(self) -> BaseSchema | None:
        """
        Get the schema from the generator. The schema can be a field, filter, view or action.

        Returns:
            BaseSchema: The schema generated by the generator or None if the generator does not have a schema.
        """
        raise NotImplementedError

    def bind(self, **kwargs: Any) -> SchemaGenerator:
        """
        Bind the schema generator to the given arguments and return a new instance of the generator.

        Args:
            **kwargs: Additional arguments.

        Returns:
            SchemaGenerator: Bound schema generator.
        """
        bound_generator = copy(self)
        for key, value in kwargs.items():
            setattr(bound_generator, f"_{key}", value)
        bound_generator._is_bound = True
        return bound_generator

    def get_admin(self) -> ModelAdmin:
        """
        Get the admin the generator is bound to.

        Returns:
            ModelAdmin: The bound admin.

        Raises:
            ValueError: When the generator is used without ``bind(admin=...)``.
        """
        admin = getattr(self, "_admin", None)
        if admin is None:
            raise ValueError(
                f"{type(self).__name__} is not bound to an admin. Call bind(admin=...) before get_schema()."
            )
        return admin

    def get_request(self) -> Request | None:
        """
        Get the request the generator is bound to.

        Returns:
            Request | None: The bound request, or None when the generator is used outside the
            request cycle.
        """
        return getattr(self, "_request", None)

    def _get_schema_kwargs(self, **kwargs: Any) -> dict[str, Any]:
        """
        Get the schema kwargs. The kwargs are used to generate the schema.

        Args:
            **kwargs: Base arguments.

        Returns:
            dict[str, Any]: Dictionary with the schema kwargs.
        """
        return kwargs

    def _get_update_schema_context_kwargs(self) -> dict[str, Any]:
        return {}

    def _update_schema_context(self) -> None:
        self.context = self.context.update(**self._get_update_schema_context_kwargs())

    def setup(self, **kwargs) -> BaseSchema:
        super().setup(**kwargs)
        self._update_schema_context()
        return self

    def to_dict(self, **kwargs: Any) -> dict[str, Any] | None:
        """
        Convert the schema to a dictionary.

        Args:
            **kwargs: Additional arguments.'

        Returns:
            dict[str, Any]: Dictionary representation of the schema.
        """
        if not self._is_bound:
            raise ValueError("Schema generator is not bound. Call bind() before to_dict().")

        schema_kwargs = self._get_schema_kwargs(**kwargs)
        self.setup(**schema_kwargs)
        schema = self.get_schema()
        return schema.to_dict(context=self.context) if schema else None


class FieldSchemaGenerator(SchemaGenerator):
    """
    Field schema generator is responsible for generating the schema of a single field or serializer.
    Schema can be nested if the field/serializer is an object or an array.
    """

    def __init__(
        self,
        field: Field,
        view: APIView,
        sortable_fields: list[str] | None = None,
        descriptor: FieldDescriptor | None = None,
    ):
        super().__init__(True)
        self._field = field
        self._view = view
        self._sortable_fields = sortable_fields
        self._descriptor = descriptor

    def get_name(self) -> str:
        """
        Get the name of the field. The name is used to identify the field in the schema.

        Returns:
            str: Name of the field.
        """
        return self._field.field_name

    def get_enum(self) -> list[EnumType] | None:
        return (
            [
                EnumType(
                    value=value,
                    label=label,
                    color=getattr(self._field, "choice_colors", {}).get(value),
                    icon=getattr(self._field, "choice_icons", {}).get(value),
                )
                for value, label in (
                    (k.value if isinstance(k, ModelChoiceIteratorValue) else k, v)
                    for k, v in self._field.choices.items()
                )
            ]
            if hasattr(self._field, "choices")
            else None
        )

    def _get_field_default_value(self) -> Any:
        default_value = getattr(self._field, "initial", None)
        if callable(default_value):
            default_value = default_value()

        if default_value == "":
            return None
        if isinstance(default_value, Model):
            return default_value.pk
        return default_value

    def get_schema(self) -> FieldSchema:
        reference = get_field_reference(self._field)

        field_type = get_field_type(self._field)

        field_format = get_field_format(self._field)
        if field_format == FieldFormatType.RELATION and not reference:
            field_format = FieldFormatType.CHOICES

        items = None
        properties = None
        default_value = self._get_field_default_value()

        if field_type == FieldType.ARRAY:
            if isinstance(self._field, MultipleChoiceField):
                items = FieldSchema(
                    name=None,
                    type=FieldType.STRING,
                    format=FieldFormatType.CHOICES,
                    enum=self.get_enum() if not reference else None,
                    read_only=self._field.read_only,
                    write_only=self._field.write_only,
                    reference=reference,
                    nullable=self._field.allow_null,
                    required=self._field.required,
                    options=self._field.get_options() if hasattr(self._field, "get_options") else None,
                    sortable=False,
                )
            else:
                child_field = None
                if isinstance(self._field, (ListField, ListSerializer)):
                    child_field = self._field.child
                elif isinstance(self._field, ManyRelatedField):
                    child_field = self._field.child_relation

                if child_field:
                    items = type(self)(child_field, self._view)

        elif field_type == FieldType.OBJECT:
            if field_format == FieldFormatType.RANGE:
                properties = [
                    type(self)(
                        get_and_bind_drf_field(self._field.child_class, field_name, self._field, dict(required=False)),
                        self._view,
                    )
                    for field_name in ["lower", "upper"]
                ]
            else:
                properties = [type(self)(field, self._view) for field in self._field.fields.values()]

        options = self._field.get_options() if hasattr(self._field, "get_options") else None

        auto_validators = get_field_validators(self._field)
        if auto_validators:
            # validators set explicitly in the field options take precedence over auto-extracted
            # ones, merged per rule type rather than one replacing the other wholesale
            explicit_validators = (options or {}).get("validators")
            options = {**(options or {}), "validators": merge_validator_rules(auto_validators, explicit_validators)}

        return FieldSchema(
            name=self.get_name(),
            type=field_type,
            format=field_format,
            label=cap_first(self._field.label),
            short_label=getattr(self._field, "short_label", None),
            help_text=self._field.help_text,
            read_only=self._field.read_only,
            write_only=self._field.write_only,
            reference=reference,
            nullable=self._field.allow_null,
            required=self._field.required,
            enum=self.get_enum() if not items and not reference else None,
            options=options,
            default_value=default_value,
            sortable=bool(self._sortable_fields) and self._field.source in self._sortable_fields,
            items=items,
            properties=properties,
            descriptor=self._descriptor,
        )


class FilterSchemaGenerator(SchemaGenerator):
    """
    Filter schema generator is responsible for generating the schema of a single filter.
    """

    def __init__(
        self,
        name: str,
        filter: DjangoFilter,
        view: APIView,
        descriptor: FilterDescriptor | None = None,
        default_value: Any | None = None,
    ):
        super().__init__(True)
        self._name = name
        self._filter = filter
        self._descriptor = descriptor
        self._default_value = default_value
        self._view = view

    def get_name(self):
        return self._name

    def get_enum(self) -> list[EnumType] | None:
        return (
            [
                EnumType(value=value, label=label)
                for value, label in (
                    (k.value if isinstance(k, ModelChoiceIteratorValue) else k, v)
                    for k, v in self._filter.field.choices
                    if k
                )
            ]
            if hasattr(self._filter.field, "choices")
            else None
        )

    def get_schema(self) -> FilterSchema:
        reference = get_filter_reference(self._filter)
        filter_type = get_filter_type(self._filter)
        filter_format = get_filter_format(self._filter)

        if filter_format == FieldFormatType.RELATION and not reference:
            filter_format = FieldFormatType.CHOICES
        filter_enum = None
        if filter_format == FieldFormatType.CHOICES:
            filter_enum = self.get_enum()
        filter_options = (
            self._filter.get_options(reference, self._name) if hasattr(self._filter, "get_options") else None
        )

        filter_kwargs = {}
        if filter_type == FieldType.ARRAY:
            filter_kwargs["items"] = FilterSchema(
                type=FieldType.STRING,
                format=filter_format,
                enum=filter_enum,
                reference=reference,
                options=filter_options,
            )
        else:
            filter_kwargs = {
                "format": filter_format,
                "enum": filter_enum,
                "reference": reference,
                "options": filter_options,
            }
        if filter_format == FieldFormatType.RANGE:
            field_schema_generator_class = admin_api_settings.DEFAULT_FIELD_SCHEMA_GENERATOR_CLASS
            filter_kwargs["properties"] = [
                field_schema_generator_class(
                    get_and_bind_drf_field(self._filter.child_class, field_name, dict(required=False)), self._view
                )
                for field_name in ["lower", "upper"]
            ]

        default_value = self._default_value
        if default_value is None and filter_type == FieldType.BOOLEAN:
            default_value = False

        return FilterSchema(
            name=self.get_name(),
            type=filter_type,
            label=cap_first(self._filter.label),
            help_text=getattr(self._filter, "help_text", None),
            default_value=default_value,
            is_always_on=getattr(self._filter, "is_always_on", False),
            **filter_kwargs,
            descriptor=self._descriptor,
        )


class ViewOrActionSchemaGenerator(SchemaGenerator):

    name: str = None
    is_detail: bool = False

    def __init__(self, *, name: str = empty, is_detail: bool = empty):
        """
        Initialize the view schema generator.

        Args:
            name (str, optional): Name of the view.
            is_detail (bool, optional): Is the view detail view.
        """
        super().__init__()
        self.name = name if name is not empty else self.name
        self.is_detail = is_detail if is_detail is not empty else self.is_detail

    def get_name(self) -> str:
        if not self.name:
            raise ValueError("Name is not set.")
        return self.name

    def get_is_detail(self) -> bool:
        return self.is_detail

    def _get_target_obj(self):
        return self.context.obj

    def _can_render_detail(self) -> bool:
        """
        Check if the schema can be rendered. The schema can be rendered if the view exists and the user has permission.

        Returns:
            bool: True if the schema can be rendered.
        """
        return not self.get_is_detail() or bool(self.context.target_obj)

    def _can_full_render(self) -> bool:
        """
        Check if the schema can be rendered. The schema can be rendered if the view exists and the user has permission.

        Returns:
            bool: True if the schema can be rendered.
        """
        return self._can_render_detail()

    def _get_full_schema(self) -> ViewSchema:
        """
        Return final schema from the view and object.

        Returns:
            ViewSchema: ViewSchema object.
        """
        raise NotImplementedError

    def _can_base_render(self) -> bool:
        """
        Check if base format can be rendered in the admin.
        The schema can be rendered if the view exists and the user has permission, but model instance is not required.
        The final schema will be simplified and will not include the object specific fields because there are rendered
        all schemas in one request.

        Returns:
            bool: True if the schema can be rendered.
        """
        return True

    def _get_base_schema(self) -> GlobalViewSchema:
        """
        Default schema for the admin. The schema is simplified and does not include the object specific fields.

        Returns:
            GlobalViewSchema: GlobalViewSchema object.
        """
        raise NotImplementedError

    def can_render(self) -> bool:
        """
        Check if the schema can be rendered. The schema can be rendered if the view exists and the user has permission.

        Returns:
            bool: True if the schema can be rendered.
        """
        return self._can_base_render() if self.context.render_base_schema else self._can_full_render()

    def get_schema(self) -> BaseSchema:
        if not self.can_render():
            return None
        if self.context.render_base_schema:
            return self._get_base_schema()
        else:
            return self._get_full_schema()

    def _get_update_schema_context_kwargs(self) -> dict[str, Any]:
        generator = self

        def get_target_obj():
            return generator._get_target_obj()

        return {
            "get_target_obj_callback": get_target_obj,
        }


class ViewSchemaGenerator(ViewOrActionSchemaGenerator):
    """
    Base class for view generators.
    """

    type: ViewType = None
    label: str | None = None
    breadcrumbs: list[MenuSchema] | None = None
    view_mode: ViewModeType | None = None

    def __init__(
        self,
        *,
        name: str = empty,
        label: str = empty,
        type: ViewType = empty,
        is_detail: bool = empty,
        breadcrumbs: list[MenuSchema] | None = empty,
        view_mode: ViewModeType | None = empty,
    ):
        """
        Initialize the view schema generator.

        Args:
            name (str, optional): Name of the view.
            type (ViewType, optional): Type of the view.
            is_detail (bool, optional): Is the view detail view.
            breadcrumbs (list[MenuSchema] | None, optional): Breadcrumbs of the view. Defaults to None.
            view_mode (ViewModeType | None, optional): Default presentation mode emitted on the view. A trigger that
                                                       opens this view without its own mode inherits it on the
                                                       frontend. Defaults to None.
        """
        super().__init__(name=name, is_detail=is_detail)
        self.label = label if label is not empty else self.label
        self.type = type if type is not empty else self.type
        self.breadcrumbs = breadcrumbs if breadcrumbs is not empty else self.breadcrumbs
        self.view_mode = view_mode if view_mode is not empty else self.view_mode

    def get_type(self) -> ActionType:
        if self.type is None:
            raise ValueError("Type is not set.")
        return self.type

    def get_label(self) -> str:
        return self.label

    def get_view_mode(self) -> ViewModeType | None:
        return self.view_mode

    def _show_field(self, field: Field, resource: APIView) -> bool:
        """
        Return True if the field should be displayed in the view.

        Args:
            field (Field): Field instance.
            resource (APIView): View instance.

        Returns:
            bool: True if the field should be displayed.
        """
        return field.field_name not in EXCLUDED_VIEW_FIELDS and field.field_name

    def get_endpoint_parameters(self) -> ViewEndpointParameters:
        """
        Where the view's data comes from, left unaddressed when that is the resource being generated.

        An ``action_name`` cannot be addressed on its own, though — it lives inside the address — so a
        view that has one names the resource it belongs to.
        """
        action_name = self.get_action_name()
        reference = self.get_reference() or (self.get_admin().name if action_name else None)
        return ViewEndpointParameters(
            method=self.get_method(),
            reference=build_endpoint_reference(reference, action_name),
        )

    def get_breadcrumbs(self) -> list[MenuSchema] | None:
        return self.breadcrumbs

    def _get_base_schema(self) -> GlobalViewSchema:
        """
        Default schema for the admin. The schema is simplified and does not include the object specific fields.

        Returns:
            GlobalViewSchema: GlobalViewSchema object.
        """
        return GlobalViewSchema(
            name=self.get_name(),
            type=self.get_type(),
            is_detail=self.get_is_detail(),
            endpoint=self.get_endpoint_parameters(),
            mode=self.get_view_mode(),
        )


class ActionSchemaGenerator(ViewOrActionSchemaGenerator):
    """
    Base class for action generators.
    """

    type: ActionType = None
    label: str | None = None
    show_in_list: bool = True
    show_in_detail: bool = True
    icon: str | None = None
    color: ColorType | None = None
    confirm_dialog_title: str | None = None
    confirm_dialog_message: str | None = None

    def __init__(
        self,
        *,
        name: str = empty,
        type: ActionType = empty,
        is_detail: bool = empty,
        label: str | None = empty,
        show_in_list: bool = empty,
        show_in_detail: bool = empty,
        icon: str | None = empty,
        color: ColorType | None = empty,
        confirm_dialog_title: str | None = empty,
        confirm_dialog_message: str | None = empty,
    ):
        """
        Initialize the action schema generator.

        Args:
            name (str, optional): Name of the action.
            type (ActionType, optional): Type of the action.
            is_detail (bool, optional): Is the action detail action.
            label (str | None, optional): Label of the action.
            show_in_list (bool, optional): Show the action in the list view. Defaults to True.
            show_in_detail (bool, optional): Show the action in the detail view. Defaults to True.
            icon (str | None, optional): Icon of the action. Defaults to None. You can use Material Design icons.
            color (ColorType | None, optional): Color of the action. Defaults to None.
            confirm_dialog_title (str | None, optional): Confirm dialog title. Defaults to None.
            confirm_dialog_message (str | None, optional): Confirm dialog message. Defaults to None.
        """
        super().__init__(name=name, is_detail=is_detail)
        self.label = label if label is not empty else self.label
        self.type = type if type is not empty else self.type
        self.show_in_list = show_in_list if show_in_list is not empty else self.show_in_list
        self.show_in_detail = show_in_detail if show_in_detail is not empty else self.show_in_detail
        self.icon = icon if icon is not empty else self.icon
        self.color = color if color is not empty else self.color
        self.confirm_dialog_title = (
            confirm_dialog_title if confirm_dialog_title is not empty else self.confirm_dialog_title
        )
        self.confirm_dialog_message = (
            confirm_dialog_message if confirm_dialog_message is not empty else self.confirm_dialog_message
        )

    def get_type(self) -> ActionType:
        return self.type

    def get_label(self) -> str:
        return self.label if self.label is not None else cap_first(self.get_name())

    def get_show_in_list(self) -> bool:
        return self.show_in_list

    def get_show_in_detail(self) -> bool:
        return self.show_in_detail

    def get_icon(self) -> str:
        return self.icon

    def get_color(self) -> ColorType:
        return self.color

    def get_confirm_dialog_title(self) -> str:
        return self.confirm_dialog_title

    def get_confirm_dialog_message(self) -> str:
        return self.confirm_dialog_message

    def _get_base_schema(self) -> GlobalResourceActionSchema:
        """
        Default schema for the admin. The schema is simplified and does not include the object specific fields.

        Returns:
            GlobalResourceActionSchema: GlobalResourceActionSchema object.
        """
        return GlobalResourceActionSchema(
            name=self.get_name(),
            type=self.get_type(),
            is_detail=self.get_is_detail(),
            show_in_list=self.get_show_in_list(),
            show_in_detail=self.get_show_in_detail(),
        )


class ResourceViewAndActionResourceSchemaGeneratorMixin:

    reference: str | None = None
    method: RequestMethodType = None
    action_name: str | None = None
    basename: str | None = None

    def __init__(
        self, *, reference: str = empty, method: RequestMethodType = empty, action_name: str | None = empty, **kwargs
    ):
        self.reference = reference if reference is not empty else self.reference
        self.method = method if method is not empty else self.method
        self.action_name = action_name if action_name is not empty else self.action_name
        super().__init__(**kwargs)

    def get_action_name(self) -> str | None:
        return self.action_name

    def get_name(self) -> str:
        if self.name:
            return self.name
        name = self.basename
        if not name:
            raise ValueError("Name is not set.")
        reference = self.get_reference()
        action_name = self.get_action_name()
        return "-".join(filter(None, [name, reference, action_name]))

    def get_reference(self) -> str | None:
        return self.reference

    def get_method(self) -> RequestMethodType:
        if not self.method:
            raise ValueError("Method is not set.")
        return self.method

    def _get_path_object_pk(self) -> PkType:
        return self.context.obj.pk if self.context.obj else DEFAULT_PK

    def _get_path_kwargs(self) -> dict:
        """
        Get resource view kwargs. The kwargs are used to generate the URL path of the view.

        Returns:
            dict: Dictionary with the view kwargs.
        """

        if self.get_is_detail():
            return {"pk": self._get_path_object_pk()}
        return {}

    def get_action_url_name(self) -> str:
        postfix = "detail" if self.get_is_detail() else "list"
        action_name = self.get_action_name()
        return "-".join(filter(None, [action_name, postfix]))

    def get_path(self) -> str:
        """
        Return the path of the view. If the object is provided, the path should be the detail view.

        Returns:
            str: Path of the view.
        """
        reference = self.get_target_reference()
        action_name = self.get_action_url_name()
        return reverse_action(NAMESPACE, reference, action_name, kwargs=self._get_path_kwargs())

    def _get_resource(self) -> APIView | None:
        """
        Get the view from the reference, request and object. If the view does not exist, return None.

        Returns:
            APIView: APIView instance or None if the view does not exist.
        """
        try:
            return clone_view(self.get_method(), self.context.request, self.get_path())
        except NoReverseMatch:
            return None

    def get_target_reference(self):
        reference = self.get_reference()
        return reference if reference is not None else self._admin.name

    def _can_full_render(self) -> bool:
        """
        Check if the schema can be rendered. The schema can be rendered if the view exists and the user has permission.

        Returns:
            bool: True if the schema can be rendered.
        """
        resource = self.context.resource

        return (
            bool(resource)
            and self.get_action_url_name() == self.context.action_url_name
            and super()._can_full_render()
            and self.get_method().lower() in resource.http_method_names
            and check_view_permissions(resource, resource.request, self.context.target_obj)
        )

    def _can_base_render(self) -> bool:
        """
        Check if base format can be rendered in the admin.
        The schema can be rendered if the view exists and the user has permission, but model instance is not required.
        The final schema will be simplified and will not include the object specific fields because there are rendered
        all schemas in one request.

        Returns:
            bool: True if the schema can be rendered.
        """
        resource = self.context.resource
        return (
            bool(resource)
            and self.get_method().lower() in resource.http_method_names
            and check_view_permissions(resource, resource.request)
        )

    def _get_update_schema_context_kwargs(self) -> dict[str, Any]:
        generator = self

        def get_resource():
            return generator._get_resource()

        return {
            **super()._get_update_schema_context_kwargs(),
            "get_resource_callback": get_resource,
        }


class ResourceViewSchemaGeneratorMixin(ResourceViewAndActionResourceSchemaGeneratorMixin):

    def _get_update_schema_context_kwargs(self):
        generator = self

        def get_serializer():
            resource = generator.context.resource
            if resource and hasattr(resource, "get_serializer"):
                return generator.context.resource.get_serializer(instance=self.context.target_obj)
            return None

        return {
            **super()._get_update_schema_context_kwargs(),
            "get_serializer_callback": get_serializer,
        }


class ListViewSchemaGenerator(ResourceViewSchemaGeneratorMixin, ViewSchemaGenerator):
    """
    Schema generator for the list view (table).
    """

    basename = "list"
    type = ViewType.LIST

    boxes: Boxes | None = None
    filters: Filters | None = None
    row_actions: Actions | None = empty
    toolbar_actions: Actions | None = empty
    list_actions: Actions | None = None
    default_sorting: SortingOrStr | None = None
    reference: str | None = None
    extra_filters: dict[str, str | int | bool | None] | None = None
    sortable_field_name: str | None = None
    sortable_sort_for_filters: dict[str, str | int | bool | None] | None = None
    double_click_action: ActionDescriptor | str | None = None
    single_click_action: ActionDescriptor | str | None = None
    is_detail = False
    method = RequestMethodType.GET

    def __init__(
        self,
        *,
        name: str = empty,
        label: str | None = empty,
        breadcrumbs: list[MenuSchema] | None = empty,
        boxes: Boxes = empty,
        filters: Filters = empty,
        row_actions: Actions = empty,
        toolbar_actions: Actions = empty,
        list_actions: Actions = empty,
        default_sorting: SortingOrStr = empty,
        reference: str = empty,
        extra_filters: dict[str, str | int | bool | None] = empty,
        sortable_field_name: str = empty,
        sortable_sort_for_filters: dict[str, str | int | bool | None] = empty,
        double_click_action: ActionDescriptor | str = empty,
        single_click_action: ActionDescriptor | str = empty,
        view_mode: ViewModeType | None = empty,
    ):
        """
        Initialize the list view schema generator.

        Args:
            name (str, optional): Name of the view.
            label (str | None, optional): Label of the view.
            breadcrumbs (list[MenuSchema] | None, optional): Breadcrumbs of the view. Defaults to None.
            boxes (Boxes, optional): Fields and boxes to display as columns in the list view. Defaults to None.
            filters (Filters, optional): Filters to display in the list view. Defaults to None.
            row_actions (Actions, optional): Row actions to display in the list view. Left out, the
                view publishes the listed resource's own record actions; ``None`` or ``[]`` renders none.
            toolbar_actions (Actions, optional): Toolbar actions to display in the list view. Left out,
                the view publishes every action the resource supports; ``None`` or ``[]`` renders none.
            list_actions (Actions, optional): Utility actions of the table (export, print, ...) rendered
                next to the filters, separate from toolbar and row actions. Defaults to None.
            default_sorting (SortingOrStr, optional): Default sorting of the list view. Defaults to None.
            reference (str, optional): Reference to the resource. If not provider the admin reference is used.
                                       Defaults to None.
            extra_filters (dict[str, str | int | bool | None], optional): Extra filters to filter records in the list
                                                                          view. Defaults to None.
            sortable_field_name (str, optional): Name of the field that can be used for drag & drop sorting.
                                                 Defaults to None it means D&D sorting is disabled.
            sortable_sort_for_filters (dict[str, str | int | bool | None], optional): Soft filters that can be used
                                                                                      for D&D sorting. Defaults to None.
            double_click_action (ActionDescriptor | str, optional): Action to activate on row double-click. Accepts a
                                                 full action descriptor (carrying its own ``view_mode``) or a plain
                                                 action name (e.g. "show", "edit", "create-invoice"). Defaults to
                                                 None (auto: show -> edit -> nothing).
        """
        super().__init__(
            name=name,
            label=label,
            breadcrumbs=breadcrumbs,
            reference=reference,
            view_mode=view_mode,
        )
        self.boxes = boxes if boxes is not empty else self.boxes
        self.filters = filters if filters is not empty else self.filters
        self.row_actions = row_actions if row_actions is not empty else self.row_actions
        self.toolbar_actions = toolbar_actions if toolbar_actions is not empty else self.toolbar_actions
        self.list_actions = list_actions if list_actions is not empty else self.list_actions
        self.default_sorting = default_sorting if default_sorting is not empty else self.default_sorting
        self.extra_filters = extra_filters if extra_filters is not empty else self.extra_filters
        self.sortable_field_name = sortable_field_name if sortable_field_name is not empty else self.sortable_field_name
        self.sortable_sort_for_filters = (
            sortable_sort_for_filters if sortable_sort_for_filters is not empty else self.sortable_sort_for_filters
        )
        self.double_click_action = double_click_action if double_click_action is not empty else self.double_click_action
        self.single_click_action = single_click_action if single_click_action is not empty else self.single_click_action

    def get_boxes(self) -> Boxes:
        return self.boxes or [
            field.field_name
            for field in self.context.serializer.fields.values()
            if self._show_field(field, self.context.resource)
        ]

    def get_row_actions(self) -> Actions | None:
        """
        Row buttons act on one record, whose id the row supplies — hence the ``detail`` scope.

        Only a slot nothing was said about gets the default. ``None`` and ``[]`` are both decisions
        to render nothing, which is why the unset state is a sentinel of its own.
        """
        if self.row_actions is empty:
            return [DefaultActions(scope=ActionScopeType.DETAIL)]
        return self.row_actions

    def get_toolbar_actions(self) -> Actions | None:
        """Everything the resource supports, until the view says otherwise."""
        if self.toolbar_actions is empty:
            return [DefaultActions()]
        return self.toolbar_actions

    def get_list_actions(self) -> Actions | None:
        return self.list_actions

    def get_default_sorting(self) -> SortingOrStr | None:
        # A view without an ordering of its own publishes the resource's, so the list the frontend
        # opens is sorted the way the endpoint answers a request that sends no `order_by`
        # (HAB-915).
        if self.default_sorting is not None:
            return self.default_sorting

        context = getattr(self, "context", None)
        admin = getattr(getattr(context, "resource", None), "admin", None)
        return admin.get_default_sorting(request=getattr(context, "request", None)) if admin else None

    def get_extra_filters(self) -> dict[str, str | int | bool | None] | None:
        return self.extra_filters

    def get_sortable_field_name(self) -> str | None:
        return self.sortable_field_name

    def get_sortable_sort_for_filters(self) -> dict[str, str | int | bool | None] | None:
        return self.sortable_sort_for_filters

    def get_double_click_action(self) -> ActionDescriptor | None:
        return generate_action_descriptor(self.double_click_action)

    def get_single_click_action(self) -> ActionDescriptor | None:
        return generate_action_descriptor(self.single_click_action)

    def _generate_filters_from_resource(self) -> Filters:
        resource = self.context.resource
        filterset = resource.filterset_class(request=resource.request, view=resource)

        # Get generated filter names
        if isinstance(filterset.Meta.fields, dict):
            generated_filter_names = set()
            for name, lookups in filterset.Meta.fields.items():
                generated_filter_names |= {
                    name if not lookup or lookup == "exact" else f"{name}__{lookup}" for lookup in lookups
                }
        else:
            generated_filter_names = set(filterset.Meta.fields)

        filters = []
        used_filter_field_names = set()
        for name, filter in filterset.filters.items():
            if filter.field_name not in used_filter_field_names or name not in generated_filter_names:
                used_filter_field_names.add(filter.field_name)
                filters.append(name)
        return filters

    def get_filters(self) -> Filters:
        if self.filters is not None:
            return self.filters
        else:
            return self._generate_filters_from_resource()

    def _get_full_schema(self) -> APIView:
        return ViewSchema(
            name=self.get_name(),
            label=self.get_label(),
            type=self.get_type(),
            is_detail=self.get_is_detail(),
            list=ListViewParameters(
                boxes=self.get_boxes(),
                filters=self.get_filters(),
                row_actions=self.get_row_actions(),
                toolbar_actions=self.get_toolbar_actions(),
                list_actions=self.get_list_actions(),
                default_sorting=self.get_default_sorting(),
                extra_filters=self.get_extra_filters(),
                sortable_field_name=self.get_sortable_field_name(),
                sortable_sort_for_filters=self.get_sortable_sort_for_filters(),
                double_click_action=self.get_double_click_action(),
                single_click_action=self.get_single_click_action(),
            ),
            endpoint=self.get_endpoint_parameters(),
            breadcrumbs=self.get_breadcrumbs(),
            mode=self.get_view_mode(),
        )


class DetailViewSchemaGenerator(ResourceViewSchemaGeneratorMixin, ViewSchemaGenerator):
    """
    Base schema generator for form views like edit, create and show.
    """

    is_read_only: bool = False

    box: BaseBox | None = None
    toolbar_actions: Actions | None = empty
    bottom_actions: Actions | None = None

    def __init__(
        self,
        *,
        name: str = empty,
        label: str | None = empty,
        breadcrumbs: list[MenuSchema] | None = empty,
        type: ViewType = empty,
        is_detail: bool = empty,
        method: RequestMethodType = empty,
        box: BaseBox = empty,
        boxes: Boxes = empty,
        reference: str = empty,
        toolbar_actions: Actions = empty,
        bottom_actions: Actions = empty,
        action_name: str | None = empty,
        view_mode: ViewModeType | None = empty,
    ):
        """
        Initialize the detail view schema generator.

        Args:
            name (str, optional): Name of the view.
            label (str | None, optional): Label of the view.
            breadcrumbs (list[MenuSchema] | None, optional): Breadcrumbs of the view. Defaults to None.
            type (ViewType, optional): Type of the view.
            is_detail (bool, optional): Is the view detail view.
            method (RequestMethodType): Method of the view.
            box (BaseBox, optional): Box to display in the view. Defaults to None. One of box or boxes
                                     should be provided.
            boxes (Boxes, optional): Boxes and fields to display in the view. Defaults to None. One of box or boxes
                                     should be provided.
            reference (str, optional): Reference to the resource. If not provider the admin reference is used.
                                       Defaults to None.
            toolbar_actions (Actions, optional): Toolbar actions to display in the view. Defaults to None.
            bottom_actions (Actions, optional): Bottom actions to display in the view. Defaults to None.
            action_name (str | None, optional): Name of the resource action.
            view_mode (ViewModeType | None, optional): Default presentation mode emitted on the view. Defaults to None.
        """

        super().__init__(
            name=name,
            label=label,
            breadcrumbs=breadcrumbs,
            type=type,
            is_detail=is_detail,
            method=method,
            reference=reference,
            action_name=action_name,
            view_mode=view_mode,
        )
        assert not (boxes is not empty and box is not empty), "Either box or boxes should be provided"
        if boxes is not empty:
            self.box = Box(boxes=boxes)
        else:
            self.box = box if box is not empty else self.box
        self.toolbar_actions = toolbar_actions if toolbar_actions is not empty else self.toolbar_actions
        self.bottom_actions = bottom_actions if bottom_actions is not empty else self.bottom_actions

    def get_toolbar_actions(self) -> Actions | None:
        """Everything the resource supports, until the view says otherwise — ``None`` or ``[]``."""
        if self.toolbar_actions is empty:
            return [DefaultActions()]
        return self.toolbar_actions

    def get_bottom_actions(self) -> Actions | None:
        return self.bottom_actions

    def get_box(self) -> BaseBox:
        """
        Get the box instance that will be used to display the form.
        You can override this method to customize the box dynamically.
        """
        box = self.box
        if not box:
            resource = self.context.resource
            box = Box(
                boxes=[
                    field.field_name
                    for field in self.context.serializer.fields.values()
                    if self._show_field(field, resource)
                ]
            )

        if self.is_read_only:
            box = ReadonlyBoxWrapper(box)
        return box

    def _get_full_schema(self) -> ViewSchema:
        return ViewSchema(
            name=self.get_name(),
            label=self.get_label(),
            type=self.get_type(),
            is_detail=self.get_is_detail(),
            detail=DetailViewParameters(
                box=self.get_box(),
                toolbar_actions=self.get_toolbar_actions(),
                bottom_actions=self.get_bottom_actions(),
            ),
            endpoint=self.get_endpoint_parameters(),
            breadcrumbs=self.get_breadcrumbs(),
            mode=self.get_view_mode(),
        )


class ResourceDetailViewSchemaGenerator(DetailViewSchemaGenerator):

    def __init__(
        self,
        *,
        name: str = empty,
        label: str | None = empty,
        breadcrumbs: list[MenuSchema] | None = empty,
        type: ViewType = empty,
        is_detail: bool = empty,
        method: RequestMethodType = empty,
        box: BaseBox = empty,
        boxes: Boxes = empty,
        reference: str = empty,
        toolbar_actions: Actions = empty,
        bottom_actions: Actions = empty,
        view_mode: ViewModeType | None = empty,
    ):
        """
        Initialize the detail view schema generator.

        Args:
            name (str, optional): Name of the view.
            label (str | None, optional): Label of the view.
            breadcrumbs (list[MenuSchema] | None, optional): Breadcrumbs of the view. Defaults to None.
            type (ViewType, optional): Type of the view.
            is_detail (bool, optional): Is the view detail view.
            method (RequestMethodType): Method of the view.
            box (BaseBox, optional): Box to display in the view. Defaults to None. One of box or boxes
                                     should be provided.
            boxes (Boxes, optional): Boxes and fields to display in the view. Defaults to None. One of box or boxes
                                     should be provided.
            reference (str, optional): Reference to the resource. If not provider the admin reference is used.
                                       Defaults to None.
            toolbar_actions (Actions, optional): Toolbar actions to display in the view. Defaults to None.
            bottom_actions (Actions, optional): Bottom actions to display in the view. Defaults to None.
            view_mode (ViewModeType | None, optional): Default presentation mode emitted on the view. Defaults to None.
        """

        super().__init__(
            name=name,
            label=label,
            breadcrumbs=breadcrumbs,
            type=type,
            is_detail=is_detail,
            method=method,
            box=box,
            boxes=boxes,
            reference=reference,
            action_name=None,
            toolbar_actions=toolbar_actions,
            bottom_actions=bottom_actions,
            view_mode=view_mode,
        )


class CreateViewSchemaGenerator(ResourceDetailViewSchemaGenerator):
    """
    Schema generator for the create view. By default uses post method.
    """

    basename = "create"
    type = ViewType.CREATE
    is_detail = False
    method = RequestMethodType.POST
    bottom_actions = [SaveActionDescriptor()]


class ShowViewSchemaGenerator(ResourceDetailViewSchemaGenerator):
    """
    Schema generator for the show view. By default uses get method.
    """

    is_read_only = True
    basename = "show"
    type = ViewType.SHOW
    is_detail = True
    method = RequestMethodType.GET


class EditViewSchemaGenerator(ResourceDetailViewSchemaGenerator):
    """
    Schema generator for the edit view. By default, uses put method. Therefore, all rest fields are required in request.
    """

    basename = "edit"
    type = ViewType.EDIT
    is_detail = True
    method = RequestMethodType.PUT
    bottom_actions = [SaveActionDescriptor()]


class ActionViewSchemaGenerator(DetailViewSchemaGenerator):
    """
    Schema generator for the edit view. By default, uses put method. Therefore, all rest fields are required in request.
    """

    basename = "action"
    type = ViewType.ACTION
    bottom_actions = [SaveActionDescriptor()]


class ActionWithResourceSchemaGenerator(ResourceViewAndActionResourceSchemaGeneratorMixin, ActionSchemaGenerator):
    """
    Base class for action schema generators. Actions are rendered as a button in the react admin.
    There are multiple types of actions like delete, view, action, link-action, and background-action. Every action
    can be applied to a single object or multiple objects. Single object actions are rendered
    in the detail view and as a table row action. Multiple object actions are rendered as a button in the list view.
    """

    record_pk: PkType | None = None

    def __init__(self, *, record_pk: PkType | None = empty, **kwargs):
        self.record_pk = record_pk if record_pk is not empty else self.record_pk
        super().__init__(**kwargs)

    def get_record_pk(self) -> PkType | None:
        return self.record_pk

    def _get_target_obj(self) -> Model | None:
        if self.get_reference() is None:
            return self.context.obj
        elif self.get_record_pk() is not None:
            return self.context.resource.model.objects.filter(pk=self.get_record_pk()).first()
        return None

    def _get_path_object_pk(self) -> PkType:
        if self.get_reference() is None:
            return self.context.obj.pk if self.context.obj else DEFAULT_PK
        else:
            return self.get_record_pk() if self.get_record_pk() is not None else DEFAULT_PK


class LinkActionSchemaGenerator(ActionSchemaGenerator):
    """
    Helper schema generator for link actions.
    Link action return custom URL address.
    """

    type = ActionType.LINK
    url: str | None = None
    target: LinkTargetType = LinkTargetType.BLANK

    def __init__(
        self,
        *,
        name: str = empty,
        is_detail: bool = empty,
        label: str | None = empty,
        show_in_list: bool = empty,
        show_in_detail: bool = empty,
        icon: str | None = empty,
        color: ColorType | None = empty,
        confirm_dialog_title: str | None = empty,
        confirm_dialog_message: str | None = empty,
        url: str = empty,
        target: LinkTargetType = empty,
    ):
        """
        Initialize the link action schema generator.

        Args:
            name (str, optional): Name of the action.
            is_detail (bool, optional): Is the action detail action. Defaults to False.
            label (str, optional): Label of the action.
            show_in_list (bool, optional): Show action in the list view. Defaults to True.
            show_in_detail (bool, optional): Show action in the detail view. Defaults to True.
            icon (str, optional): Icon of the action. Defaults to None. You can use Material Design icons.
            color (ColorType, optional): Color of the action button. Defaults to None.
            confirm_dialog_title (str, optional): Confirm dialog title. Defaults to None.
            confirm_dialog_message (str, optional): Confirm dialog message. Defaults to None.
            url (str): URL address.
            target (LinkTargetType): Link target.
        """
        super().__init__(
            name=name,
            is_detail=is_detail,
            label=label,
            show_in_list=show_in_list,
            show_in_detail=show_in_detail,
            icon=icon,
            color=color,
            confirm_dialog_title=confirm_dialog_title,
            confirm_dialog_message=confirm_dialog_message,
        )
        self.url = url if url is not empty else self.url
        self.target = target if target is not empty else self.target

    def get_url(self):
        if not self.url:
            raise ValueError("URL is not set.")
        return self.url

    def get_target(self) -> LinkTargetType:
        return self.target

    def _get_full_schema(self) -> ResourceActionSchema:
        return ResourceActionSchema(
            name=self.get_name(),
            type=self.get_type(),
            is_detail=self.get_is_detail(),
            label=self.get_label(),
            icon=self.get_icon(),
            color=self.get_color(),
            show_in_list=self.get_show_in_list(),
            show_in_detail=self.get_show_in_detail(),
            confirm_dialog_title=self.get_confirm_dialog_title(),
            confirm_dialog_message=self.get_confirm_dialog_message(),
            link_url=self.get_url(),
            link_target=self.get_target(),
        )


class ResourceActionSchemaGenerator(ActionWithResourceSchemaGenerator):
    """
    Helper schema generator for custom actions.
    Custom action can call any API endpoint with any method and request data.
    """

    type = ActionType.RESOURCE
    is_background: bool = False
    path: str | None = None
    data: dict | None = None
    endpoint_action_name: str | None = None

    def __init__(
        self,
        *,
        name: str = empty,
        is_detail: bool = empty,
        method: RequestMethodType = empty,
        label: str | None = empty,
        show_in_list: bool = empty,
        show_in_detail: bool = empty,
        icon: str | None = empty,
        color: ColorType | None = empty,
        path: str | None = empty,
        data: dict | None = empty,
        reference: str | None = empty,
        is_background: bool = empty,
        confirm_dialog_title: str | None = empty,
        confirm_dialog_message: str | None = empty,
        record_pk: PkType | None = empty,
        action_name: str | None = empty,
        endpoint_action_name: str | None = empty,
    ):
        """
        Initialize the custom action schema generator.

        Args:
            name (str, optional): Name of the action.
            is_detail (bool, optional): Is the action detail action.
            method (RequestMethodType, optional): Method that the action uses to communicate with the API.
            label (str, optional): Label of the action.
            show_in_list (bool, optional): Show action in the list view. Defaults to True.
            show_in_detail (bool, optional): Show action in the detail view. Defaults to True.
            icon (str, optional): Icon of the action. Defaults to None. You can use Material Design icons.
            color (ColorType, optional): Color of the action button. Defaults to None.
            path (str, optional): Path of the resource. Defaults to None.
            data (dict, optional): Data that will be sent in the request. Defaults to None.
            reference (str, optional): Reference to another admin. If not provided, the basename of current view
                                       will be used. Defaults to None.
            is_background (bool, optional): If the action should be executed in the background. Defaults to False.
            confirm_dialog_title (str, optional): Confirm dialog title. Defaults to None.
            confirm_dialog_message (str, optional): Confirm dialog message. Defaults to None.
            record_pk (PkType, optional): Record primary key. Defaults to None.
            action_name (str | None, optional): Name of the resource action.
            endpoint_action_name (str | None, optional): Name of the resource action. If not provided, the name
                                                         will be used.
        """
        super().__init__(
            name=name,
            is_detail=is_detail,
            method=method,
            label=label,
            show_in_list=show_in_list,
            show_in_detail=show_in_detail,
            icon=icon,
            color=color,
            reference=reference,
            record_pk=record_pk,
            confirm_dialog_title=confirm_dialog_title,
            confirm_dialog_message=confirm_dialog_message,
            action_name=action_name,
        )
        self.path = path if path is not empty else self.path
        self.data = data if data is not empty else self.data
        self.is_background = is_background if is_background is not empty else self.is_background
        self.endpoint_action_name = (
            endpoint_action_name if endpoint_action_name is not empty else self.endpoint_action_name
        )

    def get_path(self) -> str:
        path = self.path

        if path:
            return path

        if not path:
            path = self.get_endpoint_action_name()

        if path and not path.endswith("/"):
            path += "/"

        if path:
            return urljoin(super().get_path(), path)
        return super().get_path()

    def get_data(self) -> dict | None:
        return self.data

    def get_is_background(self) -> bool:
        return self.is_background

    def get_endpoint_action_name(self) -> str | None:
        return self.endpoint_action_name

    def _get_full_schema(self) -> ResourceActionSchema:
        return ResourceActionSchema(
            name=self.get_name(),
            type=self.get_type(),
            is_detail=self.get_is_detail(),
            show_in_list=self.get_show_in_list(),
            show_in_detail=self.get_show_in_detail(),
            label=self.get_label(),
            icon=self.get_icon(),
            color=self.get_color(),
            confirm_dialog_title=self.get_confirm_dialog_title(),
            confirm_dialog_message=self.get_confirm_dialog_message(),
            resource_method=self.get_method(),
            reference=self.get_reference(),
            resource_path=self.get_path(),
            resource_data=self.get_data(),
            resource_is_background=self.get_is_background(),
            record_pk=self.get_record_pk(),
            action_name=self.get_endpoint_action_name(),
        )


class DeleteActionSchemaGenerator(ResourceActionSchemaGenerator):
    """
    Schema generator for the delete action. By default, uses delete method.
    """

    name = "delete"
    label = _("Delete")
    method = RequestMethodType.DELETE
    show_in_list = True
    show_in_detail = False
    is_detail = True
    icon = "Delete"
    color = ColorType.ERROR
    confirm_dialog_title = _("Delete item")
    confirm_dialog_message = _("Do you want to delete the item?")


class ViewLinkActionSchemaGenerator(ActionWithResourceSchemaGenerator):
    """
    Base class for view action schema generators.
    View actions are rendered as a button in the react admin and works as a link.
    """

    type = ActionType.VIEW
    view_mode: ViewModeType = ViewModeType.REDIRECT
    dialog_width: DialogWidthType | str | None = None
    view_name: str | None = None
    choices: list[tuple[str, str, str]] | list[tuple[str, dict]] | None = None
    method = RequestMethodType.GET
    parameters: dict[str, str] | None = None

    def __init__(
        self,
        *,
        name: str = empty,
        view_name: str | None = empty,
        is_detail: bool = empty,
        method: RequestMethodType = empty,
        label: str | None = empty,
        show_in_list: bool = empty,
        show_in_detail: bool = empty,
        icon: str | None = empty,
        color: ColorType | None = empty,
        reference: str | None = empty,
        record_pk: PkType | None = empty,
        choices: list[tuple[str, str, str]] | list[tuple[str, dict]] | None = empty,
        parameters: dict[str, str] | None = empty,
        view_mode: ViewModeType = empty,
        dialog_width: DialogWidthType | str | None = empty,
        action_name: str | None = empty,
    ):
        """
        Initialize the view action schema generator.

        Args:
            name (str, optional): Name of the action.
            view_name (str, optional): Name of the view. Defaults to None.
            is_detail (bool, optional): Is the action detail action.
            method (RequestMethodType, optional): Method that the action uses to communicate with the API.
            label (str, optional): Label of the action.
            show_in_list (bool, optional): Show action in the list view. Defaults to True.
            show_in_detail (bool, optional): Show action in the detail view. Defaults to True.
            icon (str, optional): Icon of the action. Defaults to None. You can use Material Design icons.
            color (ColorType, optional): Color of the action button. Defaults to None.
            reference (str, optional): Reference to another admin. If not provided, the basename of current
                                       view will be used. Defaults to None.
            record_pk (PkType, optional): Record primary key. Defaults to None.
            choices (list[tuple[str, str, str]] | list[tuple[str, dict]], optional): List of choices for link submenu,
                                                                                     parameters are added to URL
                                                                                     querystring. Defaults to None.
            parameters (dict[str, str] | None, optional): Parameters to add to the URL querystring.
            view_mode (ViewModeType, optional): Mode of the view. Defaults to ViewModeType.REDIRECT.
            dialog_width (DialogWidthType | str, optional): Width of the dialog. Accepts MUI breakpoints
                (xs/sm/md/lg/xl) or a pixel value string (e.g. ``"800px"``). Only used when view_mode is DIALOG.
                Defaults to None.
            action_name (str | None, optional): Name of the resource action.
        """
        super().__init__(
            name=name,
            is_detail=is_detail,
            method=method,
            label=label,
            show_in_list=show_in_list,
            show_in_detail=show_in_detail,
            icon=icon,
            color=color,
            reference=reference,
            record_pk=record_pk,
            action_name=action_name,
        )
        self.choices = choices if choices is not empty else self.choices
        self.view_name = view_name if view_name is not empty else self.view_name
        self.view_mode = view_mode if view_mode is not empty else self.view_mode
        self.dialog_width = dialog_width if dialog_width is not empty else self.dialog_width
        self.parameters = parameters if parameters is not empty else self.parameters

    def get_choices(self) -> list[ActionViewChoice] | None:
        if not self.choices:
            return None
        return [
            ActionViewChoice(
                label=label,
                parameters=parameters[0] if isinstance(parameters[0], dict) else dict([parameters]),
            )
            for label, *parameters in self.choices
        ]

    def get_parameters(self) -> dict[str, str] | None:
        return self.parameters

    def get_view_name(self) -> str:
        return self.view_name or self.get_name()

    def get_view_mode(self) -> ViewModeType:
        return self.view_mode

    def get_dialog_width(self) -> DialogWidthType | str | None:
        return self.dialog_width

    def _get_view_schema_generator(self) -> ViewSchemaGenerator | None:
        resource = self.context.resource
        request = self.context.request
        # If reference is set not send object to the context
        obj = self.context.target_obj
        resource_schema_generator = resource.get_schema_generator()

        resource_schema_generator.setup(request=request, obj=obj)
        for schema_generator in resource_schema_generator._get_view_schemas():
            if schema_generator.get_name() == self.get_view_name():
                return schema_generator.setup(
                    **{
                        "request": self.context.request,
                        "render_base_schema": self.context.render_base_schema,
                        "render_object_schema": self.context.render_object_schema,
                        "obj": obj,
                        "action_url_name": schema_generator.get_action_url_name(),
                    }
                )

        return None

    def get_endpoint_action_name(self) -> str:
        return self.context.view_schema.get_action_name()

    def _can_full_render(self) -> bool:
        if self.context.resource is None:
            return False

        view_schema = self.context.view_schema

        if not bool(view_schema) or not view_schema.can_render():
            return False

        return super()._can_full_render()

    def _get_resource(self) -> APIView | None:
        """
        Get path to the resource schema view. If the view does not exist, return None.
        """
        try:
            return clone_view("get", self.context.request, self.get_path() + "schema/")
        except NoReverseMatch:
            return None

    def _get_full_schema(self) -> ResourceActionSchema:
        return ResourceActionSchema(
            name=self.get_name(),
            type=self.get_type(),
            is_detail=self.get_is_detail(),
            show_in_list=self.get_show_in_list(),
            show_in_detail=self.get_show_in_detail(),
            label=self.get_label(),
            icon=self.get_icon(),
            color=self.get_color(),
            confirm_dialog_title=self.get_confirm_dialog_title(),
            confirm_dialog_message=self.get_confirm_dialog_message(),
            record_pk=self.get_record_pk(),
            view_name=self.get_view_name(),
            view_choices=self.get_choices(),
            view_parameters=self.get_parameters(),
            view_mode=self.get_view_mode(),
            view_dialog_width=self.get_dialog_width(),
            reference=self.get_reference(),
            action_name=self.get_endpoint_action_name(),
        )

    def _get_update_schema_context_kwargs(self):
        generator = self

        def get_view_schema_generator():
            return generator._get_view_schema_generator()

        return {
            **super()._get_update_schema_context_kwargs(),
            "get_view_schema_callback": get_view_schema_generator,
        }


class EditActionSchemaGenerator(ViewLinkActionSchemaGenerator):
    """
    Schema generator for edit button.
    """

    name = "edit"
    label = _("Edit")
    show_in_list = True
    show_in_detail = True
    is_detail = True
    icon = "Edit"
    method = RequestMethodType.PUT


class ShowActionSchemaGenerator(ViewLinkActionSchemaGenerator):
    """
    Schema generator for show button.
    """

    name = "show"
    label = _("Detail")
    show_in_list = True
    show_in_detail = True
    is_detail = True
    icon = "Visibility"
    method = RequestMethodType.GET


class CreateActionSchemaGenerator(ViewLinkActionSchemaGenerator):
    """
    Schema generator for create button.
    """

    name = "create"
    label = _("Create")
    show_in_list = True
    show_in_detail = False
    is_detail = False
    icon = "Add"
    method = RequestMethodType.POST


class AdminSchemaGenerator(SchemaGenerator):
    """
    Generator for the admin schema. The admin schema is the main schema that
    defines all the resources and actions that are available in the administration.
    Is used to generate the admin menu. And provides base information about the concrete resource.

    Extension points for a pro/enterprise package (HAB-811): override ``schema_class`` with a
    ``GlobalResourceSchema`` subclass declaring the extra keys, and ``get_resource_schema_kwargs()``
    to fill them from the admin. Point ``ModelAdmin.schema_generator_class`` at the subclass.
    """

    #: Schema object built by ``get_schema()``. A pro/enterprise package overrides this with its
    #: own ``GlobalResourceSchema`` subclass to add optional keys to the resource schema.
    schema_class = GlobalResourceSchema

    def __init__(self, admin: ModelAdmin):
        """
        Initialize the admin schema generator.

        Args:
            admin (ModelAdmin): Admin instance.
        """
        super().__init__(True)
        self._admin = admin

    def get_name(self) -> str:
        return self._admin.name

    def get_label(self) -> str:
        return self._admin.get_label()

    def get_pk_field_name(self) -> str:
        return self._admin.model._meta.pk.name

    def to_dict(self, **kwargs) -> dict:
        return super().to_dict(render_base_schema=True, **kwargs)

    def get_resource_schema_kwargs(self) -> dict[str, Any]:
        """
        Build the keyword arguments ``schema_class`` is instantiated with.

        Override in a subclass to contribute additional keys - call ``super()`` and merge, so the
        core keys keep coming from one place. Named ``get_resource_schema_kwargs`` rather than
        ``get_schema_kwargs`` to stay distinct from ``SchemaGenerator._get_schema_kwargs()``,
        which builds the *context* kwargs passed to ``setup()``.

        Returns:
            dict[str, Any]: Keyword arguments for ``schema_class``.
        """
        return {
            "name": self.get_name(),
            "label": self.get_label(),
            "pk_field_name": self.get_pk_field_name(),
            "views": self._admin.get_view_schemas(self.context.request),
            "actions": self._admin.get_action_schemas(self.context.request),
            "menu": self._admin.get_menu_schema(self.context.request),
        }

    def get_schema(self) -> list[GlobalResourceSchema] | GlobalResourceSchema:
        return self.schema_class(**self.get_resource_schema_kwargs())


class MenuSchemaGenerator(SchemaGenerator):
    """
    Generator for the admin menu schema. The menu schema is used to generate the admin menu.
    """

    label: str | None = None
    icon: str | None = None
    color: ColorType | None = None
    priority: int | None = None
    parent: MenuGroup | None = None
    record_pk: PkType | None = None
    view_name: str | None = None

    def __init__(
        self,
        *,
        label: str | None = empty,
        priority: int | None = empty,
        icon: str | None = empty,
        color: ColorType | None = empty,
        parent: MenuGroup | None = empty,
        record_pk: PkType | None = empty,
        view_name: str | None = empty,
    ):
        """
        Initialize the menu schema generator.

        Args:
            label (str, optional): Label of the menu item. Defaults to None.
            priority (int, optional): Priority of the menu item. Defaults to None.
            icon (str, optional): Icon of the menu item. Defaults to None.
            color (ColorType, optional): Color of the icon. Defaults to None.
            parent (MenuGroup, optional): Parent menu group. Defaults to None.
            record_pk (PkType, optional): Record primary key. Defaults to None.
            view_name (str, optional): Name of the view. Defaults to None.
        """
        super().__init__()
        self.label = label if label is not empty else self.label
        self.icon = icon if icon is not empty else self.icon
        self.color = color if color is not empty else self.color
        self.priority = priority if priority is not empty else self.priority
        self.parent = parent if parent is not empty else self.parent
        self.record_pk = record_pk if record_pk is not empty else self.record_pk
        self.view_name = view_name if view_name is not empty else self.view_name

    def _get_view_schema_generator(self) -> ViewSchemaGenerator | None:
        obj = self.context.target_obj
        for schema_generator in self._admin.get_view_schemas(self.context.request, obj):
            if schema_generator.get_name() == self.get_view_name():
                return schema_generator.setup(
                    **{
                        "request": self.context.request,
                        "render_base_schema": False,
                        "render_object_schema": self.context.render_object_schema,
                        "obj": obj,
                        "action_url_name": schema_generator.get_action_url_name(),
                    }
                )
        return None

    def get_view_name(self) -> str:
        return self.view_name or "list"

    def get_priority(self) -> int:
        return self.priority or MENU_GENERATOR_DEFAULT_PRIORITY

    def get_icon(self) -> str | None:
        return self.icon or self._admin.icon

    def get_color(self) -> ColorType | None:
        return self.color or self._admin.color

    def get_label(self) -> str:
        return self.label or self._admin.get_label()

    def get_name(self) -> str:
        return f"{self._admin.name}-{self.get_view_name()}"

    def _get_target_obj(self) -> Model | None:
        record_pk = self.get_record_pk()
        if record_pk:
            return self._admin.model.objects.filter(pk=record_pk).first()
        return None

    def get_parent(self) -> MenuGroup | None:
        return self.parent

    def get_record_pk(self) -> PkType | None:
        return self.record_pk

    def can_render(self) -> bool:
        view_schema_generator = self._get_view_schema_generator()
        return bool(view_schema_generator) and view_schema_generator.can_render()

    def get_schema(self) -> MenuSchema | None:
        return (
            MenuSchema(
                name=self.get_name(),
                label=self.get_label(),
                icon=self.get_icon(),
                color=self.get_color(),
                priority=self.get_priority(),
                parent=self.get_parent(),
                view_name=self.get_view_name(),
                record_pk=self.get_record_pk(),
            )
            if self.can_render()
            else None
        )

    def _get_update_schema_context_kwargs(self) -> dict:
        generator = self

        def get_target_obj():
            return generator._get_target_obj()

        return {"get_target_obj_callback": get_target_obj}


class EndpointsSchemaGenerator(SchemaGenerator):
    """
    Schema generator for the single REST resource, It is alternative to the swagger/openapi format.
    Generates which fields and filters with its types and formats are available in the resource
    for specific HTTP methods.
    """

    def __init__(self, view: APIView):
        """
        Initialize the endpoint schema generator.

        Args:
            view (APIView): The view for which to generate the schema.
        """
        super().__init__(True)
        self._view = view

    def _get_path_kwargs(self, obj: Model | None = None) -> dict:
        if obj:
            return {"pk": obj.pk}
        return {}

    def _get_view(self, method: str, view_reference: str, request: Request, obj: Model | None = None) -> APIView:
        return clone_view(
            method,
            request,
            reverse_action(
                NAMESPACE, view_reference, self.context.action_url_name, kwargs=self._get_path_kwargs(obj=obj)
            ),
        )

    def _show_field(self, field: Field) -> dict:
        return field.field_name not in EXCLUDED_VIEW_FIELDS and field.field_name

    def _get_view_sortable_fields(self, obj: Model, method: RequestMethodType, view: ViewType) -> list[str]:
        """
        Get list of sortable fields from the view.
        """
        if obj or method != RequestMethodType.GET:
            return []

        queryset = self._view.get_queryset() if hasattr(self._view, "get_queryset") else None

        if queryset is None:
            return []

        view_filter_backends = getattr(self._view, "filter_backends", [])

        ordering_filter_backend = None
        for backend in view_filter_backends:
            if issubclass(backend, BaseOrderingFilter):
                ordering_filter_backend = backend

        if not ordering_filter_backend:
            return []

        return [
            valid_fields[0]
            for valid_fields in ordering_filter_backend().get_valid_fields(
                queryset,
                self._view,
                context={"view": view, "request": view.request},
            )
        ]

    def get_schema(self) -> EndpointsSchema:
        request = self.context.request
        obj = self.context.obj

        schema = {}
        for method in [
            RequestMethodType.GET,
            RequestMethodType.POST,
            RequestMethodType.PUT,
            RequestMethodType.PATCH,
            RequestMethodType.DELETE,
        ]:
            view = self._get_view(method, self._view.basename, request, obj)
            if view and method.lower() and check_view_permissions(view, request, obj):
                serializer = view.get_serializer(instance=obj)
                sortable_fields = self._get_view_sortable_fields(obj=obj, method=method, view=view)
                filterset = view.filterset_class(request=view.request, view=view)
                SerializerMeta = getattr(serializer, "Meta", None)
                serializer_field_descriptors = getattr(SerializerMeta, "descriptors", {})
                filterset_descriptors = getattr(SerializerMeta, "descriptors", {})
                field_schema_generator_class = admin_api_settings.DEFAULT_FIELD_SCHEMA_GENERATOR_CLASS
                schema[method.lower()] = MethodSchema(
                    fields=(
                        [
                            field_schema_generator_class(
                                field=field,
                                view=view,
                                sortable_fields=sortable_fields,
                                descriptor=serializer_field_descriptors.get(field.field_name),
                            )
                            for field in serializer.fields.values()
                            if self._show_field(field)
                        ]
                        if view.action != "destroy"
                        else []
                    ),
                    **(
                        {
                            "filters": [
                                FilterSchemaGenerator(
                                    name=filter_name,
                                    filter=filter,
                                    view=view,
                                    descriptor=filterset_descriptors.get(filter_name),
                                )
                                for filter_name, filter in filterset.filters.items()
                                if not filter_name.startswith("_")
                            ]
                        }
                        if view.action == "list"
                        else {}
                    ),
                )

        return EndpointsSchema(**schema)


class LocalResourceSchemaGenerator(SchemaGenerator):
    """
    Schema generator for the single REST resource, It is alternative to the swagger/openapi format.
    Generates which fields and filters with its types and formats are available in the resource
    for specific HTTP methods.
    """

    endpoints_schema_generator_class = EndpointsSchemaGenerator

    def __init__(self, view: APIView):
        """
        Initialize the resource schema generator.

        Args:
            view (APIView): The view for which to generate the schema.
        """
        super().__init__(True)
        self._view = view

    def _get_endpoints_schema_generator(self):
        return self.endpoints_schema_generator_class(self._view)

    def _get_update_schema_context_kwargs(self) -> dict[str, Any]:
        """
        Stamp the address of the schema being generated, which is what ``CURRENT`` resolves against.

        Deliberately taken from the view's own admin rather than from ``context.resource``: nested
        generators overwrite that, so a descriptor inside a list box would resolve to the box's
        reference instead of the page it was authored in. This generator is the root of the tree, so
        the value it stamps is the page, and the context chain hands it down unchanged.

        All four parts come from the request being served: the resource from the admin, the record
        from the object, the action from the route, and the query from the parameters that travel
        with a request.
        """
        return {
            **super()._get_update_schema_context_kwargs(),
            "schema_source": build_resource_reference(
                self._view.admin.name,
                record_pk=self.context.obj.pk if self.context.obj else None,
                action_name=self._get_source_action_name(),
                params=self._get_source_params(),
            ),
        }

    def _get_source_action_name(self) -> str | None:
        """
        The action segment of the schema route being served, or None for a plain list or detail one.

        ``AdminRouter`` names an action route ``<action>-list`` / ``<action>-detail``, which is the
        form ``ViewSchemaGenerator.get_action_url_name()`` composes; this reads it back.
        """
        action_url_name = self.context.action_url_name
        if not action_url_name:
            return None
        action_name, _, _ = action_url_name.rpartition("-")
        return action_name or None

    def _get_source_params(self) -> dict[str, str] | None:
        """
        The query of the request being served, narrowed to the parameters that travel with one.

        ``CLONE_REQUEST_QUERY_PARAMS`` is the pair ``clone_view`` already forwards to a sub-request:
        the link to the record the schema was asked for. The rest of a query — paging, filters,
        ordering — describes one list response rather than an address.
        """
        request = self.context.request
        if request is None:
            return None
        params = {name: request.GET[name] for name in CLONE_REQUEST_QUERY_PARAMS if name in request.GET}
        return params or None

    def _get_view_schemas(self) -> list[ViewSchema]:
        return self._view.admin.get_view_schemas(self.context.request, self.context.obj)

    def _get_object_action_schemas(self) -> list[ResourceActionSchema] | None:
        # The public property, not `_requested_fieldset`: the private attribute holds this context's
        # own value and misses one set further up the chain, and reads as `EMPTY` — which is truthy —
        # when nothing set it at all.
        requested_fieldset = self.context.requested_fieldset
        action_schemas = self._get_action_schemas()

        if not requested_fieldset:
            # No fieldset restriction — return all actions.
            return action_schemas

        actions_rf = requested_fieldset.fieldset.get("actions") if requested_fieldset.fieldset else None

        if actions_rf is None:
            # Schema was requested but actions were not included.
            return None

        if not actions_rf.fieldset:
            # actions requested without specifying which ones — return all.
            return action_schemas

        return [action_schema for action_schema in action_schemas if action_schema.get_name() in actions_rf.fieldset]

    def _get_action_schemas(self) -> list[ResourceActionSchema]:
        return self._view.admin.get_action_schemas(self.context.request, self.context.obj)

    def _get_endpoints_schema(self) -> EndpointsSchema:
        return self._get_endpoints_schema_generator()

    def _get_full_schema(self) -> LocalResourceSchema:
        return LocalResourceSchema(
            name=self._view.admin.name,
            label=self._view.admin.get_label(),
            pk_field_name=self._view.model._meta.pk.name,
            views=self._get_view_schemas(),
            endpoints=self._get_endpoints_schema(),
            actions=self._get_action_schemas(),
        )

    def _get_object_schema(self) -> ObjectResourceSchema:
        return ObjectResourceSchema(
            name=self._view.admin.name,
            label=self._view.admin.get_label(),
            pk_field_name=self._view.model._meta.pk.name,
            actions=self._get_object_action_schemas(),
        )

    def get_schema(self) -> BaseSchema:
        if self.context.render_object_schema:
            return self._get_object_schema()
        else:
            return self._get_full_schema()
