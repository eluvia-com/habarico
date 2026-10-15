from dataclasses import asdict
from typing import List

from django.utils.translation import gettext_lazy as _
from habarico.contrib.preferences.exceptions import (
    PreferenceNotRegistered,
    PreferenceValidationError,
    PreferenceValueTooLarge,
    TooManyPreferences,
)
from habarico.contrib.preferences.registry import (
    delete_value,
    delete_values,
    get_value,
    get_values,
    max_bytes_for,
    set_value,
)
from habarico.contrib.preferences.serializers import UserPreferenceItemSerializer
from habarico.settings import admin_api_settings
from rest_framework import mixins, status, viewsets
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


class UserPreferenceViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    authentication_classes = admin_api_settings.DEFAULT_AUTHENTICATION_CLASSES
    permission_classes = [IsAuthenticated]
    serializer_class = UserPreferenceItemSerializer
    filter_backends: list = []
    pagination_class = None
    lookup_url_kwarg = "key"

    def get_queryset(self) -> List[dict]:
        return [asdict(item) for item in get_values(self.request.user)]

    def get_object(self) -> dict:
        try:
            item = get_value(self.request.user, self.kwargs[self.lookup_url_kwarg])
        except PreferenceNotRegistered:
            raise NotFound()
        if item is None:
            raise NotFound()
        return asdict(item)

    def update(self, request, *args, **kwargs):
        key = self.kwargs[self.lookup_url_kwarg]
        try:
            self._check_content_length(key)
            item = set_value(request.user, key, request.data)
        except PreferenceNotRegistered:
            raise NotFound()
        except PreferenceValueTooLarge:
            raise ValidationError(_("Preference value is too large."))
        except TooManyPreferences:
            raise ValidationError(_("Too many preferences are stored for this user."))
        except PreferenceValidationError:
            raise ValidationError(_("Invalid value for preference."))
        serializer = self.get_serializer(asdict(item))
        return Response(serializer.data)

    def _check_content_length(self, key: str) -> None:
        """Refuse an oversized body from its `Content-Length`, before it is parsed.

        The registry checks the parsed value as well - this only saves the parse of a body
        that is already known to be too big. A body whose length is not declared simply
        falls through to that check.
        """
        limit = max_bytes_for(key)
        if limit is None:
            return
        try:
            length = int(self.request.META.get("CONTENT_LENGTH") or 0)
        except (TypeError, ValueError):
            return
        if length > limit:
            raise PreferenceValueTooLarge(key, limit, length)

    def destroy(self, request, *args, **kwargs):
        try:
            delete_value(request.user, self.kwargs[self.lookup_url_kwarg])
        except PreferenceNotRegistered:
            raise NotFound()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def destroy_all(self, request, *args, **kwargs):
        delete_values(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
