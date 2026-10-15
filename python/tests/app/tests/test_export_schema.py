"""Tests for the export action schema generator (HAB-534)."""

import pytest
from app.admin import ConfiguredExportArticleAdmin
from habarico.export.generators import ExportActionDescriptorGenerator
from habarico.schema.actions import ExportActionDescriptor, get_action_name
from habarico.schema.types import ColorType
from rest_framework import status


class FakeAdmin:
    """Stand-in for a ``ModelAdmin`` carrying nothing but the export configuration."""

    export_enabled = False
    export_fields = None
    export_formats = None

    def __init__(self, **config):
        for name, value in config.items():
            setattr(self, name, value)

    def can_export(self, request):
        return bool(self.export_enabled)


@pytest.fixture
def admin():
    """Admin offering XLSX first, so the default format is not the first registered one."""
    return FakeAdmin(export_enabled=True, export_formats=["xlsx", "csv"], export_fields=["title", "status"])


def build_action(generator: ExportActionDescriptorGenerator, admin) -> dict | None:
    """Render the descriptor the generator builds for the admin."""
    descriptor = generator.bind(admin=admin).get_schema()
    return descriptor.to_dict() if descriptor else None


class TestExportActionDescriptorGenerator:
    """The generator turns the export configuration of an admin into an action descriptor."""

    def test_builds_export_action_descriptor(self, admin):
        descriptor = ExportActionDescriptorGenerator().bind(admin=admin).get_schema()
        assert isinstance(descriptor, ExportActionDescriptor)

    def test_action_defaults(self, admin):
        data = build_action(ExportActionDescriptorGenerator(), admin)
        assert data["name"] == "export"
        assert data["label"] == "Export"
        assert data["icon"] == "GetApp"
        assert data["action"]["type"] == "export"

    def test_format_defaults_to_first_offered_format(self, admin):
        data = build_action(ExportActionDescriptorGenerator(), admin)
        assert data["action"]["export"] == {"format": "xlsx"}

    def test_format_defaults_to_the_first_registered_format_without_admin_formats(self):
        data = build_action(ExportActionDescriptorGenerator(), FakeAdmin(export_enabled=True))
        assert data["action"]["export"] == {"format": "csv"}

    def test_format_can_be_overridden(self, admin):
        data = build_action(ExportActionDescriptorGenerator(format="csv"), admin)
        assert data["action"]["export"] == {"format": "csv"}

    def test_fields_are_left_to_the_endpoint(self, admin):
        """The columns stay a backend detail - the action must not repeat ``export_fields``."""
        data = build_action(ExportActionDescriptorGenerator(), admin)
        assert "fields" not in data["action"]["export"]

    def test_fields_can_be_requested_explicitly(self, admin):
        data = build_action(ExportActionDescriptorGenerator(fields=["title"]), admin)
        assert data["action"]["export"]["fields"] == ["title"]

    def test_presentation_can_be_overridden(self, admin):
        generator = ExportActionDescriptorGenerator(
            name="download", label="Download", icon="Download", color=ColorType.PRIMARY
        )
        data = build_action(generator, admin)
        assert data["name"] == "download"
        assert data["label"] == "Download"
        assert data["icon"] == "Download"
        assert data["color"] == ColorType.PRIMARY

    def test_no_action_without_export_enabled(self):
        assert ExportActionDescriptorGenerator().bind(admin=FakeAdmin()).get_schema() is None

    def test_unbound_generator_fails_loudly(self):
        """Using the generator without ``bind(admin=...)`` is a programming error, not an empty action."""
        with pytest.raises(ValueError, match="not bound"):
            ExportActionDescriptorGenerator().get_schema()

    def test_can_render_follows_export_enabled(self, admin):
        assert ExportActionDescriptorGenerator().bind(admin=admin).can_render() is True
        assert ExportActionDescriptorGenerator().bind(admin=FakeAdmin(export_enabled=False)).can_render() is False

    def test_can_render_asks_the_admin_with_the_bound_request(self, mock_request):
        """An admin declaring ``can_export`` decides per request."""
        seen = []

        def can_export(request):
            seen.append(request)
            return False

        generator = ExportActionDescriptorGenerator().bind(admin=FakeAdmin(can_export=can_export), request=mock_request)
        assert generator.can_render() is False
        assert seen == [mock_request]

    def test_bound_generator_does_not_mutate_the_declared_one(self, admin):
        generator = ExportActionDescriptorGenerator()
        generator.bind(admin=admin)
        with pytest.raises(ValueError, match="not bound"):
            generator.get_admin()
        assert generator.get_request() is None


class TestExportListViewSchemaEndpoint:
    """End to end: the rendered list view schema carries the derived export action."""

    def test_list_schema_emits_the_export_action(self, db, api_client):
        response = api_client.get("/admin/configured_export_article/schema/")
        assert response.status_code == status.HTTP_200_OK

        list_views = [view for view in response.data["views"] if view["type"] == "list"]
        assert len(list_views) == 1
        list_actions = list_views[0]["list"]["list_actions"]
        assert len(list_actions) == 1

        export_action = list_actions[0]
        assert export_action["name"] == "export"
        assert export_action["label"] == "Export"
        assert export_action["icon"] == "GetApp"
        assert export_action["action"]["type"] == "export"
        assert export_action["action"]["export"] == {"format": ConfiguredExportArticleAdmin.export_formats[0]}

    def test_export_endpoint_serves_the_advertised_format(self, db, api_client, article):
        """The advertised format has to be the one the endpoint serves without a format parameter."""
        response = api_client.get("/admin/configured_export_article/export/")
        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"].startswith("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")


class TestGetActionName:
    """``get_action_name`` normalizes both entry forms of an actions slot."""

    def test_name_of_a_plain_string(self):
        assert get_action_name("export") == "export"

    def test_name_of_a_descriptor(self):
        assert get_action_name(ExportActionDescriptor()) == "export"

    def test_name_of_an_unnamed_value(self):
        assert get_action_name(object()) is None
