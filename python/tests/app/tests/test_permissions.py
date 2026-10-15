"""
Permission resolution on ``ModelAdmin``.

``can_read`` / ``can_create`` / ``can_update`` / ``can_delete`` declare who may reach the built-in
CRUD actions. Each may be a bool for a fixed answer, or a method taking the request for per-user
rules; ``has_*_permission(request)`` is their always-callable form, named after Django's own admin
permission methods (HAB-948).
"""

import pytest
from app.admin import ArticleAdmin, ReadOnlyArticleAdmin
from django.core.exceptions import ImproperlyConfigured
from habarico.config import PERMISSION_FLAG_PER_ACTION
from habarico.utils import get_admin_permission_method
from habarico.views import AdminPermission
from rest_framework import status
from rest_framework.request import Request


def build_request(request_factory, user):
    request = Request(request_factory.get("/"))
    request.user = user
    return request


class TestBoolDeclarations:
    """A bool declaration is answered as-is - the behaviour every admin has today."""

    def test_has_read_permission_follows_can_read(self, mock_request):
        assert ArticleAdmin().has_read_permission(mock_request) is True

    def test_write_permissions_follow_their_flags(self, mock_request):
        admin = ReadOnlyArticleAdmin()

        assert admin.has_read_permission(mock_request) is True
        assert admin.has_create_permission(mock_request) is False
        assert admin.has_update_permission(mock_request) is False
        assert admin.has_delete_permission(mock_request) is False


class TestMethodDeclarations:
    """A method declaration is evaluated per request instead of being taken as always-allowed."""

    def test_can_read_method_receives_the_request(self, monkeypatch, request_factory):
        monkeypatch.setattr(ArticleAdmin, "can_read", lambda self, request: request.user == "staff")

        assert ArticleAdmin().has_read_permission(build_request(request_factory, "staff")) is True
        assert ArticleAdmin().has_read_permission(build_request(request_factory, "intruder")) is False

    def test_can_update_method_receives_the_request(self, monkeypatch, request_factory):
        monkeypatch.setattr(ArticleAdmin, "can_update", lambda self, request: request.user == "editor")

        assert ArticleAdmin().has_update_permission(build_request(request_factory, "editor")) is True
        assert ArticleAdmin().has_update_permission(build_request(request_factory, "reader")) is False

    def test_a_method_counts_as_allowed_without_a_request(self, monkeypatch):
        """Registration-time checks and the schema generators have no request to evaluate a
        per-request rule against, so it counts as "may be allowed" there; the permission class
        settles it on every actual request."""
        monkeypatch.setattr(ArticleAdmin, "can_read", lambda self, request: request.user == "staff")

        assert ArticleAdmin().has_read_permission(None) is True

    def test_a_false_declaration_still_drops_the_view_generators(self, monkeypatch):
        """A literal False is knowable without a request, so the view is not declared at all -
        while a method keeps its generators, to be settled per request."""
        monkeypatch.setattr(ArticleAdmin, "can_update", False)
        assert not [g for g in ArticleAdmin().view_schema_generators if type(g).__name__.startswith("Edit")]

        monkeypatch.setattr(ArticleAdmin, "can_update", lambda self, request: False)
        assert [g for g in ArticleAdmin().view_schema_generators if type(g).__name__.startswith("Edit")]


class TestAdminPermissionEnforcement:
    """The permission class refuses the action a method declaration denies.

    Before HAB-948 the declaration was read as a plain truthy value, so a bound method - always
    truthy - silently granted access and was never called.
    """

    def test_list_is_refused_when_a_can_read_method_denies(self, db, api_client, monkeypatch):
        monkeypatch.setattr(ArticleAdmin, "can_read", lambda self, request: False)

        response = api_client.get("/admin/article/")

        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

    def test_list_is_served_when_a_can_read_method_permits(self, db, api_client, monkeypatch):
        monkeypatch.setattr(ArticleAdmin, "can_read", lambda self, request: True)

        response = api_client.get("/admin/article/")

        assert response.status_code == status.HTTP_200_OK

    def test_retrieve_is_refused_when_a_can_read_method_denies(self, db, article, api_client, monkeypatch):
        monkeypatch.setattr(ArticleAdmin, "can_read", lambda self, request: False)

        response = api_client.get(f"/admin/article/{article.pk}/")

        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

    def test_a_bool_declaration_keeps_being_enforced(self, db, api_client, monkeypatch):
        monkeypatch.setattr(ArticleAdmin, "can_read", False)

        response = api_client.get("/admin/article/")

        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED


class TestActionMap:
    """Every action the permission class guards has to name a declaration the admin can answer -
    the method is derived from the flag, so a typo in either would leave the action with nothing
    to ask."""

    def test_every_guarded_action_resolves_to_a_method_on_the_admin(self, mock_request):
        admin = ArticleAdmin()

        for flag in PERMISSION_FLAG_PER_ACTION.values():
            assert isinstance(get_admin_permission_method(admin, flag)(mock_request), bool)

    def test_a_flag_nothing_answers_is_refused_instead_of_let_through(self, mock_request, monkeypatch):
        """A declaration the admin has no method for is a broken declaration, not a denied user -
        the action must not pass the check unasked."""
        monkeypatch.setitem(PERMISSION_FLAG_PER_ACTION, "list", "can_teleport")

        class View:
            action = "list"
            admin = ArticleAdmin()

        with pytest.raises(ImproperlyConfigured, match="has_teleport_permission"):
            AdminPermission().has_permission(mock_request, View())
