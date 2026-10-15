from __future__ import annotations

from contextlib import nullcontext
from typing import TYPE_CHECKING

from django.db.models import Model, QuerySet
from eluvia_base.integrations.fieldset import RFS
from eluvia_base_django.rest_framework.filters import ComplexFilterBackend, OrderingFilter
from eluvia_base_django.tools.db_lock import atomic_with_advisory_lock
from habarico.config import PERMISSION_FLAG_PER_ACTION
from habarico.filters import model_filter_set_factory
from habarico.schema import ActionSchema, Field, LocalResourceSchemaGenerator
from habarico.schema.fields import generate_sorting_descriptor
from habarico.serializers import model_serializer_factory
from habarico.settings import admin_api_settings
from habarico.utils import get_admin_permission_method
from rest_framework import viewsets
from rest_framework.exceptions import MethodNotAllowed
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.serializers import Serializer
from rest_framework.views import APIView

if TYPE_CHECKING:
    from habarico.admin import ModelAdmin


class AdminPermission(BasePermission):
    """
    Permission class for admin views. Checks the permission for the base actions according to the admin settings.
    If action is not allowed for the user, it raises MethodNotAllowed exception.

    An action whose flag the admin has no method for never reaches the 405: ``get_admin_permission_method``
    raises ``ImproperlyConfigured`` for it, because nothing was asked and that is a broken
    declaration rather than a user who lacks the permission.
    """

    def has_permission(self, request, view):
        flag = PERMISSION_FLAG_PER_ACTION.get(view.action)
        if flag is None:
            return True

        admin_permission_method = get_admin_permission_method(view.admin, flag)
        if not admin_permission_method(request):
            raise MethodNotAllowed(request.method)

        return True


class AdminSchemaView(APIView):
    """
    View for getting the schema of the entrypoint for the admin site.
    """

    authentication_classes = admin_api_settings.DEFAULT_AUTHENTICATION_CLASSES
    permission_classes = admin_api_settings.DEFAULT_PERMISSION_CLASSES

    def get(self, *args, **kwargs):
        from habarico.site import site

        return Response(site.get_schema(self.request))


