"""
Tests for the ordering of an admin list endpoint (HAB-915).

A list used to answer a request without ``order_by`` in whatever order the queryset already had -
the model's ``Meta.ordering``, or none at all. It is now ordered by the resource's own
``default_sorting``, applied in ``AdminModelViewSet.get_queryset``. The tiebreaker behind it comes
from ``eluvia_base_django``'s ``OrderingFilter`` (2.3.2); it is exercised here because habarico's
own defaults have to survive it.
"""

from types import SimpleNamespace

import pytest
from app.admin import ArticleAdmin
from app.models import Article
from eluvia_base_django.rest_framework.filters import OrderingFilter, order_term_name
from habarico.schema import Sorting
from habarico.schema.generators import ListViewSchemaGenerator
from habarico.schema.types import SortDirectionType
from rest_framework import status

LIST_URL = "/admin/article/"


def generator_context_of(admin) -> SimpleNamespace:
    """The two things a view schema generator reads to reach its admin with the request."""
    return SimpleNamespace(resource=SimpleNamespace(admin=admin), request=None)


@pytest.fixture
def articles(db, author, category):
    """Create listable articles from the titles given, oldest first."""

    def _create(*titles, **fields):
        return [
            Article.objects.create(
                title=title,
                slug=f"article-{index}",
                content="Content",
                status=Article.Status.DRAFT,
                author=author,
                category=category,
                **fields,
            )
            for index, title in enumerate(titles)
        ]

    return _create


def titles(response) -> list[str]:
    """Titles of the listed objects, in the order they came back."""
    return [obj["title"] for obj in response.json()["objects"]]


class TestDefaultSorting:
    """Which order a request without ``order_by`` is answered in."""

    def test_model_ordering_survives_without_a_declared_default(self, api_client, articles):
        """An admin declaring nothing leaves ``Meta.ordering`` (``-created_at``) in place."""
        articles("First", "Second", "Third")

        response = api_client.get(LIST_URL)

        assert response.status_code == status.HTTP_200_OK
        assert titles(response) == ["Third", "Second", "First"]

    def test_admin_default_sorting_orders_the_list(self, api_client, articles, monkeypatch):
        articles("Charlie", "Alpha", "Bravo")
        monkeypatch.setattr(ArticleAdmin, "default_sorting", "title")

        assert titles(api_client.get(LIST_URL)) == ["Alpha", "Bravo", "Charlie"]

    def test_a_django_style_minus_sorts_descending(self, api_client, articles, monkeypatch):
        articles("Charlie", "Alpha", "Bravo")
        monkeypatch.setattr(ArticleAdmin, "default_sorting", "-title")

        assert titles(api_client.get(LIST_URL)) == ["Charlie", "Bravo", "Alpha"]

    def test_a_sorting_descriptor_is_accepted_too(self, api_client, articles, monkeypatch):
        articles("Charlie", "Alpha", "Bravo")
        monkeypatch.setattr(
            ArticleAdmin,
            "default_sorting",
            Sorting(field_name="title", direction=SortDirectionType.DESC),
        )

        assert titles(api_client.get(LIST_URL)) == ["Charlie", "Bravo", "Alpha"]

    def test_order_by_wins_over_the_default(self, api_client, articles, monkeypatch):
        articles("Charlie", "Alpha", "Bravo")
        monkeypatch.setattr(ArticleAdmin, "default_sorting", "-title")

        assert titles(api_client.get(LIST_URL, {"order_by": "title:asc"})) == ["Alpha", "Bravo", "Charlie"]

    def test_the_default_is_resolved_per_request(self, api_client, articles, monkeypatch):
        """``get_default_sorting`` is the hook, so a rule that depends on the request is an override."""
        articles("Charlie", "Alpha", "Bravo")
        monkeypatch.setattr(ArticleAdmin, "get_default_sorting", lambda self, request=None: "-title")

        assert titles(api_client.get(LIST_URL)) == ["Charlie", "Bravo", "Alpha"]

    def test_a_blank_order_by_is_read_as_absent(self, api_client, articles, monkeypatch):
        articles("Charlie", "Alpha", "Bravo")
        monkeypatch.setattr(ArticleAdmin, "default_sorting", "title")

        assert titles(api_client.get(LIST_URL, {"order_by": ""})) == ["Alpha", "Bravo", "Charlie"]


