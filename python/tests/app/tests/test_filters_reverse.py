"""
Tests for the reverse-lookup filters ``_reverse_field`` and ``_reverse_filter`` (HAB-905).

These two filters are the only place where a client-supplied URL reaches ``clone_view``: the value
is ``<method>:<url-encoded path>:<field>`` and the backend clones the view behind that path to ask
its serializer (or filterset) which objects that field would accept. The cloned view therefore has
to be permission-checked, only habarico URLs may be resolved at all, and every rejection has to
look identical - otherwise the filter answers "does this record exist / does it belong to that
one" for resources the caller cannot see.
"""

from urllib.parse import quote_plus

import pytest
from app.models import Author
from django.contrib.auth import get_user_model
from habarico.utils import clone_view
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.request import Request
from rest_framework.test import APIClient, APIRequestFactory

User = get_user_model()

AUTHOR_URL = "/admin/author/"

#: What a rejected filter value comes back as. The filters raise ``ValidationError``; eluvia-base-
#: django's exception handler renders that as 422 rather than DRF's default 400.
REJECTED = status.HTTP_422_UNPROCESSABLE_ENTITY


def reverse_value(method: str, path: str, field: str) -> str:
    """Build a filter value the way the frontend does - see ``AdminPrimaryKeyRelatedField``."""
    return ":".join((method, quote_plus(path), field))


def error_body(response) -> dict:
    """Error payload without the per-response timestamp the error handler stamps on it."""
    payload = response.json()
    return {
        "errors": [{key: value for key, value in error.items() if key != "timestamp"} for error in payload["errors"]]
    }


def minted_reverse_filters(payload) -> list:
    """Every ``{"name": "_reverse_*", "value": ...}`` pair a schema response handed the client."""
    found = []
    stack = [payload]
    while stack:
        node = stack.pop()
        if isinstance(node, dict):
            name, value = node.get("name"), node.get("value")
            if isinstance(name, str) and name.startswith("_reverse") and isinstance(value, str):
                found.append((name, value))
            stack.extend(node.values())
        elif isinstance(node, list):
            stack.extend(node)
    return found


def returned_ids(response) -> set:
    """Ids in a list response, whether or not pagination kicked in."""
    payload = response.json()
    rows = payload["objects"] if isinstance(payload, dict) else payload
    return {row["id"] for row in rows}


@pytest.fixture
def user(db):
    return User.objects.create_user(username="alice", password="x")


@pytest.fixture
def anon_client():
    return APIClient()


@pytest.fixture
def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


class TestReverseFiltersWork:
    """The legitimate path has to keep working - the permission check must not cost the feature."""

    def test_reverse_field_narrows_to_what_the_article_form_accepts(self, anon_client, article, author):
        other = Author.objects.create(name="Other", email="other@test.com")

        response = anon_client.get(
            AUTHOR_URL, {"_reverse_field": reverse_value("get", f"/admin/article/{article.pk}/", "author")}
        )

        assert response.status_code == status.HTTP_200_OK
        # The article form accepts any author, so both come back - what matters is that the filter
        # resolved, cloned and applied the view instead of erroring out.
        assert {author.pk, other.pk} <= returned_ids(response)

    def test_reverse_filter_narrows_to_what_the_article_list_filters_by(self, anon_client, article, author):
        response = anon_client.get(AUTHOR_URL, {"_reverse_filter": reverse_value("get", "/admin/article/", "author")})

        assert response.status_code == status.HTTP_200_OK
        assert author.pk in returned_ids(response)


class TestNamespaceRestriction:
    """``clone_view`` may only resolve habarico URLs, not every route in the project."""

    def test_reverse_field_rejects_a_path_outside_the_habarico_namespace(self, anon_client, article):
        response = anon_client.get(AUTHOR_URL, {"_reverse_field": reverse_value("get", "/outside/article/", "author")})

        assert response.status_code == REJECTED

    def test_reverse_filter_rejects_a_path_outside_the_habarico_namespace(self, anon_client, article):
        response = anon_client.get(AUTHOR_URL, {"_reverse_filter": reverse_value("get", "/outside/article/", "author")})

        assert response.status_code == REJECTED


