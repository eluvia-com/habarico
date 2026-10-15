"""
Tests for ViewSets and Views.

Note: Full integration tests require a properly configured Django environment
with all dependencies. These tests focus on unit testing the core functionality.
"""

from app.admin import ReadOnlyArticleAdmin
from habarico import site


def create_viewset_with_action(admin_name, action="list"):
    """Helper to create a viewset with required attributes set."""
    admin = site.get_admin(admin_name)
    viewset = admin.viewset()
    viewset.action = action
    viewset.request = None
    viewset.format_kwarg = None
    viewset.kwargs = {}
    return viewset


class TestAdminModelViewSet:
    """Tests for AdminModelViewSet core functionality."""

    def test_viewset_exists(self, db):
        """Test viewset is properly configured."""
        admin = site.get_admin("article")
        viewset = admin.viewset
        assert viewset is not None

    def test_viewset_queryset(self, db, article):
        """Test viewset queryset access."""
        admin = site.get_admin("article")
        viewset_class = admin.viewset
        viewset = viewset_class()
        viewset.request = None
        viewset.format_kwarg = None

        qs = viewset.get_queryset()
        assert article in qs

    def test_viewset_serializer_class(self, db):
        """Test viewset serializer class."""
        viewset = create_viewset_with_action("article")
        serializer_class = viewset.get_serializer_class()
        assert serializer_class is not None


class TestReadOnlyAdmin:
    """Tests for read-only admin permissions."""

    def test_readonly_permissions(self, db):
        """Test read-only admin has correct permissions."""
        assert ReadOnlyArticleAdmin.can_create is False
        assert ReadOnlyArticleAdmin.can_read is True
        assert ReadOnlyArticleAdmin.can_update is False
        assert ReadOnlyArticleAdmin.can_delete is False


class TestSchemaEndpoints:
    """Tests for schema endpoint configuration."""

    def test_schema_view_configured(self, db):
        """Test schema view is in URL configuration."""
        urls, namespace = site.urls
        url_names = [getattr(url, "name", None) for url in urls]
        assert "admin-schema" in url_names


class TestUUIDModelAdmin:
    """Tests for admin with UUID primary key."""

    def test_uuid_admin_registered(self, db):
        """Test UUID model admin is registered."""
        assert site.exists_admin("product")

    def test_uuid_admin_viewset(self, db):
        """Test UUID model admin has viewset."""
        admin = site.get_admin("product")
        viewset = admin.viewset
        assert viewset is not None

    def test_uuid_model_queryset(self, db, product):
        """Test UUID model queryset access."""
        admin = site.get_admin("product")
        viewset_class = admin.viewset
        viewset = viewset_class()
        viewset.request = None
        viewset.format_kwarg = None

        qs = viewset.get_queryset()
        assert product in qs
