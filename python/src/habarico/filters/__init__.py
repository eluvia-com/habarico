from __future__ import annotations

import unicodedata
from functools import reduce
from typing import TYPE_CHECKING
from urllib.parse import unquote_plus

from django.db import models
from django.db.models import Model, Q
from django.db.models.fields.related import OneToOneRel
from django.http import Http404
from django.utils.translation import gettext
from django.utils.translation import gettext_lazy as _
from django_filters import rest_framework as rest_framework_filters
from django_filters.filters import CharFilter
from eluvia_base_django.rest_framework.filters import BaseFilterSet
from habarico.config import SEARCH_UNACCENT_ENABLED
from habarico.filters.filters import AdminModelChoiceFilter, ContainsUUIDFilter
from habarico.schema.fields import Filter, Filters
from habarico.schema.types import FieldFormatType
from habarico.utils import LOOKUP_SEP, check_view_permissions, clone_view, walk_to_leaf_field
from rest_framework import serializers
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.relations import ManyRelatedField

if TYPE_CHECKING:
    from habarico.admin import ModelAdmin
    from rest_framework.views import APIView


def _clone_permitted_view(request, method: str, path: str) -> APIView | None:
    """
    Clone the view behind a client-supplied path, or return None if it may not be used.

    ``clone_view`` builds the view without running ``dispatch()``, so nothing has authenticated or
    authorized it and the check has to happen here (HAB-905).

    The view's own permission classes are responsible for gating access. A custom ``@action``
    that omits a permission check is already directly reachable via its own URL —
    ``check_view_permissions`` is sufficient here.

    Args:
        request (Request): The DRF request the filter is running under.
        method (str): The HTTP method from the filter value.
        path (str): The URL path from the filter value, still url-encoded.

    Returns:
        APIView | None: The cloned view, or None if it may not be cloned or used.
    """
    view = clone_view(method, request, unquote_plus(path))

    if not view:
        return None

    return view if check_view_permissions(view, view.request) else None


def _normalize(value: str) -> str:
    """Case-fold and (when configured) strip diacritics for label comparison."""
    value = value.lower()
    if SEARCH_UNACCENT_ENABLED:
        value = "".join(c for c in unicodedata.normalize("NFKD", value) if unicodedata.category(c) != "Mn")
    return value


#: Attribute name under which ``SearchFilter`` stashes the resolved search query on the DRF
#: request. Downstream consumers - including a pro/enterprise package's match highlighting - read
#: it instead of re-parsing the request query params.
SEARCH_QUERY_REQUEST_ATTR = "_admin_search_query"


class SearchFilter(CharFilter):
    """
    A filter that allows for searching for a string in a list of fields.
    """

    format = FieldFormatType.SEARCH

    def __init__(self, *args, is_always_on=True, **kwargs):
        super().__init__(*args, **kwargs)
        self.is_always_on = is_always_on

    def filter(self, qs, value):
        # Stash the resolved search query on the request so consumers don't have to re-parse the
        # query params, which would need to know about all input formats supported by
        # ComplexFilterBackend.
        request = getattr(self.parent, "request", None) if self.parent is not None else None
        if request is not None:
            setattr(request, SEARCH_QUERY_REQUEST_ATTR, value or "")

        if not value:
            return qs

        search_fields = self.parent.view.search_fields
        if not search_fields:
            return qs

        model = qs.model
        lookup = "__unaccent__icontains" if SEARCH_UNACCENT_ENABLED else "__icontains"
        q_per_word = [
            reduce(
                lambda a, b: a | b,
                [self._q_for_field(model, field_path, word, lookup) for field_path in search_fields],
            )
            for word in value.split()
        ]
        if not q_per_word:
            return qs
        return qs.filter(pk__in=qs.filter(reduce(lambda a, b: a & b, q_per_word)))

    def _q_for_field(self, model: type[Model], field_path: str, word: str, lookup: str) -> Q:
        """
        Build a ``Q`` for one ``search_fields`` path and one query word.

        For choice fields and ``BooleanField`` the word is matched against the human-readable
        display labels (choice labels or ``gettext("Yes"/"No")``) and the resulting raw values
        are used for an ``__in`` lookup. Other fields keep the original ``__icontains`` behavior
        so they hit the DB directly with no Python preprocessing.
        """
        field = walk_to_leaf_field(model, field_path)
        word_norm = _normalize(word)

        if field is not None and field.choices:
            matches = [raw for raw, label in field.choices if word_norm in _normalize(str(label))]
            return Q(**{f"{field_path}__in": matches}) if matches else Q(pk__in=[])

        if isinstance(field, models.BooleanField):
            matches = []
            if word_norm in _normalize(gettext("Yes")):
                matches.append(True)
            if word_norm in _normalize(gettext("No")):
                matches.append(False)
            return Q(**{f"{field_path}__in": matches}) if matches else Q(pk__in=[])

        # ``__unaccent__`` is a Postgres text-only transform - applying it to numeric/date/etc.
        # columns errors out (e.g. MoneyField ⇒ DecimalField). Use plain ``__icontains`` on those.
        effective_lookup = lookup if isinstance(field, (models.CharField, models.TextField)) else "__icontains"
        return Q(**{f"{field_path}{effective_lookup}": word})


