"""Tests for the wiring of the export into an admin (HAB-535)."""

import os
import subprocess
import sys
import textwrap
from types import SimpleNamespace

import pytest
from app.admin import (
    ColumnCountListViewSchemaGenerator,
    ConfiguredExportArticleAdmin,
    CustomViewsetExportArticleAdmin,
    DeclaredListExportArticleAdmin,
    DisabledExportArticleAdmin,
    GuardedAdminModelViewSet,
    PublishedOnlyAdminModelViewSet,
    RefuseMarkedRequestsPermission,
    UnconfiguredExportArticleAdmin,
)
from app.models import Article
from django.contrib.auth import get_user_model
from habarico import ModelAdmin
from habarico.config import EXPORT_ACTION
from habarico.export.views import ExportAdminModelViewSet
from habarico.export.wiring import compose_export_viewset
from habarico.schema.actions import ExportActionDescriptor, get_action_name
from habarico.schema.generators import ListViewSchemaGenerator, ShowViewSchemaGenerator
from habarico.views import AdminModelViewSet, AdminPermission
from rest_framework import status
from rest_framework.exceptions import MethodNotAllowed
from rest_framework.test import APIClient

BOM = "\ufeff"

DECLARED_EXPORT_ACTION = ExportActionDescriptor(format="csv", fields=["title"])


class DeclaredExportViewSet(ExportAdminModelViewSet):
    """Viewset of an application already serving the export."""


class DeclaredExportViewsetAdmin(ModelAdmin):
    """Admin declaring an export viewset itself - it must not be composed twice."""

    abstract = True
    model = Article
    name = "declared_export_viewset_article"
    fields = ["title"]
    can_read = True
    export_enabled = True
    base_viewset = DeclaredExportViewSet


class DeclaredExportActionAdmin(ModelAdmin):
    """Admin declaring an export action by hand - the derived one must not be added as a second."""

    abstract = True
    model = Article
    name = "declared_export_action_article"
    fields = ["title"]
    can_read = True
    export_enabled = True
    view_schema_generators = [ListViewSchemaGenerator(boxes=["title"], list_actions=[DECLARED_EXPORT_ACTION])]


class ReferencedExportActionAdmin(ModelAdmin):
    """Admin referencing an export action by name - the reference has to survive alone."""

    abstract = True
    model = Article
    name = "referenced_export_action_article"
    fields = ["title"]
    can_read = True
    export_enabled = True
    view_schema_generators = [ListViewSchemaGenerator(boxes=["title"], list_actions=["export"])]


class DeclaredListActionsAdmin(ModelAdmin):
    """Admin with list actions of its own - the export action is appended after them."""

    abstract = True
    model = Article
    name = "declared_list_actions_article"
    fields = ["title"]
    can_read = True
    export_enabled = True
    view_schema_generators = [ListViewSchemaGenerator(boxes=["title"], list_actions=["print"])]


@pytest.fixture
def staff_client(db):
    """API client authenticated as a staff user."""
    staff = get_user_model().objects.create_user(username="staff", password="x", is_staff=True)
    client = APIClient()
    client.force_authenticate(user=staff)
    return client


@pytest.fixture
def user_client(db):
    """API client authenticated as a plain user, so a refused permission answers 403, not 401."""
    user = get_user_model().objects.create_user(username="user", password="x")
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def articles(db, author, category):
    """One draft and one published article."""
    return [
        Article.objects.create(
            title=f"T{i}",
            slug=f"t{i}",
            content="c",
            status=Article.Status.DRAFT if i == 0 else Article.Status.PUBLISHED,
            author=author,
            category=category,
            view_count=i,
            priority=1.0,
        )
        for i in range(2)
    ]


def read_csv(response) -> list[list[str]]:
    """Decode a CSV export response into rows of cells."""
    text = response.content.decode("utf-8")
    return [line.split(",") for line in text[len(BOM) :].strip().split("\r\n")]


def get_list_view(schema: dict) -> dict:
    """Get the list view of a rendered resource schema."""
    list_views = [view for view in schema["views"] if view["type"] == "list"]
    assert len(list_views) == 1
    return list_views[0]