class TestWhatTheSchemaAdvertises:
    """``ordering_fields`` must not refuse the ordering the resource's own schema asks for."""

    def test_the_default_sorting_is_accepted_without_being_an_ordering_field(self, api_client, articles, monkeypatch):
        # ArticleAdmin declares ordering_fields without `published_at`.
        articles("Alpha", "Bravo")
        monkeypatch.setattr(ArticleAdmin, "default_sorting", "-published_at")

        response = api_client.get(LIST_URL, {"order_by": "published_at:desc"})

        assert response.status_code == status.HTTP_200_OK

    def test_the_primary_key_is_accepted(self, api_client, articles):
        """``serializeOrderBy`` falls back to the primary key for a list with no sorting of its own."""
        articles("Alpha", "Bravo")

        response = api_client.get(LIST_URL, {"order_by": "id:asc"})

        assert response.status_code == status.HTTP_200_OK
        assert titles(response) == ["Alpha", "Bravo"]

    def test_an_undeclared_field_is_still_refused(self, api_client, articles):
        articles("Alpha")

        response = api_client.get(LIST_URL, {"order_by": "slug:asc"})

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert [error["source"] for error in response.json()["errors"]] == ["order_by__slug"]


class TestTiebreaker:
    """Records that compare equal must not swap places between two pages of the same list."""

    def test_records_tying_on_the_sorted_field_are_paged_without_loss(self, api_client, articles):
        created = articles("D", "C", "B", "A", view_count=0)

        first = api_client.get(LIST_URL, {"order_by": "view_count:asc", "limit": 2, "offset": 0})
        second = api_client.get(LIST_URL, {"order_by": "view_count:asc", "limit": 2, "offset": 2})

        paged = [obj["id"] for obj in first.json()["objects"] + second.json()["objects"]]
        assert paged == sorted(article.pk for article in created)

    def test_the_primary_key_is_not_ordered_by_twice(self, db):
        ordered = OrderingFilter().with_tiebreaker(Article.objects.order_by("id"))

        assert [order_term_name(term) for term in ordered.query.order_by] == ["id"]

    def test_the_tiebreaker_is_appended_behind_the_model_ordering(self, db):
        ordered = OrderingFilter().with_tiebreaker(Article.objects.all())

        assert [order_term_name(term) for term in ordered.query.order_by] == ["created_at", "id"]


class TestListViewSchema:
    """What the frontend is told to open the list sorted by."""

    def test_the_list_view_publishes_the_admin_default(self, api_client, article, monkeypatch):
        monkeypatch.setattr(ArticleAdmin, "default_sorting", "-title")

        response = api_client.get("/admin/article/schema/")

        list_view = next(view for view in response.json()["views"] if view["type"] == "list")
        assert list_view["list"]["default_sorting"] == {"field_name": "title", "direction": "desc"}

    def test_a_view_declaring_its_own_sorting_keeps_it(self, db, monkeypatch):
        """The view is the narrower declaration, so the resource default does not overrule it."""
        monkeypatch.setattr(ArticleAdmin, "default_sorting", "-title")
        generator = ListViewSchemaGenerator(default_sorting="view_count")
        generator.context = generator_context_of(ArticleAdmin())

        assert generator.get_default_sorting() == "view_count"

    def test_a_view_declaring_nothing_takes_the_resource_default(self, db, monkeypatch):
        monkeypatch.setattr(ArticleAdmin, "default_sorting", "-title")
        generator = ListViewSchemaGenerator()
        generator.context = generator_context_of(ArticleAdmin())

        assert generator.get_default_sorting() == "-title"

    def test_a_generator_standing_on_its_own_publishes_nothing(self):
        """No context at all - a generator instantiated outside a request still answers."""
        assert ListViewSchemaGenerator().get_default_sorting() is None