ADMIN_FILTER_DEFAULTS = {
    **BaseFilterSet.FILTER_DEFAULTS,
    models.UUIDField: {"filter_class": ContainsUUIDFilter},
}
ADMIN_FILTER_DEFAULTS[models.OneToOneField]["filter_class"] = AdminModelChoiceFilter
ADMIN_FILTER_DEFAULTS[models.ForeignKey]["filter_class"] = AdminModelChoiceFilter
ADMIN_FILTER_DEFAULTS[OneToOneRel]["filter_class"] = AdminModelChoiceFilter


class AdminFilterSet(BaseFilterSet):

    FILTER_DEFAULTS = ADMIN_FILTER_DEFAULTS

    _reverse_field = rest_framework_filters.CharFilter(method="filter__reverse_field")
    _reverse_filter = rest_framework_filters.CharFilter(method="filter__reverse_filter")

    @classmethod
    def get_filters(cls):
        filters = super().get_filters()
        # Ensure that the search filter is always first
        Meta = getattr(cls, "Meta", None)
        if "search" not in filters and Meta and hasattr(Meta, "admin") and Meta.admin and Meta.admin.search_fields:
            filters["search"] = SearchFilter(label=_("Search"))
        return filters

    def _get_field_from_serializer(self, field_name, serializer):
        """
        Get a field from a serializer by its name, possibly with lookups.
        """
        field_name, rest = field_name.split(LOOKUP_SEP, 1) if LOOKUP_SEP in field_name else (field_name, None)
        serializer_fields = getattr(serializer, "fields", {})
        field = serializer_fields.get(field_name)
        if not field:
            return None

        if isinstance(field, serializers.ListField):
            # If the field is a ListSerializer, we need to get the child field
            field = field.child

        elif isinstance(field, ManyRelatedField):
            # If the field is a ManyRelatedField, we need to get the child relation
            field = field.child_relation

        # Recursively get the field from the serializer if there are more lookups
        return self._get_field_from_serializer(rest, field) if rest else field

    def filter__reverse_field(self, queryset, name, value):
        def raise_error():
            raise ValidationError({"_reverse_field": gettext("Invalid value of the filter {name}.").format(name=name)})

        try:
            method, path, field_name = value.split(":", 2)
        except ValueError:
            raise_error()

        view = _clone_permitted_view(self.request, method, path)

        if not view:
            raise_error()

        try:
            lookup_url_kwarg = view.lookup_url_kwarg or view.lookup_field
            instance = view.get_object() if lookup_url_kwarg and lookup_url_kwarg in view.kwargs else None
            view_field = self._get_field_from_serializer(field_name, view.get_serializer(instance=instance))
            field_queryset = view_field.get_queryset() if hasattr(view_field, "get_queryset") else None
        except (APIException, Http404):
            # Fail exactly the way an unresolvable path fails. Letting "no such record" be told
            # apart from "not yours" would put the membership oracle straight back.
            field_queryset = None

        if field_queryset is None:
            raise_error()

        return queryset.filter(pk__in=field_queryset)

    def filter__reverse_filter(self, queryset, name, value):
        def raise_error():
            raise ValidationError({"_reverse_filter": gettext("Invalid value of the filter {name}.").format(name=name)})

        try:
            method, path, field = value.split(":", 2)
        except ValueError:
            raise_error()

        view = _clone_permitted_view(self.request, method, path)

        if not view:
            raise_error()

        try:
            filter_field = view.filterset_class(view=view).filters.get(field)
            filter_field_queryset = (
                filter_field.get_queryset(view.request) if hasattr(filter_field, "get_queryset") else None
            )
        except (APIException, Http404):
            filter_field_queryset = None

        if filter_field_queryset is None:
            raise_error()

        return queryset.filter(pk__in=filter_field_queryset)


def model_filter_set_factory(
    model: Model, fields: Filters = None, filterset_class: AdminFilterSet = None, admin: ModelAdmin = None
):
    """
    Generate a filter set for a model.
    """
    base_filterset_meta = ()
    if filterset_class and (filterset_meta_class := getattr(filterset_class, "Meta", None)) is not None:
        base_filterset_meta = (filterset_meta_class,)

    fields = fields or []

    field_with_lookups = {}
    for field in fields:
        field_name = field.get_name() if isinstance(field, Filter) else field
        if LOOKUP_SEP not in field_name:
            field_with_lookups[field_name] = []
        else:
            field_name, lookup = field_name.rsplit(LOOKUP_SEP, 1)
            field_with_lookups.setdefault(field_name, []).append(lookup)
    field_with_lookups.setdefault(model._meta.pk.name, []).extend(["exact", "in", "icontains"])

    descriptors = {field.get_name(): field for field in fields if isinstance(field, Filter)}

    filter_fields = {}
    for field in model._meta.fields:
        if field.name in field_with_lookups:
            field_lookups = field_with_lookups[field.name]
            if not field_lookups:
                if isinstance(field, (models.UUIDField, models.TextField, models.CharField)) and field.choices is None:
                    field_lookups.append("icontains")
                else:
                    field_lookups.append("exact")

            filter_fields[field.name] = field_lookups

    return type(
        f"{model.__name__}FilterSet",
        (filterset_class or AdminFilterSet,),
        {
            "Meta": type(
                "Meta",
                base_filterset_meta,
                {"model": model, "fields": filter_fields, "descriptors": descriptors, "admin": admin},
            )
        },
    )