class AdminModelViewSet(viewsets.ModelViewSet):
    """
    Base viewset for the admin views. It extends the default ModelViewSet with the admin settings and schema generator.
    """

    authentication_classes = admin_api_settings.DEFAULT_AUTHENTICATION_CLASSES
    permission_classes = admin_api_settings.DEFAULT_PERMISSION_CLASSES + [AdminPermission]
    pagination_class = admin_api_settings.DEFAULT_PAGINATION_CLASS
    filter_backends = [ComplexFilterBackend, OrderingFilter]

    schema_generator_class = LocalResourceSchemaGenerator

    action_url_name = None

    def get_queryset(self) -> QuerySet:
        """
        The resource's queryset, ordered by its ``default_sorting`` where one is declared.

        A request carrying ``order_by`` replaces this: ``OrderingFilter`` calls
        ``QuerySet.order_by()``, which overrides whatever ordering is already on the queryset. A
        request without one keeps it, which is the point - the list is answered in the order its
        schema publishes rather than in whatever order the database returns (HAB-915).

        Returns:
            QuerySet: the base queryset, ordered.
        """
        queryset = super().get_queryset()

        sorting = generate_sorting_descriptor(self.admin.get_default_sorting(request=getattr(self, "request", None)))
        if sorting is None:
            return queryset

        field_name = sorting._field_name
        descending = getattr(sorting._direction, "value", sorting._direction) == "desc"
        return queryset.order_by(f"-{field_name}" if descending else field_name)

    @property
    def extra_ordering_fields(self) -> list[str]:
        """
        Fields accepted in ``order_by`` on top of the admin's ``ordering_fields``.

        The list view schema publishes ``default_sorting``, and the frontend puts exactly that -
        or the primary key, for a list with no sorting of its own - into ``order_by`` on the first
        request. An admin narrowing ``ordering_fields`` would otherwise refuse the ordering its own
        schema asked the frontend for (HAB-915). Both are ordered by regardless of what the client
        sends, so accepting them adds nothing a request could not already reach.

        This is the hook ``BaseOrderingFilter.get_valid_fields`` reads off the view, which is why
        it also reaches the ``ordering_fields`` of the endpoint schema, built from the same call.

        Returns:
            list[str]: field names, resolved for the request being served.
        """
        names = []

        sorting = generate_sorting_descriptor(self.admin.get_default_sorting(request=getattr(self, "request", None)))
        if sorting is not None:
            names.append(sorting._field_name)

        names.append(self.get_queryset().model._meta.pk.name)
        return names

    def get_schema_generator(self) -> LocalResourceSchemaGenerator:
        """
        Get the schema generator for the viewset.
        """
        return self.schema_generator_class(self)

    def get_extra_meta(self, obj: Model) -> dict:
        """
        Extra entries merged into the serialized ``meta`` block of one object.

        Extension point (HAB-811): core contributes nothing, so a free-only install emits only the
        ``meta`` keys ``AdminModelSerializer.get_meta()`` builds itself. A pro/enterprise package
        adds its own optional keys (e.g. ``highlights``) from a viewset mixin - none of them is
        required by ``contract/openapi.yaml``.

        Args:
            obj (Model): model instance being serialized.

        Returns:
            dict: entries to merge into ``meta``; empty when there is nothing to add.
        """
        return {}

    def update(self, request, *args, **kwargs):
        with (
            atomic_with_advisory_lock(self.admin.get_advisory_lock_name("update"), self.kwargs["pk"])
            if self.admin.auto_advisory_lock_for_update_enabled
            else nullcontext()
        ):
            return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        with (
            atomic_with_advisory_lock(self.admin.get_advisory_lock_name("destroy"), self.kwargs["pk"])
            if self.admin.auto_advisory_lock_for_destroy_enabled
            else nullcontext()
        ):
            return super().destroy(request, *args, **kwargs)

    def get_obj_repr(self, obj: Model) -> str:
        """
        Get the representation of the object in the admin.
        """
        return self.admin.get_obj_repr(obj)

    def get_resource_schema(self, obj: Model, requested_fieldset: RFS | None = None) -> dict:
        """
        Get the schema for the viewset and model instance.
        """
        return self.get_schema_generator().to_dict(
            obj=obj,
            render_object_schema=True,
            request=self.request,
            action_url_name="detail",
            requested_fieldset=requested_fieldset,
        )

    def get_schema(self, obj: Model | None = None) -> dict:
        """
        Get the schema for the viewset instance.
        """
        return self.get_schema_generator().to_dict(
            obj=obj, render_object_schema=False, request=self.request, action_url_name=self.action_url_name
        )

    def schema_detail(self, *args, **kwargs) -> Response:
        """
        Detail DRF action for getting the schema of the object.
        """
        obj = self.get_object()
        return Response(self.get_schema(obj))

    def schema_list(self, *args, **kwargs) -> Response:
        """
        DRF action for getting the schema of the viewset.

        A pro/enterprise package's ``AdminModelViewSet`` mixin (e.g. ``AggregateViewSetMixin``)
        may override this to dispatch on other ``action_url_name`` values before falling back to
        ``super().schema_list()``.
        """
        return Response(self.get_schema())

    def get_serializer_class(self) -> Serializer:
        """
        Get the serializer class for the viewset.
        """
        if self.serializer_class:
            return self.serializer_class

        fields = self.admin.get_fields(self.action, self.request)

        extra_kwargs = {
            field.get_name(): field.get_serializer_extra_kwargs() for field in fields if isinstance(field, Field)
        }
        read_only_fields = self.admin.get_read_only_fields(self.action, self.request)
        return model_serializer_factory(
            self.model,
            serializer=self.base_serializer_class,
            fields=fields,
            read_only_fields=read_only_fields,
            extra_kwargs=extra_kwargs,
        )

    def get_trigger_action_schema(self, obj: Model) -> ActionSchema | None:
        """
        Get the schema for the trigger action of the response.
        """
        return None


def model_viewset_factory(
    model: Model,
    admin: ModelAdmin,
    base_viewset: None,
    base_serializer_class: None,
) -> AdminModelViewSet:
    """
    Factory function for creating an admin viewset for a model.

    Args:
        model (Model): model class.
        admin (ModelAdmin): admin class.
        base_viewset (AdminModelViewSet, optional): base viewset class.
        base_serializer_class (Serializer, optional): base serializer class.

    Returns:
        AdminModelViewSet: admin viewset class.
    """

    base_viewset = base_viewset or admin_api_settings.DEFAULT_VIEWSET_CLASS

    filter_set_class = getattr(base_viewset, "filterset_class", None)
    filter_set_class = model_filter_set_factory(model, admin.get_filter_fields(), filter_set_class, admin)

    viewset_queryset = getattr(base_viewset, "queryset")
    queryset = model.objects.all() if viewset_queryset is None else viewset_queryset

    base_serializer_class = getattr(base_viewset, "base_serializer_class", base_serializer_class)

    model = getattr(base_viewset, "model", queryset.model)

    return type(
        f"{model.__name__}ViewSet",
        (base_viewset,),
        {
            "queryset": queryset,
            "filterset_class": filter_set_class,
            "admin": admin,
            "model": model,
            "search_fields": admin.get_search_fields(),
            "ordering_fields": admin.get_ordering_fields(),
            "base_serializer_class": base_serializer_class,
            "permission_classes": (
                base_viewset.permission_classes + ([admin.permission_classes] if admin.permission_classes else [])
            ),
        },
    )
