"""
Tests for Admin and ModelAdmin classes.
"""

import pytest
from app.admin import ArticleAdmin, ReadOnlyArticleAdmin
from app.models import Article
from habarico import site
from habarico.views import AdminModelViewSet
from rest_framework import serializers


class TestAdminBase:
    """Tests for AdminBase metaclass."""

    def test_admin_metaclass_registers_admin(self, db):
        """Test that AdminBase metaclass auto-registers admin classes."""
        assert site.exists_admin("category")
        assert site.exists_admin("article")

    def test_admin_metaclass_does_not_register_abstract(self):
        """Test that abstract admin classes are not registered."""
        assert not site.exists_admin("Admin")
        assert not site.exists_admin("ModelAdmin")


class TestModelAdmin:
    """Tests for ModelAdmin class."""

    def test_get_name_default(self, db):
        """Test default name generation from model."""
        admin = site.get_admin("category")
        assert admin.name == "category"

    def test_get_name_custom(self, db):
        """Test custom name override."""
        admin = site.get_admin("readonly_article")
        assert admin.name == "readonly_article"

    def test_get_label(self, db):
        """Test label generation from model verbose name."""
        admin = site.get_admin("category")
        assert admin.get_label() == "Categories"

    def test_get_label_plural(self, db):
        """Test plural label generation."""
        admin = site.get_admin("category")
        label = admin.get_label()
        assert label is not None

    def test_get_fields(self, db):
        """Test field list retrieval."""
        admin = site.get_admin("article")
        fields = admin.get_fields()
        assert "title" in fields
        assert "content" in fields
        assert "author" in fields

    def test_get_read_only_fields(self, db):
        """Test read-only field list."""
        admin = site.get_admin("article")
        ro_fields = admin.get_read_only_fields()
        assert "created_at" in ro_fields
        assert "updated_at" in ro_fields

    def test_get_search_fields(self, db):
        """Test search field list."""
        admin = site.get_admin("article")
        search_fields = admin.get_search_fields()
        assert "title" in search_fields
        assert "content" in search_fields

    def test_get_filter_fields(self, db):
        """Test filter field list."""
        admin = site.get_admin("article")
        filter_fields = admin.get_filter_fields()
        assert "status" in filter_fields
        assert "author" in filter_fields

    def test_get_ordering_fields(self, db):
        """Test ordering field list."""
        admin = site.get_admin("article")
        ordering = admin.get_ordering_fields()
        assert "title" in ordering
        assert "created_at" in ordering

    def test_permission_flags(self, db):
        """Test permission flag attributes."""
        assert ArticleAdmin.can_create is True
        assert ArticleAdmin.can_read is True
        assert ArticleAdmin.can_update is True
        assert ArticleAdmin.can_delete is True

        assert ReadOnlyArticleAdmin.can_create is False
        assert ReadOnlyArticleAdmin.can_read is True
        assert ReadOnlyArticleAdmin.can_update is False
        assert ReadOnlyArticleAdmin.can_delete is False

    def test_get_queryset(self, db, article):
        """Test queryset generation."""
        admin = site.get_admin("article")
        qs = admin.model.objects.all()
        assert qs.model == Article
        assert article in qs


class TestModelAdminViewSet:
    """Tests for ModelAdmin viewset generation."""

    def test_get_viewset(self, db):
        """Test viewset class generation."""
        admin = site.get_admin("article")
        viewset = admin.viewset
        assert issubclass(viewset, AdminModelViewSet)

    def test_get_viewset_queryset(self, db, article):
        """Test viewset queryset access."""
        admin = site.get_admin("article")
        viewset_class = admin.viewset
        viewset = viewset_class()
        viewset.request = None
        viewset.format_kwarg = None

        qs = viewset.get_queryset()
        assert article in qs


class TestModelAdminSerializer:
    """Tests for ModelAdmin serializer generation."""

    @staticmethod
    def _create_viewset_with_action(admin_name, action="list"):
        """Helper to create a viewset with action set."""
        admin = site.get_admin(admin_name)
        viewset = admin.viewset()
        viewset.action = action
        viewset.request = None
        viewset.format_kwarg = None
        viewset.kwargs = {}
        return viewset

    def test_get_serializer_class(self, db):
        """Test serializer class generation."""
        viewset = self._create_viewset_with_action("article")
        serializer_class = viewset.get_serializer_class()
        assert issubclass(serializer_class, serializers.ModelSerializer)

    def test_serializer_fields(self, db):
        """Test serializer has correct fields."""
        viewset = self._create_viewset_with_action("article")
        serializer_class = viewset.get_serializer_class()
        serializer = serializer_class()

        assert "title" in serializer.fields
        assert "content" in serializer.fields
        assert "author" in serializer.fields

    def test_serializer_read_only_fields(self, db):
        """Test serializer read-only fields."""
        viewset = self._create_viewset_with_action("article")
        serializer_class = viewset.get_serializer_class()
        serializer = serializer_class()

        assert serializer.fields["created_at"].read_only
        assert serializer.fields["updated_at"].read_only


