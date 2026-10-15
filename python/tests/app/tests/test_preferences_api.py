import pytest
from django.contrib.auth import get_user_model
from django.test import override_settings
from habarico.contrib.preferences import register_preference
from habarico.contrib.preferences.models import UserPreference
from habarico.contrib.preferences.registry import preferences, register_preference_pattern
from habarico.contrib.preferences.schemas import (
    ColumnsPreference,
    SavedQueriesPreference,
    ThemePreference,
)
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()

LIST_URL = "/admin/user-preferences/"
DETAIL_URL_TEMPLATE = "/admin/user-preferences/{key}/"


@pytest.fixture
def alice(db):
    return User.objects.create_user(username="alice", password="x")


@pytest.fixture
def bob(db):
    return User.objects.create_user(username="bob", password="x")


@pytest.fixture
def client(alice):
    c = APIClient()
    c.force_authenticate(user=alice)
    return c


@pytest.fixture
def bob_client(bob):
    c = APIClient()
    c.force_authenticate(user=bob)
    return c


@pytest.fixture
def anon_client():
    return APIClient()


@pytest.fixture(autouse=True)
def _clear_registry():
    preferences._clear()
    yield
    preferences._clear()


def detail_url(key: str) -> str:
    return DETAIL_URL_TEMPLATE.format(key=key)


class TestDetailGet:
    def test_returns_stored_value(self, client, alice):
        register_preference("theme", schema=ThemePreference, default="light")
        UserPreference.objects.create(user=alice, key="theme", value="dark")

        response = client.get(detail_url("theme"))

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert body["key"] == "theme"
        assert body["value"] == "dark"
        assert body["updated_at"] is not None

    def test_returns_default_with_null_updated_at_when_unset(self, client):
        register_preference("theme", schema=ThemePreference, default="light")

        response = client.get(detail_url("theme"))

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert body == {"key": "theme", "value": "light", "updated_at": None}

    def test_unregistered_key_returns_404(self, client):
        response = client.get(detail_url("not_registered"))
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_invalid_stored_value_returns_default_and_cleans_db(self, client, alice):
        UserPreference.objects.create(user=alice, key="theme", value="sepia")
        register_preference("theme", schema=ThemePreference, default="light")

        response = client.get(detail_url("theme"))

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert body["value"] == "light"
        assert body["updated_at"] is None
        assert not UserPreference.objects.filter(user=alice, key="theme").exists()

    def test_anonymous_request_is_rejected(self, anon_client):
        register_preference("theme", schema=ThemePreference, default="light")
        response = anon_client.get(detail_url("theme"))
        assert response.status_code in {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN}

    def test_isolation_between_users(self, client, bob_client, alice, bob):
        register_preference("theme", schema=ThemePreference, default="light")
        UserPreference.objects.create(user=alice, key="theme", value="dark")
        UserPreference.objects.create(user=bob, key="theme", value="light")

        alice_value = client.get(detail_url("theme")).json()["value"]
        bob_value = bob_client.get(detail_url("theme")).json()["value"]

        assert alice_value == "dark"
        assert bob_value == "light"

    def test_dotted_key_without_stored_returns_404(self, client):
        register_preference_pattern(r"[a-z][a-zA-Z0-9_.]*\.columns", schema=ColumnsPreference)

        response = client.get(detail_url("product.columns"))

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_dotted_key_with_stored_returns_value(self, client, alice):
        register_preference_pattern(r"[a-z][a-zA-Z0-9_.]*\.columns", schema=ColumnsPreference)
        UserPreference.objects.create(user=alice, key="product.columns", value=["name"])

        response = client.get(detail_url("product.columns"))

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["value"] == ["name"]

    @pytest.mark.parametrize(
        "invalid_key_in_url",
        ["2foo", "_foo", "foo-bar"],
    )
    def test_invalid_key_url_does_not_match_route(self, client, invalid_key_in_url):
        response = client.get(detail_url(invalid_key_in_url))
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_uppercase_first_letter_in_key_is_accepted_by_route(self, client):
        register_preference("Theme", schema=ThemePreference, default="light")

        response = client.get(detail_url("Theme"))

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["value"] == "light"