class TestMintedValuesStayAccepted:
    """
    The backend has to accept back every value it handed the client, or the restrictions above
    would have quietly broken the feature they are guarding.
    """

    def test_every_reverse_value_the_article_schema_mints_is_accepted(self, anon_client, article):
        schema = anon_client.get(f"/admin/article/{article.pk}/schema/")
        assert schema.status_code == status.HTTP_200_OK

        minted = minted_reverse_filters(schema.json())
        assert minted, "the article schema minted no reverse-lookup filter values to check"

        for name, value in minted:
            response = anon_client.get(AUTHOR_URL, {name: value})
            assert response.status_code == status.HTTP_200_OK, f"{name}={value} was rejected"

    def test_every_reverse_value_the_article_list_schema_mints_is_accepted(self, anon_client, article):
        schema = anon_client.get("/admin/article/schema/")
        assert schema.status_code == status.HTTP_200_OK

        minted = minted_reverse_filters(schema.json())
        assert minted, "the article list schema minted no reverse-lookup filter values to check"

        for name, value in minted:
            response = anon_client.get(AUTHOR_URL, {name: value})
            assert response.status_code == status.HTTP_200_OK, f"{name}={value} was rejected"


class TestPermissionCheck:
    """The cloned view goes through the same permission gate as a direct request would."""

    def test_reverse_field_rejects_a_resource_the_caller_cannot_read(self, anon_client, article):
        response = anon_client.get(
            AUTHOR_URL, {"_reverse_field": reverse_value("get", "/admin/noread_article/", "author")}
        )

        assert response.status_code == REJECTED

    def test_reverse_filter_rejects_a_resource_the_caller_cannot_read(self, anon_client, article):
        response = anon_client.get(
            AUTHOR_URL, {"_reverse_filter": reverse_value("get", "/admin/noread_article/", "author")}
        )

        assert response.status_code == REJECTED

    def test_reverse_field_rejects_an_anonymous_caller_on_a_protected_resource(self, anon_client, article):
        response = anon_client.get(
            AUTHOR_URL, {"_reverse_field": reverse_value("get", "/admin/authenticated_article/", "author")}
        )

        assert response.status_code == REJECTED

    def test_reverse_field_accepts_an_authenticated_caller_on_a_protected_resource(self, auth_client, article):
        response = auth_client.get(
            AUTHOR_URL, {"_reverse_field": reverse_value("get", "/admin/authenticated_article/", "author")}
        )

        assert response.status_code == status.HTTP_200_OK


class TestNoOracle:
    """Every rejection looks the same, so nothing can be learned from which one came back."""

    def test_reverse_field_does_not_reveal_whether_a_record_exists(self, anon_client, article):
        missing = anon_client.get(
            AUTHOR_URL, {"_reverse_field": reverse_value("get", "/admin/article/999999/", "author")}
        )
        forbidden = anon_client.get(
            AUTHOR_URL, {"_reverse_field": reverse_value("get", "/admin/noread_article/", "author")}
        )
        existing_but_forbidden = anon_client.get(
            AUTHOR_URL, {"_reverse_field": reverse_value("get", f"/admin/noread_article/{article.pk}/", "author")}
        )

        assert missing.status_code == forbidden.status_code == existing_but_forbidden.status_code
        assert error_body(missing) == error_body(forbidden) == error_body(existing_but_forbidden)

    def test_reverse_field_does_not_reveal_an_unresolvable_path(self, anon_client, article):
        unresolvable = anon_client.get(AUTHOR_URL, {"_reverse_field": reverse_value("get", "/nope/", "author")})
        forbidden = anon_client.get(
            AUTHOR_URL, {"_reverse_field": reverse_value("get", "/admin/noread_article/", "author")}
        )

        assert unresolvable.status_code == forbidden.status_code
        assert error_body(unresolvable) == error_body(forbidden)


class TestClonedRequestIdentity:
    """
    The permission check is only worth anything if the cloned request still knows who is asking.

    ``clone_django_request`` builds a bare ``HttpRequest``, and ``SessionAuthentication`` reads the
    user off exactly that object - so the identity has to be carried over explicitly rather than
    left to whether ``request.user`` happened to be evaluated before the filter ran.
    """

    def test_cloned_view_keeps_the_session_authenticated_user(self, db, user, article):
        wsgi_request = APIRequestFactory().get("/admin/article/")
        # What AuthenticationMiddleware would have done.
        wsgi_request.user = user
        request = Request(wsgi_request, authenticators=[SessionAuthentication()])

        view = clone_view("get", request, f"/admin/article/{article.pk}/")

        assert view is not None
        assert view.request.user == user


class TestCloneViewNamespace:
    """Unit-level counterpart to the HTTP tests above."""

    def test_clone_view_refuses_a_path_outside_the_habarico_namespace(self, db, article):
        request = Request(APIRequestFactory().get("/admin/article/"))

        assert clone_view("get", request, "/outside/article/") is None

    def test_clone_view_resolves_a_habarico_path(self, db, article):
        request = Request(APIRequestFactory().get("/admin/article/"))

        assert clone_view("get", request, "/admin/article/") is not None