class TestExportEnabled:
    """``ModelAdmin.export_enabled`` is the only switch: a resource exports when its admin opts in."""

    def test_resource_does_not_export_out_of_the_box(self):
        assert UnconfiguredExportArticleAdmin().can_export(None) is False

    def test_admin_opts_in(self):
        assert ConfiguredExportArticleAdmin().can_export(None) is True

    def test_admin_opts_out(self):
        assert DisabledExportArticleAdmin().can_export(None) is False


class TestComposeExportViewset:
    """The composition puts the export behaviour in front of the viewset an admin already uses."""

    def test_composes_the_export_viewset_in_front(self):
        composed = compose_export_viewset(ExportAdminModelViewSet, PublishedOnlyAdminModelViewSet)
        assert issubclass(composed, ExportAdminModelViewSet)
        assert issubclass(composed, PublishedOnlyAdminModelViewSet)
        assert composed.__mro__.index(ExportAdminModelViewSet) < composed.__mro__.index(PublishedOnlyAdminModelViewSet)

    def test_keeps_a_viewset_that_already_exports(self):
        assert compose_export_viewset(AdminModelViewSet, ExportAdminModelViewSet) is ExportAdminModelViewSet

    def test_reuses_the_composed_viewset(self):
        """The composition runs per request, so it must not build a new class every time."""
        first = compose_export_viewset(ExportAdminModelViewSet, PublishedOnlyAdminModelViewSet)
        second = compose_export_viewset(ExportAdminModelViewSet, PublishedOnlyAdminModelViewSet)
        assert first is second

    def test_keeps_the_permission_classes_of_the_base_class(self):
        """What the application declares on its viewset must survive the composition."""
        composed = compose_export_viewset(ExportAdminModelViewSet, GuardedAdminModelViewSet)
        assert RefuseMarkedRequestsPermission in composed.permission_classes


class TestExportBaseViewset:
    """An exporting resource serves the export endpoint without dropping the viewset of the admin."""

    def test_uses_the_export_viewset_without_a_declared_one(self):
        assert issubclass(ConfiguredExportArticleAdmin().get_base_viewset(), ExportAdminModelViewSet)

    def test_keeps_the_default_viewset_class_without_a_declared_one(self, settings):
        """An extension contributes its viewset through DEFAULT_VIEWSET_CLASS - the export must
        compose onto it instead of replacing it."""
        settings.ADMIN_REST_FRAMEWORK = {
            **settings.ADMIN_REST_FRAMEWORK,
            "DEFAULT_VIEWSET_CLASS": "app.admin.PublishedOnlyAdminModelViewSet",
        }
        base_viewset = ConfiguredExportArticleAdmin().get_base_viewset()
        assert issubclass(base_viewset, ExportAdminModelViewSet)
        assert issubclass(base_viewset, PublishedOnlyAdminModelViewSet)

    def test_keeps_the_declared_base_viewset(self):
        base_viewset = CustomViewsetExportArticleAdmin().get_base_viewset()
        assert issubclass(base_viewset, ExportAdminModelViewSet)
        assert issubclass(base_viewset, PublishedOnlyAdminModelViewSet)

    def test_does_not_compose_an_export_viewset_twice(self):
        assert DeclaredExportViewsetAdmin().get_base_viewset() is DeclaredExportViewSet

    def test_resource_that_does_not_export_keeps_its_viewset(self):
        """Without the export there is no export endpoint at all, not just a hidden one."""
        assert UnconfiguredExportArticleAdmin().get_base_viewset() is None
        assert DisabledExportArticleAdmin().get_base_viewset() is None


def get_list_generators(admin, request, obj=None) -> list[ListViewSchemaGenerator]:
    """Get the list view generators out of the view schemas of an admin."""
    schemas = admin.get_view_schemas(request, obj)
    return [generator for generator in schemas if isinstance(generator, ListViewSchemaGenerator)]