class TestDetailPut:
    def test_put_valid_value_stores_and_returns_item(self, client, alice):
        register_preference("theme", schema=ThemePreference, default="light")

        response = client.put(detail_url("theme"), data="dark", format="json")

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert body["key"] == "theme"
        assert body["value"] == "dark"
        assert body["updated_at"] is not None
        assert UserPreference.objects.get(user=alice, key="theme").value == "dark"

    def test_put_overwrites_existing_value(self, client, alice):
        register_preference("theme", schema=ThemePreference, default="light")
        UserPreference.objects.create(user=alice, key="theme", value="dark")

        response = client.put(detail_url("theme"), data="light", format="json")

        assert response.status_code == status.HTTP_200_OK
        assert UserPreference.objects.get(user=alice, key="theme").value == "light"

    def test_put_schema_mismatch_returns_422_with_error_envelope(self, client, alice):
        register_preference("theme", schema=ThemePreference, default="light")

        response = client.put(detail_url("theme"), data="sepia", format="json")

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        body = response.json()
        assert "errors" in body
        assert body["errors"][0]["status"] == 422
        assert not UserPreference.objects.filter(user=alice, key="theme").exists()

    def test_put_unregistered_key_returns_404(self, client):
        response = client.put(detail_url("not_registered"), data="x", format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_put_anonymous_request_rejected(self, anon_client):
        register_preference("theme", schema=ThemePreference, default="light")
        response = anon_client.put(detail_url("theme"), data="dark", format="json")
        assert response.status_code in {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN}

    def test_put_isolation(self, client, bob_client, alice, bob):
        register_preference("theme", schema=ThemePreference, default="light")
        client.put(detail_url("theme"), data="dark", format="json")
        bob_client.put(detail_url("theme"), data="light", format="json")

        assert UserPreference.objects.get(user=alice, key="theme").value == "dark"
        assert UserPreference.objects.get(user=bob, key="theme").value == "light"

    def test_put_accepts_complex_json_body(self, client, alice):
        register_preference_pattern(r"preferences\.[a-zA-Z][a-zA-Z0-9_.]*\.savedQueries", schema=SavedQueriesPreference)
        body = [
            {
                "label": "In stock",
                "value": {
                    "filter": {"in_stock": True},
                    "displayedFilters": {"in_stock": True},
                    "sort": {"field": "name", "order": "ASC"},
                    "perPage": 50,
                },
            }
        ]

        response = client.put(detail_url("preferences.product.savedQueries"), data=body, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["value"] == body
        stored = UserPreference.objects.get(user=alice, key="preferences.product.savedQueries").value
        assert stored[0]["label"] == "In stock"


class TestListGet:
    def test_includes_default_for_registered_key_without_stored_value(self, client):
        register_preference("theme", schema=ThemePreference, default="light")

        response = client.get(LIST_URL)

        assert response.status_code == status.HTTP_200_OK
        assert response.json() == [{"key": "theme", "value": "light", "updated_at": None}]

    def test_returns_stored_value_for_registered_key(self, client, alice):
        register_preference("theme", schema=ThemePreference, default="light")
        UserPreference.objects.create(user=alice, key="theme", value="dark")

        response = client.get(LIST_URL)

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert len(body) == 1
        assert body[0]["key"] == "theme"
        assert body[0]["value"] == "dark"
        assert body[0]["updated_at"] is not None

    def test_mixes_explicit_defaults_and_pattern_stored_records(self, client, alice):
        register_preference("theme", schema=ThemePreference, default="light")
        register_preference_pattern(r"[a-z][a-zA-Z0-9_.]*\.columns", schema=ColumnsPreference)
        UserPreference.objects.create(user=alice, key="product.columns", value=["name"])

        response = client.get(LIST_URL)

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        keys = {item["key"]: item for item in body}
        assert set(keys) == {"theme", "product.columns"}
        assert keys["theme"]["value"] == "light"
        assert keys["theme"]["updated_at"] is None
        assert keys["product.columns"]["value"] == ["name"]
        assert keys["product.columns"]["updated_at"] is not None

    def test_pattern_only_registration_without_stored_values_returns_empty_list(self, client):
        register_preference_pattern(r"[a-z][a-zA-Z0-9_.]*\.columns", schema=ColumnsPreference)

        response = client.get(LIST_URL)

        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []

    def test_list_does_not_include_other_users_records(self, client, alice, bob):
        register_preference("theme", schema=ThemePreference, default="light")
        UserPreference.objects.create(user=alice, key="theme", value="dark")
        UserPreference.objects.create(user=bob, key="theme", value="light")

        response = client.get(LIST_URL)

        body = response.json()
        assert len(body) == 1
        assert body[0]["key"] == "theme"
        assert body[0]["value"] == "dark"

    def test_list_skips_records_for_unregistered_keys(self, client, alice):
        register_preference("theme", schema=ThemePreference, default="light")
        UserPreference.objects.create(user=alice, key="theme", value="dark")
        UserPreference.objects.create(user=alice, key="orphan_key", value="x")

        response = client.get(LIST_URL)

        keys = {item["key"] for item in response.json()}
        assert keys == {"theme"}

    def test_list_invalid_stored_value_returns_default_and_cleans_db(self, client, alice):
        register_preference("theme", schema=ThemePreference, default="light")
        UserPreference.objects.create(user=alice, key="theme", value="sepia")

        response = client.get(LIST_URL)

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert len(body) == 1
        assert body[0]["key"] == "theme"
        assert body[0]["value"] == "light"
        assert body[0]["updated_at"] is None
        assert not UserPreference.objects.filter(user=alice, key="theme").exists()

    def test_list_anonymous_rejected(self, anon_client):
        response = anon_client.get(LIST_URL)
        assert response.status_code in {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN}


class TestDetailDelete:
    def test_delete_existing_stored_value_returns_204(self, client, alice):
        register_preference("theme", schema=ThemePreference, default="light")
        UserPreference.objects.create(user=alice, key="theme", value="dark")

        response = client.delete(detail_url("theme"))

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not UserPreference.objects.filter(user=alice, key="theme").exists()

    def test_delete_without_stored_value_is_noop_and_returns_204(self, client, alice):
        register_preference("theme", schema=ThemePreference, default="light")

        response = client.delete(detail_url("theme"))

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not UserPreference.objects.filter(user=alice, key="theme").exists()

    def test_delete_unregistered_key_returns_404(self, client):
        response = client.delete(detail_url("not_registered"))

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_does_not_remove_other_users_records(self, client, alice, bob):
        register_preference("theme", schema=ThemePreference, default="light")
        UserPreference.objects.create(user=alice, key="theme", value="dark")
        UserPreference.objects.create(user=bob, key="theme", value="light")

        client.delete(detail_url("theme"))

        assert not UserPreference.objects.filter(user=alice, key="theme").exists()
        assert UserPreference.objects.filter(user=bob, key="theme").exists()

    def test_delete_anonymous_rejected(self, anon_client):
        register_preference("theme", schema=ThemePreference, default="light")

        response = anon_client.delete(detail_url("theme"))

        assert response.status_code in {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN}

    def test_get_after_delete_returns_registered_default(self, client, alice):
        register_preference("theme", schema=ThemePreference, default="light")
        UserPreference.objects.create(user=alice, key="theme", value="dark")

        client.delete(detail_url("theme"))
        response = client.get(detail_url("theme"))

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert body == {"key": "theme", "value": "light", "updated_at": None}


class TestListDelete:
    def test_delete_all_removes_every_stored_value_for_current_user(self, client, alice):
        register_preference("theme", schema=ThemePreference, default="light")
        register_preference_pattern(r"[a-z][a-zA-Z0-9_.]*\.columns", schema=ColumnsPreference)
        UserPreference.objects.create(user=alice, key="theme", value="dark")
        UserPreference.objects.create(user=alice, key="product.columns", value=["name"])

        response = client.delete(LIST_URL)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not UserPreference.objects.filter(user=alice).exists()

    def test_delete_all_when_user_has_no_stored_values_returns_204(self, client, alice):
        register_preference("theme", schema=ThemePreference, default="light")

        response = client.delete(LIST_URL)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not UserPreference.objects.filter(user=alice).exists()

    def test_delete_all_isolated_to_current_user(self, client, alice, bob):
        register_preference("theme", schema=ThemePreference, default="light")
        UserPreference.objects.create(user=alice, key="theme", value="dark")
        UserPreference.objects.create(user=bob, key="theme", value="light")

        response = client.delete(LIST_URL)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not UserPreference.objects.filter(user=alice).exists()
        assert UserPreference.objects.filter(user=bob).exists()

    def test_delete_all_does_not_affect_registration(self, client, alice):
        register_preference("theme", schema=ThemePreference, default="light")
        UserPreference.objects.create(user=alice, key="theme", value="dark")

        client.delete(LIST_URL)
        response = client.get(detail_url("theme"))

        assert response.status_code == status.HTTP_200_OK
        assert response.json() == {"key": "theme", "value": "light", "updated_at": None}

    def test_delete_all_anonymous_rejected(self, anon_client):
        response = anon_client.delete(LIST_URL)

        assert response.status_code in {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN}


class TestRoundTrip:
    def test_put_then_get_returns_same_value(self, client):
        register_preference("theme", schema=ThemePreference, default="light")
        client.put(detail_url("theme"), data="dark", format="json")

        response = client.get(detail_url("theme"))

        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert body["value"] == "dark"
        assert body["updated_at"] is not None


class TestPutSizeLimits:
    """Oversized values and too many keys are refused as 422, like any other invalid value."""

    @override_settings(HABARICO_PREFERENCES={"MAX_VALUE_BYTES": {"default": 200}})
    def test_put_value_over_the_limit_returns_422(self, client, alice):
        register_preference("product.columns", schema=ColumnsPreference)

        response = client.put(detail_url("product.columns"), ["x" * 300], format="json")

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert not UserPreference.objects.filter(user=alice, key="product.columns").exists()

    @override_settings(HABARICO_PREFERENCES={"MAX_VALUE_BYTES": {"default": 200}})
    def test_put_value_within_the_limit_is_stored(self, client, alice):
        register_preference("product.columns", schema=ColumnsPreference)

        response = client.put(detail_url("product.columns"), ["a", "b"], format="json")

        assert response.status_code == status.HTTP_200_OK
        assert UserPreference.objects.get(user=alice, key="product.columns").value == ["a", "b"]

    @override_settings(HABARICO_PREFERENCES={"MAX_KEYS_PER_USER": 1})
    def test_put_new_key_past_the_count_limit_returns_422(self, client, alice):
        register_preference("a.columns", schema=ColumnsPreference)
        register_preference("b.columns", schema=ColumnsPreference)
        client.put(detail_url("a.columns"), ["x"], format="json")

        response = client.put(detail_url("b.columns"), ["x"], format="json")

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert UserPreference.objects.filter(user=alice).count() == 1

    @override_settings(HABARICO_PREFERENCES={"MAX_KEYS_PER_USER": 1})
    def test_put_existing_key_at_the_count_limit_still_succeeds(self, client, alice):
        register_preference("a.columns", schema=ColumnsPreference)
        client.put(detail_url("a.columns"), ["x"], format="json")

        response = client.put(detail_url("a.columns"), ["y"], format="json")

        assert response.status_code == status.HTTP_200_OK
        assert UserPreference.objects.get(user=alice, key="a.columns").value == ["y"]

    @override_settings(HABARICO_PREFERENCES={"MAX_VALUE_BYTES": {"default": 200}})
    def test_oversized_body_for_an_unregistered_key_is_still_404(self, client):
        response = client.put(detail_url("nope.columns"), ["x" * 300], format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND
