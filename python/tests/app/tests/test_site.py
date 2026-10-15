"""
Tests for AdminSite.
"""

import pytest
from habarico import site
from habarico.site import site as site_module


class TestAdminSiteRegistration:
    """Tests for AdminSite registration."""

    def test_site_singleton(self):
        """Test that site is a singleton."""
        assert site is site_module

    def test_register_admin(self, db):
        """Test admin registration."""
        assert site.exists_admin("category")
        assert site.exists_admin("article")
        assert site.exists_admin("author")
        assert site.exists_admin("product")

    def test_get_admin_existing(self, db):
        """Test retrieving existing admin."""
        admin = site.get_admin("category")
        assert admin.name == "category"

    def test_get_admin_nonexistent(self):
        """Test retrieving non-existent admin raises error."""
        with pytest.raises(KeyError):
            site.get_admin("nonexistent")

    def test_exists_admin(self, db):
        """Test exists_admin method."""
        assert site.exists_admin("category") is True
        assert site.exists_admin("nonexistent") is False


class TestAdminSiteURLs:
    """Tests for AdminSite URL configuration."""

    def test_urls_property(self, db):
        """Test that URLs are generated."""
        urls, namespace = site.urls
        assert urls is not None
        assert len(urls) > 0

    def test_urls_include_schema(self, db):
        """Test that schema URL is included."""
        urls, namespace = site.urls
        url_names = [getattr(url, "name", None) for url in urls]
        assert "admin-schema" in url_names


class TestAdminSiteIteration:
    """Tests for AdminSite iteration."""

    def test_iterate_admins(self, db):
        """Test iterating over registered admins."""
        admin_names = list(site._registry.keys())
        assert len(admin_names) > 0
        assert "category" in admin_names
        assert "article" in admin_names