class TestExportViewSchemas:
    """The export action is appended to the list views of an exporting admin."""

    def test_appends_the_export_action_to_the_default_list_view(self, mock_request):
        generators = get_list_generators(ConfiguredExportArticleAdmin(), mock_request)
        assert len(generators) == 1
        assert [get_action_name(action) for action in generators[0].list_actions] == ["export"]

    def test_keeps_the_class_and_configuration_of_the_declared_list_view(self, mock_request):
        generator = get_list_generators(DeclaredListExportArticleAdmin(), mock_request)[0]
        assert type(generator) is ColumnCountListViewSchemaGenerator
        assert generator.boxes == ["title", "status"]
        assert generator.default_sorting == "title"
        assert [get_action_name(action) for action in generator.list_actions] == ["export"]

    def test_does_not_mutate_the_declared_list_view(self, mock_request):
        """The declared generator is shared across requests - the action lands on its per-request copy."""
        DeclaredListExportArticleAdmin().get_view_schemas(mock_request)
        declared = DeclaredListExportArticleAdmin.view_schema_generators[1]
        assert declared.list_actions is None

    def test_a_declared_export_action_wins(self, mock_request):
        generator = get_list_generators(DeclaredExportActionAdmin(), mock_request)[0]
        assert generator.list_actions == [DECLARED_EXPORT_ACTION]

    def test_a_referenced_export_action_wins(self, mock_request):
        generator = get_list_generators(ReferencedExportActionAdmin(), mock_request)[0]
        assert generator.list_actions == ["export"]

    def test_appends_after_the_declared_list_actions(self, mock_request):
        generator = get_list_generators(DeclaredListActionsAdmin(), mock_request)[0]
        assert [get_action_name(action) for action in generator.list_actions] == ["print", "export"]

    def test_disabled_admin_gets_no_action(self, mock_request):
        generator = get_list_generators(DisabledExportArticleAdmin(), mock_request)[0]
        assert generator.list_actions is None

    def test_admin_that_does_not_opt_in_gets_no_action(self, mock_request):
        generator = get_list_generators(UnconfiguredExportArticleAdmin(), mock_request)[0]
        assert generator.list_actions is None


class TestExportSchema:
    """End to end: the rendered schema of an exporting admin carries the export action."""

    def test_list_schema_carries_the_export_action(self, db, api_client):
        response = api_client.get("/admin/configured_export_article/schema/")
        assert response.status_code == status.HTTP_200_OK

        list_actions = get_list_view(response.data)["list"]["list_actions"]
        assert len(list_actions) == 1
        assert list_actions[0]["name"] == "export"
        assert list_actions[0]["action"]["type"] == "export"
        assert list_actions[0]["action"]["export"] == {"format": ConfiguredExportArticleAdmin.export_formats[0]}

    def test_declared_list_view_exports_and_keeps_its_columns(self, db, api_client):
        response = api_client.get("/admin/declared_list_export_article/schema/")
        assert response.status_code == status.HTTP_200_OK

        list_view = get_list_view(response.data)["list"]
        assert [action["name"] for action in list_view["list_actions"]] == ["export"]
        # The columns come from the generator of the application, including its own get_boxes().
        assert [box["name"] for box in list_view["boxes"]] == ["title", "status", "view_count"]

    def test_disabled_admin_has_no_export_action(self, db, api_client):
        response = api_client.get("/admin/disabled_export_article/schema/")
        assert response.status_code == status.HTTP_200_OK
        assert "list_actions" not in get_list_view(response.data)["list"]

    def test_admin_that_does_not_decide_has_no_export_action(self, db, api_client):
        response = api_client.get("/admin/unconfigured_export_article/schema/")
        assert response.status_code == status.HTTP_200_OK
        assert "list_actions" not in get_list_view(response.data)["list"]