class TestAdminSiteRegistration:
    """Tests for AdminSite registration."""

    def test_site_exists(self):
        """Test site singleton exists."""
        assert site is not None

    def test_registered_admins(self, db):
        """Test that test admins are registered."""
        assert site.exists_admin("category")
        assert site.exists_admin("article")

    def test_get_admin(self, db):
        """Test admin retrieval by name."""
        admin = site.get_admin("category")
        assert admin.name == "category"

    def test_get_admin_not_found(self):
        """Test admin retrieval for non-existent admin."""
        with pytest.raises(KeyError):
            site.get_admin("nonexistent_admin")


class TestListSearchHighlighting:
    """
    Match highlighting lives entirely in habarico_enterprise (``SearchViewSetMixin``, which
    contributes ``meta.highlights`` through ``AdminModelViewSet.get_extra_meta()``); core has no
    highlighting code path at all. These tests cover what a free-only install does instead -
    per-resource search keeps working, it just never adds a ``highlights`` key.
    """

    def test_core_has_no_highlighter_hooks(self, db):
        from habarico.views import AdminModelViewSet

        admin = site.get_admin("article")

        assert not hasattr(admin, "search_highlighter_class")
        assert not hasattr(admin, "get_search_highlighter")
        assert not hasattr(AdminModelViewSet, "get_meta_highlights")

    def _rows(self, response):
        payload = response.json()
        return payload["objects"] if isinstance(payload, dict) else payload

    def test_list_without_search_has_no_highlights_key(self, api_client, article):
        response = api_client.get("/admin/article/")
        assert response.status_code == 200
        row = self._rows(response)[0]
        assert "highlights" not in row["meta"]

    def test_list_with_search_but_no_highlighter_has_no_highlights_key(self, api_client, author, category):
        from app.models import Article

        Article.objects.create(
            title="Alpha article",
            slug="alpha",
            content="body",
            summary="s",
            status=Article.Status.DRAFT,
            author=author,
            category=category,
        )
        response = api_client.get("/admin/article/?search=alpha")
        assert response.status_code == 200
        row = self._rows(response)[0]
        assert row["title"] == "Alpha article"
        assert "highlights" not in row["meta"]


class TestSearchFilterChoicesAndBooleans:
    """DB-side search filter must resolve choice/boolean display labels to raw values."""

    def _make_article(self, **overrides):
        from app.models import Article, Author, Category

        author = Author.objects.create(name="A", email="a@a.cz", bio="", is_active=True)
        category = Category.objects.create(name="C")
        defaults = dict(
            title="X",
            slug="x",
            content="c",
            summary="s",
            status=Article.Status.PUBLISHED,
            author=author,
            category=category,
            view_count=1,
            rating=4.0,
            priority=1.0,
        )
        defaults.update(overrides)
        return Article.objects.create(**defaults)

    def _rows(self, response):
        payload = response.json()
        return payload["objects"] if isinstance(payload, dict) else payload

    def test_search_choice_field_matches_by_label(self, api_client, db):
        """The ArticleAdmin used in tests has search_fields=['title', 'content', 'summary'], so
        we verify `_q_for_field` directly with a choice field path."""
        from app.models import Article
        from habarico.filters import SearchFilter
        from habarico.utils import walk_to_leaf_field

        assert walk_to_leaf_field(Article, "status") is not None
        q = SearchFilter()._q_for_field(Article, "status", "Publ", "__icontains")
        # Publ matches 'Published' → raw value 'published' should be in the __in list.
        assert q == q.__class__(**{"status__in": ["published"]})

    def test_search_boolean_field_matches_yes(self, api_client, db):
        from app.models import Author
        from habarico.filters import SearchFilter

        f = SearchFilter()
        q = f._q_for_field(Author, "is_active", "Yes", "__icontains")
        assert q == q.__class__(**{"is_active__in": [True]})

    def test_search_boolean_field_no_match_returns_empty_in(self, db):
        from app.models import Author
        from habarico.filters import SearchFilter

        f = SearchFilter()
        # "zzz" matches neither Yes nor No → Q(pk__in=[]).
        q = f._q_for_field(Author, "is_active", "zzz", "__icontains")
        assert q == q.__class__(pk__in=[])

    def test_search_numeric_field_uses_plain_icontains(self, db):
        """DecimalField / MoneyField can't accept ``__unaccent__``; falls back to ``__icontains``."""
        from app.models import Product
        from habarico.filters import SearchFilter

        f = SearchFilter()
        q = f._q_for_field(Product, "price", "12", "__unaccent__icontains")
        assert q == q.__class__(**{"price__icontains": "12"})

    def test_search_char_field_keeps_unaccent_lookup(self, db):
        from app.models import Article
        from habarico.filters import SearchFilter

        f = SearchFilter()
        q = f._q_for_field(Article, "title", "alpha", "__unaccent__icontains")
        assert q == q.__class__(**{"title__unaccent__icontains": "alpha"})
