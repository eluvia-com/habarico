"""
Tests for ``habarico.pagination.AdminModelPagination`` (HAB-946).

The page size of an admin list endpoint resolves through three layers, the first one with an
opinion winning: the ``ModelAdmin`` being listed, the project's ``ADMIN_REST_FRAMEWORK`` block,
and what ``eluvia_base_django`` itself resolves (its Django settings, then its class attributes).
Each test below pins one link of that chain, or the 422 an out-of-range ``limit`` now gets
instead of being silently truncated.
"""

import pytest
from app.admin import ArticleAdmin
from app.models import Article
from habarico.pagination import AdminModelPagination
from rest_framework import status

LIST_URL = "/admin/article/"


@pytest.fixture
def admin_settings(settings):
    """Merge keys into ``ADMIN_REST_FRAMEWORK`` without dropping what the test project sets."""

    def _override(**overrides):
        settings.ADMIN_REST_FRAMEWORK = {**settings.ADMIN_REST_FRAMEWORK, **overrides}

    return _override


@pytest.fixture
def articles(db, author, category):
    """Create as many listable articles as a test needs."""

    def _create(count):
        return [
            Article.objects.create(
                title=f"Article {index}",
                slug=f"article-{index}",
                content="Content",
                status=Article.Status.DRAFT,
                author=author,
                category=category,
            )
            for index in range(count)
        ]

    return _create


def error_sources(response) -> list[str]:
    """Field names the error envelope blames, e.g. ``["limit"]``."""
    return [error["source"] for error in response.json()["errors"]]


class TestDefaultLimitResolution:
    """Which page size a request without a ``limit`` parameter gets."""

    def test_falls_back_to_twenty_without_any_setting(self, api_client, articles):
        """Nothing configured anywhere - habarico paginates instead of raising."""
        articles(25)

        response = api_client.get(LIST_URL)

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["meta"]["limit"] == 20
        assert len(response.json()["objects"]) == 20

    def test_django_setting_is_used(self, api_client, articles, settings):
        articles(10)
        settings.DEFAULT_PAGE_LIMIT = 7

        response = api_client.get(LIST_URL)

        assert response.json()["meta"]["limit"] == 7

    def test_admin_rest_framework_setting_wins_over_django_setting(
        self, api_client, articles, settings, admin_settings
    ):
        articles(10)
        settings.DEFAULT_PAGE_LIMIT = 7
        admin_settings(DEFAULT_PAGE_LIMIT=4)

        response = api_client.get(LIST_URL)

        assert response.json()["meta"]["limit"] == 4

    def test_admin_attribute_wins_over_settings(self, api_client, articles, monkeypatch, admin_settings):
        articles(10)
        admin_settings(DEFAULT_PAGE_LIMIT=4)
        monkeypatch.setattr(ArticleAdmin, "default_page_limit", 3)

        response = api_client.get(LIST_URL)

        assert response.json()["meta"]["limit"] == 3
        assert len(response.json()["objects"]) == 3

    def test_requested_limit_wins_over_every_default(self, api_client, articles, monkeypatch):
        articles(10)
        monkeypatch.setattr(ArticleAdmin, "default_page_limit", 3)

        response = api_client.get(LIST_URL, {"limit": 6})

        assert response.json()["meta"]["limit"] == 6

    def test_meta_only_limit_returns_no_objects(self, api_client, articles):
        """``limit=0`` is a deliberate value - the meta block without the objects."""
        articles(5)

        response = api_client.get(LIST_URL, {"limit": 0})

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["objects"] == []
        assert response.json()["meta"] == {"total_count": 5, "limit": 0, "offset": 0}


class TestMaxLimitResolution:
    """The upper bound of the ``limit`` query parameter, and what exceeding it does."""

    def test_library_default_cap_applies_without_configuration(self, api_client, articles):
        articles(1)

        response = api_client.get(LIST_URL, {"limit": 1001})

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert error_sources(response) == ["limit"]

    def test_limit_at_the_cap_is_accepted(self, api_client, articles, monkeypatch):
        articles(3)
        monkeypatch.setattr(ArticleAdmin, "max_page_limit", 5)

        response = api_client.get(LIST_URL, {"limit": 5})

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["meta"]["limit"] == 5

    def test_limit_above_the_admin_cap_is_rejected(self, api_client, articles, monkeypatch):
        articles(3)
        monkeypatch.setattr(ArticleAdmin, "max_page_limit", 5)

        response = api_client.get(LIST_URL, {"limit": 6})

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert error_sources(response) == ["limit"]
        assert "5" in response.json()["errors"][0]["message"]

    def test_admin_cap_wins_over_admin_rest_framework_setting(self, api_client, articles, monkeypatch, admin_settings):
        articles(3)
        admin_settings(MAX_PAGE_LIMIT=100)
        monkeypatch.setattr(ArticleAdmin, "max_page_limit", 5)

        response = api_client.get(LIST_URL, {"limit": 50})

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_admin_rest_framework_setting_caps_admins_without_their_own(self, api_client, articles, admin_settings):
        articles(3)
        admin_settings(MAX_PAGE_LIMIT=10)

        assert api_client.get(LIST_URL, {"limit": 10}).status_code == status.HTTP_200_OK
        assert api_client.get(LIST_URL, {"limit": 11}).status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_explicit_none_setting_removes_the_cap(self, api_client, articles, admin_settings):
        articles(3)
        admin_settings(MAX_PAGE_LIMIT=None)

        response = api_client.get(LIST_URL, {"limit": 100000})

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["meta"]["limit"] == 100000


class TestInvalidLimit:
    """Values that are not a page size at all. A missing one still falls back to the default."""

    @pytest.mark.parametrize("limit", ["abc", "-1", "1.5"])
    def test_unusable_limit_is_rejected(self, api_client, articles, limit):
        articles(3)

        response = api_client.get(LIST_URL, {"limit": limit})

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert error_sources(response) == ["limit"]

    def test_empty_limit_falls_back_to_the_default(self, api_client, articles):
        articles(3)

        response = api_client.get(LIST_URL, {"limit": ""})

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["meta"]["limit"] == 20


class TestPaginatorOutsideAView:
    """Direct instantiation, where there is no view and therefore no admin to ask."""

    def test_settings_resolve_without_a_view(self, db, admin_settings):
        admin_settings(DEFAULT_PAGE_LIMIT=6, MAX_PAGE_LIMIT=60)

        paginator = AdminModelPagination()

        assert paginator.view is None
        assert paginator.get_default_limit(request=None) == 6
        assert paginator.get_max_limit(request=None) == 60

    def test_library_defaults_apply_without_a_view(self, db):
        """Neither Django setting is defined in this project, so both fall through to the
        ``default_limit`` / ``max_limit`` class attributes of ``eluvia_base_django``."""
        paginator = AdminModelPagination()

        assert paginator.get_default_limit(request=None) == 20
        assert paginator.get_max_limit(request=None) == 1000

    def test_constructor_arguments_win_over_settings(self, db, admin_settings):
        admin_settings(DEFAULT_PAGE_LIMIT=6, MAX_PAGE_LIMIT=60)

        paginator = AdminModelPagination(default_limit=7, max_limit=9)

        assert paginator.get_default_limit(request=None) == 7
        assert paginator.get_max_limit(request=None) == 9

    def test_explicit_none_max_limit_is_kept(self, db, admin_settings):
        admin_settings(MAX_PAGE_LIMIT=60)

        paginator = AdminModelPagination(max_limit=None)

        assert paginator.get_max_limit(request=None) is None