class TestExportEndpoint:
    """End to end: an exporting admin serves the export document."""

    def test_serves_the_export(self, api_client, articles):
        response = api_client.get("/admin/configured_export_article/export/?format=csv")
        assert response.status_code == status.HTTP_200_OK
        rows = read_csv(response)
        assert rows[0] == ["Title", "Status", "View count"]
        assert len(rows) == len(articles) + 1

    def test_export_respects_the_queryset_of_the_declared_base_viewset(self, api_client, articles):
        response = api_client.get("/admin/custom_viewset_export_article/export/?format=csv")
        assert response.status_code == status.HTTP_200_OK
        rows = read_csv(response)
        assert [row[1] for row in rows[1:]] == [Article.Status.PUBLISHED]

    def test_disabled_admin_has_no_export_endpoint(self, api_client, articles):
        response = api_client.get("/admin/disabled_export_article/export/?format=csv")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_admin_that_does_not_decide_has_no_export_endpoint(self, api_client, articles):
        response = api_client.get("/admin/unconfigured_export_article/export/?format=csv")
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestExportPerUser:
    """``can_export(request)`` gates both the export action and the endpoint per user."""

    def test_schema_hides_the_action_from_a_plain_user(self, db, api_client):
        response = api_client.get("/admin/staff_only_export_article/schema/")
        assert response.status_code == status.HTTP_200_OK
        assert "list_actions" not in get_list_view(response.data)["list"]

    def test_schema_shows_the_action_to_a_staff_user(self, staff_client):
        response = staff_client.get("/admin/staff_only_export_article/schema/")
        assert response.status_code == status.HTTP_200_OK
        list_actions = get_list_view(response.data)["list"]["list_actions"]
        assert [action["name"] for action in list_actions] == ["export"]

    def test_endpoint_refuses_a_plain_user(self, api_client, articles):
        response = api_client.get("/admin/staff_only_export_article/export/?format=csv")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_endpoint_serves_a_staff_user(self, staff_client, articles):
        response = staff_client.get("/admin/staff_only_export_article/export/?format=csv")
        assert response.status_code == status.HTTP_200_OK
        assert read_csv(response)[0] == ["Title", "Status"]


class TestExportViewsetPermissions:
    """Permissions declared on the base viewset of an application survive the export."""

    def test_list_keeps_the_permission_of_the_base_viewset(self, user_client, articles):
        response = user_client.get("/admin/guarded_viewset_export_article/", HTTP_X_REFUSE="1")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_export_keeps_the_permission_of_the_base_viewset(self, user_client, articles):
        response = user_client.get("/admin/guarded_viewset_export_article/export/?format=csv", HTTP_X_REFUSE="1")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_export_serves_a_request_the_base_viewset_allows(self, user_client, articles):
        response = user_client.get("/admin/guarded_viewset_export_article/export/?format=csv")
        assert response.status_code == status.HTTP_200_OK
        assert read_csv(response)[0] == ["Title", "Status"]

    def test_export_action_requires_the_read_permission(self, mock_request):
        """Exporting a resource is reading it, so AdminPermission maps the export action too."""

        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            can_read = False

        view = SimpleNamespace(action=EXPORT_ACTION, admin=_Admin())

        with pytest.raises(MethodNotAllowed):
            AdminPermission().has_permission(mock_request, view)

    def test_export_action_is_allowed_on_a_readable_resource(self, mock_request):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            can_read = True

        view = SimpleNamespace(action=EXPORT_ACTION, admin=_Admin())

        assert AdminPermission().has_permission(mock_request, view) is True


class TestExportActionLaziness:
    """The export action is built only where a list view renders it, from a shared generator."""

    def test_admin_without_a_list_view_does_not_consult_can_export(self, mock_request):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            name = "show_only_export_article"
            fields = ["title"]
            export_enabled = True
            view_schema_generators = [ShowViewSchemaGenerator()]

            def can_export(self, request):
                raise AssertionError("can_export() must not run for an admin without a list view")

        _Admin().get_view_schemas(mock_request)

    def test_default_generator_is_shared(self):
        admin = ConfiguredExportArticleAdmin()
        assert admin.get_export_action_schema_generator() is admin.get_export_action_schema_generator()


class TestExportImportGraph:
    """The export stays out of the import graph of a project that does not export."""

    def test_importing_habarico_does_not_load_the_export_machinery(self):
        """
        Django imports ``habarico`` while iterating INSTALLED_APPS, so the eager import chain of
        this package is what HAB-852 crashed on. ``habarico.admin`` needs the wiring helpers there,
        which must not drag the viewset and the renderers in with them.
        """
        code = textwrap.dedent("""
            import sys

            import django
            from django.conf import settings

            settings.configure(
                INSTALLED_APPS=["django.contrib.contenttypes", "django.contrib.auth", "habarico"],
                DATABASES={},
            )
            django.setup()

            import habarico  # noqa: F401

            watched = ("habarico.views", "habarico.export.views", "habarico.export.renderers")
            print(",".join(name for name in watched if name in sys.modules))
            """)
        result = subprocess.run(
            [sys.executable, "-c", code],
            capture_output=True,
            text=True,
            env={**os.environ, "PYTHONPATH": os.pathsep.join(path for path in sys.path if path)},
        )

        assert result.returncode == 0, result.stderr
        assert result.stdout.strip() == ""
