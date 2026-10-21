import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import override_settings
from habarico.contrib.preferences import register_preference
from habarico.contrib.preferences.exceptions import (
    InvalidPreferenceKey,
    PreferenceAlreadyRegistered,
    PreferenceNotRegistered,
    PreferenceValidationError,
    PreferenceValueTooLarge,
    TooManyPreferences,
)
from habarico.contrib.preferences.models import UserPreference
from habarico.contrib.preferences.registry import (
    get_default,
    get_schema,
    get_value,
    is_registered,
    max_bytes_for,
    preferences,
    register_preference_pattern,
    set_value,
    validate,
)
from habarico.contrib.preferences.schemas import (
    AppDensityPreference,
    ColumnsPreference,
    DashboardPreference,
    LocalePreference,
    SavedQueriesPreference,
    ThemePreference,
    WidgetConfig,
    WidgetLayout,
)

User = get_user_model()


@pytest.fixture
def user(db):
    return User.objects.create_user(username="alice", password="x")


@pytest.fixture
def other_user(db):
    return User.objects.create_user(username="bob", password="x")


@pytest.fixture(autouse=True)
def _clear_preference_registry():
    preferences._clear()
    yield
    preferences._clear()


class TestUserPreferenceModel:
    def test_create_user_preference(self, user):
        pref = UserPreference.objects.create(user=user, key="widgets", value=[{"id": "a"}])

        assert pref.pk is not None
        assert pref.user == user
        assert pref.key == "widgets"
        assert pref.value == [{"id": "a"}]
        assert pref.updated_at is not None

    def test_unique_constraint_on_user_and_key(self, user):
        UserPreference.objects.create(user=user, key="widgets", value=[])
        with pytest.raises(IntegrityError):
            UserPreference.objects.create(user=user, key="widgets", value=[{"id": "b"}])

    def test_same_key_for_different_users(self, user, other_user):
        UserPreference.objects.create(user=user, key="widgets", value=[{"id": "a"}])
        UserPreference.objects.create(user=other_user, key="widgets", value=[{"id": "b"}])

        assert UserPreference.objects.filter(key="widgets").count() == 2

    def test_cascade_delete_on_user(self, user):
        UserPreference.objects.create(user=user, key="widgets", value=[])
        user_pk = user.pk
        user.delete()

        assert not UserPreference.objects.filter(user_id=user_pk).exists()

    def test_value_supports_arbitrary_json(self, user):
        UserPreference.objects.create(user=user, key="filters", value={"a": 1, "b": [1, 2, "x"]})
        pref = UserPreference.objects.get(user=user, key="filters")
        assert pref.value == {"a": 1, "b": [1, 2, "x"]}


class TestRegistryRegistration:
    def test_register_preference_stores_key(self):
        register_preference("widgets", schema={"type": "array"}, default=[])

        assert is_registered("widgets")

    def test_register_preference_duplicate_raises(self):
        register_preference("widgets", schema={"type": "array"}, default=[])
        with pytest.raises(PreferenceAlreadyRegistered):
            register_preference("widgets", schema={"type": "object"}, default={})

    def test_get_schema_of_unregistered_key_raises(self):
        with pytest.raises(PreferenceNotRegistered):
            get_schema("not_there")

    def test_get_schema_returns_registered_schema(self):
        register_preference("widgets", schema={"type": "array"}, default=[])

        assert get_schema("widgets") == {"type": "array"}

    def test_get_default_returns_registered_default(self):
        register_preference("view_mode", schema={"enum": ["table", "cards"]}, default="table")

        assert get_default("view_mode") == "table"

    def test_is_registered_false_for_unknown_key(self):
        assert is_registered("anything") is False


class TestRegistryKeyValidation:
    @pytest.mark.parametrize(
        "valid_key",
        [
            "widgets",
            "product.filters",
            "dashboard_v2.layout",
            "a",
            "x.y.z",
            "a1.b2_c3",
            "preferences.product.savedQueries",
            "preferences.dashboard",
            "preferences/product/columns",
            "preferences.product/v2.savedQueries",
            "saved-queries",  # dash
            "preferences.my-dashboard/v2",  # dash within segment
        ],
    )
    def test_valid_keys_pass(self, valid_key):
        register_preference(valid_key, schema={"type": "object"}, default={})

    @pytest.mark.parametrize(
        "invalid_key",
        [
            "2foo",  # leading digit
            "_foo",  # leading underscore
            ".foo",  # leading dot
            "/foo",  # leading slash
            "foo bar",  # space
            "-foo",  # leading dash
            "",  # empty
            "foo@bar",  # special char
        ],
    )
    def test_invalid_keys_raise(self, invalid_key):
        with pytest.raises(InvalidPreferenceKey):
            register_preference(invalid_key, schema={"type": "object"}, default={})

    def test_uppercase_first_letter_key_is_valid(self):
        register_preference("Widgets", schema={"type": "object"}, default={})

        assert is_registered("Widgets")


class TestRegistryDefaultValidation:
    def test_default_validated_against_schema_at_registration(self):
        with pytest.raises(PreferenceValidationError):
            register_preference("view_mode", schema={"enum": ["table", "cards"]}, default="grid")

    def test_invalid_default_does_not_register_key(self):
        with pytest.raises(PreferenceValidationError):
            register_preference("view_mode", schema={"enum": ["table", "cards"]}, default="grid")

        assert is_registered("view_mode") is False

    def test_lazy_translation_in_default_is_resolved(self):
        from django.utils.translation import gettext_lazy as _

        default = {
            "widgets": [
                {
                    "id": "orders",
                    "type": "aggregate",
                    "resource": "order",
                    "label": _("Number of orders by customers"),
                    "layout": {"x": 0, "y": 0, "w": 6, "h": 4},
                    "aggregateFunction": "count",
                    "groupBy": [{"field": "customer__company_name"}],
                }
            ]
        }
        register_preference("preferences.dashboard", schema=DashboardPreference, default=default)

        resolved = get_default("preferences.dashboard")
        assert resolved["widgets"][0]["label"] == "Number of orders by customers"
        assert type(resolved["widgets"][0]["label"]) is str


class TestRegistryValidate:
    def test_validate_returns_value_when_valid(self):
        register_preference("view_mode", schema={"enum": ["table", "cards"]}, default="table")

        assert validate("view_mode", "cards") == "cards"

    def test_validate_raises_on_invalid_value(self):
        register_preference("view_mode", schema={"enum": ["table", "cards"]}, default="table")

        with pytest.raises(PreferenceValidationError):
            validate("view_mode", "grid")

    def test_validate_raises_for_unregistered_key(self):
        with pytest.raises(PreferenceNotRegistered):
            validate("not_there", "x")


class TestRegistryGetSet:
    def test_get_value_returns_default_for_unset_key(self, user):
        register_preference("view_mode", schema={"enum": ["table", "cards"]}, default="table")

        assert get_value(user, "view_mode").value == "table"

    def test_set_then_get_round_trip(self, user):
        register_preference("view_mode", schema={"enum": ["table", "cards"]}, default="table")
        set_value(user, "view_mode", "cards")

        assert get_value(user, "view_mode").value == "cards"

    def test_set_value_validates_against_schema(self, user):
        register_preference("view_mode", schema={"enum": ["table", "cards"]}, default="table")

        with pytest.raises(PreferenceValidationError):
            set_value(user, "view_mode", "grid")

    def test_set_value_does_not_persist_on_validation_error(self, user):
        register_preference("view_mode", schema={"enum": ["table", "cards"]}, default="table")

        with pytest.raises(PreferenceValidationError):
            set_value(user, "view_mode", "grid")

        assert not UserPreference.objects.filter(user=user, key="view_mode").exists()

    def test_set_value_for_unregistered_key_raises(self, user):
        with pytest.raises(PreferenceNotRegistered):
            set_value(user, "not_there", "x")

    def test_get_value_for_unregistered_key_raises(self, user):
        with pytest.raises(PreferenceNotRegistered):
            get_value(user, "not_there")

    def test_set_value_overwrites_existing(self, user):
        register_preference("view_mode", schema={"enum": ["table", "cards"]}, default="table")
        set_value(user, "view_mode", "cards")
        set_value(user, "view_mode", "table")

        assert get_value(user, "view_mode").value == "table"

    def test_per_user_isolation(self, user, other_user):
        register_preference("view_mode", schema={"enum": ["table", "cards"]}, default="table")
        set_value(user, "view_mode", "cards")
        set_value(other_user, "view_mode", "table")

        assert get_value(user, "view_mode").value == "cards"
        assert get_value(other_user, "view_mode").value == "table"


class TestRegistryInvalidStoredValue:
    def test_invalid_stored_value_returns_default(self, user):
        UserPreference.objects.create(user=user, key="view_mode", value="grid")
        register_preference("view_mode", schema={"enum": ["table", "cards"]}, default="table")

        assert get_value(user, "view_mode").value == "table"

    def test_invalid_stored_value_is_deleted_from_db(self, user):
        UserPreference.objects.create(user=user, key="view_mode", value="grid")
        register_preference("view_mode", schema={"enum": ["table", "cards"]}, default="table")

        get_value(user, "view_mode")

        assert not UserPreference.objects.filter(user=user, key="view_mode").exists()

    def test_subsequent_reads_after_invalid_cleanup_still_return_default(self, user):
        UserPreference.objects.create(user=user, key="view_mode", value="grid")
        register_preference("view_mode", schema={"enum": ["table", "cards"]}, default="table")

        get_value(user, "view_mode")
        get_value(user, "view_mode")

        assert get_value(user, "view_mode").value == "table"
        assert not UserPreference.objects.filter(user=user, key="view_mode").exists()


class TestLocalePreferenceSchema:
    def test_accepts_locale_string(self):
        register_preference("locale", schema=LocalePreference, default="en")

        assert validate("locale", "cs") == "cs"

    def test_rejects_non_string(self):
        register_preference("locale", schema=LocalePreference, default="en")

        with pytest.raises(PreferenceValidationError):
            validate("locale", 42)


class TestThemePreferenceSchema:
    @pytest.mark.parametrize("value", ["light", "dark"])
    def test_accepts_allowed_values(self, value):
        register_preference("theme", schema=ThemePreference, default="light")

        assert validate("theme", value) == value

    def test_rejects_other_values(self):
        register_preference("theme", schema=ThemePreference, default="light")

        with pytest.raises(PreferenceValidationError):
            validate("theme", "sepia")


class TestAppDensityPreferenceSchema:
    KEY = "preferences.layout.app.density"

    @pytest.mark.parametrize("value", ["compact", "standard", "comfortable"])
    def test_accepts_allowed_values(self, value):
        register_preference(self.KEY, schema=AppDensityPreference)

        assert validate(self.KEY, value) == value

    def test_rejects_the_legacy_middle_value(self):
        # The frontend renamed `normal` to `standard` in node 6.7.0 so the value can be passed
        # straight to the table components; the contract enum follows it (HAB-939).
        register_preference(self.KEY, schema=AppDensityPreference)

        with pytest.raises(PreferenceValidationError):
            validate(self.KEY, "normal")


class TestColumnsPreferenceSchema:
    def test_accepts_string_array(self):
        register_preference("product.columns", schema=ColumnsPreference)

        assert validate("product.columns", ["name", "price"]) == ["name", "price"]

    def test_rejects_non_string_items(self):
        register_preference("product.columns", schema=ColumnsPreference)

        with pytest.raises(PreferenceValidationError):
            validate("product.columns", [1, 2])


class TestSavedQueriesPreferenceSchema:
    def test_accepts_query_array(self):
        register_preference("product.savedQueries", schema=SavedQueriesPreference)

        value = [
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
        assert validate("product.savedQueries", value) == value

    def test_rejects_query_without_label(self):
        register_preference("product.savedQueries", schema=SavedQueriesPreference)

        with pytest.raises(PreferenceValidationError):
            validate("product.savedQueries", [{"value": {}}])


class TestDashboardPreferenceSchema:
    def test_accepts_table_widget(self):
        register_preference("dashboard", schema=DashboardPreference)

        value = {
            "widgets": [
                {
                    "id": "w1",
                    "resource": "product",
                    "type": "table",
                    "label": "Products",
                    "layout": {"x": 0, "y": 0, "w": 6, "h": 4},
                    "filters": {"in_stock": "true"},
                    "columns": ["name"],
                }
            ]
        }
        assert validate("dashboard", value) == value

    def test_accepts_aggregate_widget(self):
        register_preference("dashboard", schema=DashboardPreference)

        value = {
            "widgets": [
                {
                    "id": "w2",
                    "resource": "order",
                    "type": "aggregate",
                    "layout": {"x": 6, "y": 0, "w": 3, "h": 2},
                    "field": "total",
                    "aggregateFunction": "max",
                }
            ]
        }
        assert validate("dashboard", value) == value

    @pytest.mark.parametrize("function", ["count", "sum", "avg", "min", "max"])
    def test_accepts_all_aggregate_functions(self, function):
        register_preference("dashboard", schema=DashboardPreference)

        value = {
            "widgets": [
                {
                    "id": "w2",
                    "resource": "order",
                    "type": "aggregate",
                    "layout": {"x": 6, "y": 0, "w": 3, "h": 2},
                    "field": "total",
                    "aggregateFunction": function,
                }
            ]
        }
        assert validate("dashboard", value) == value

    def test_rejects_unknown_aggregate_function(self):
        register_preference("dashboard", schema=DashboardPreference)

        with pytest.raises(PreferenceValidationError):
            validate(
                "dashboard",
                {
                    "widgets": [
                        {
                            "id": "w2",
                            "resource": "order",
                            "type": "aggregate",
                            "layout": {"x": 6, "y": 0, "w": 3, "h": 2},
                            "field": "total",
                            "aggregateFunction": "median",
                        }
                    ]
                },
            )

    def test_accepts_chart_widget_with_group_by_and_options(self):
        register_preference("dashboard", schema=DashboardPreference)

        value = {
            "widgets": [
                {
                    "id": "w3",
                    "resource": "order",
                    "type": "bar",
                    "layout": {"x": 0, "y": 0, "w": 6, "h": 4},
                    "field": "total",
                    "aggregateFunction": "count",
                    "groupBy": [
                        {"field": "created_at", "bucket": {"type": "trunc", "granularity": "month"}},
                        {"field": "status"},
                    ],
                    "chartOptions": {"orientation": "horizontal"},
                }
            ]
        }
        assert validate("dashboard", value) == value

    def test_accepts_pie_widget_with_width_bucket(self):
        register_preference("dashboard", schema=DashboardPreference)

        value = {
            "widgets": [
                {
                    "id": "w4",
                    "resource": "product",
                    "type": "pie",
                    "layout": {"x": 0, "y": 0, "w": 4, "h": 4},
                    "groupBy": [{"field": "price", "bucket": {"type": "width", "size": 100}}],
                    "chartOptions": {"variant": "doughnut"},
                }
            ]
        }
        assert validate("dashboard", value) == value

    def test_rejects_invalid_group_by_bucket(self):
        register_preference("dashboard", schema=DashboardPreference)

        with pytest.raises(PreferenceValidationError):
            validate(
                "dashboard",
                {
                    "widgets": [
                        {
                            "id": "w5",
                            "resource": "p",
                            "type": "line",
                            "layout": {"x": 0, "y": 0, "w": 4, "h": 4},
                            "groupBy": [{"field": "created_at", "bucket": {"type": "nope"}}],
                        }
                    ]
                },
            )

    def test_rejects_widget_missing_required_fields(self):
        register_preference("dashboard", schema=DashboardPreference)

        with pytest.raises(PreferenceValidationError):
            validate("dashboard", {"widgets": [{"id": "x", "type": "table"}]})

    def test_accepts_custom_widget_type(self):
        register_preference("dashboard", schema=DashboardPreference)

        value = {
            "widgets": [
                {
                    "id": "w1",
                    "type": "my-custom-widget",
                    "layout": {"x": 0, "y": 0, "w": 1, "h": 1},
                }
            ]
        }
        assert validate("dashboard", value) == value

    def test_rejects_invalid_layout(self):
        register_preference("dashboard", schema=DashboardPreference)

        with pytest.raises(PreferenceValidationError):
            validate(
                "dashboard",
                {
                    "widgets": [
                        {
                            "id": "w1",
                            "resource": "p",
                            "type": "table",
                            "layout": {"x": 0, "y": 0, "w": 0, "h": 1},
                        }
                    ]
                },
            )

    def test_accepts_layout_with_stacked_height_and_resize_bounds(self):
        register_preference("dashboard", schema=DashboardPreference)

        value = {
            "widgets": [
                {
                    "id": "w1",
                    "resource": "product",
                    "type": "table",
                    "layout": {"x": 0, "y": 0, "w": 6, "h": 4, "stackedH": 8, "minW": 3, "minH": 2},
                }
            ]
        }
        assert validate("dashboard", value) == value

    @pytest.mark.parametrize("key", ["stackedH", "minW", "minH"])
    def test_rejects_non_positive_optional_layout_size(self, key):
        register_preference("dashboard", schema=DashboardPreference)

        with pytest.raises(PreferenceValidationError):
            validate(
                "dashboard",
                {
                    "widgets": [
                        {
                            "id": "w1",
                            "resource": "product",
                            "type": "table",
                            "layout": {"x": 0, "y": 0, "w": 6, "h": 4, key: 0},
                        }
                    ]
                },
            )


class TestPydanticModelRegistration:
    def test_no_default_returns_none(self):
        register_preference("dashboard", schema=DashboardPreference)

        assert get_default("dashboard") is None

    def test_explicit_default_is_used(self):
        register_preference("product.columns", schema=ColumnsPreference, default=["name"])

        assert get_default("product.columns") == ["name"]

    def test_model_without_field_default_does_not_require_explicit_default(self):
        register_preference("locale", schema=LocalePreference)

        assert get_default("locale") is None

    def test_schema_dict_returned_matches_model_json_schema(self):
        register_preference("theme", schema=ThemePreference, default="light")

        assert get_schema("theme") == ThemePreference.model_json_schema()

    def test_invalid_schema_type_raises_type_error(self):
        with pytest.raises(TypeError):
            register_preference("widgets", schema="not-a-schema", default=[])

    def test_dict_schema_still_supported(self):
        register_preference("widgets", schema={"type": "array"}, default=[])

        assert validate("widgets", []) == []
        with pytest.raises(PreferenceValidationError):
            validate("widgets", "not-an-array")

    def test_dict_schema_without_default(self):
        register_preference("widgets", schema={"type": "array"})

        assert get_default("widgets") is None
        assert validate("widgets", []) == []


class TestModelInstanceDefault:
    def test_register_accepts_pydantic_instance_as_default(self):
        register_preference(
            "dashboard",
            schema=DashboardPreference,
            default=DashboardPreference(
                widgets=[
                    WidgetConfig(
                        id="w1",
                        resource="product",
                        type="aggregate",
                        layout=WidgetLayout(x=0, y=0, w=3, h=2),
                        aggregateFunction="count",
                    )
                ]
            ),
        )

        default = get_default("dashboard")
        assert default == {
            "widgets": [
                {
                    "id": "w1",
                    "resource": "product",
                    "type": "aggregate",
                    "label": None,
                    "layout": {"x": 0, "y": 0, "w": 3, "h": 2, "stackedH": None, "minW": None, "minH": None},
                    "filters": None,
                    "sort": None,
                    "perPage": None,
                    "columns": None,
                    "field": None,
                    "aggregateFunction": "count",
                    "color": None,
                    "groupBy": None,
                    "chartOptions": None,
                }
            ]
        }

    def test_invalid_pydantic_default_raises_at_construction(self):
        with pytest.raises(Exception):
            DashboardPreference(widgets=[{"id": "x"}])  # missing required fields


class TestCallableDefault:
    def test_callable_default_is_evaluated_on_each_read(self, user):
        values = iter(["light", "dark", "light"])
        register_preference("theme", schema=ThemePreference, default=lambda: next(values))

        assert get_default("theme") == "light"
        assert get_default("theme") == "dark"
        assert get_default("theme") == "light"

    def test_callable_default_used_when_no_stored_value(self, user):
        register_preference("theme", schema=ThemePreference, default=lambda: "dark")

        assert get_value(user, "theme").value == "dark"

    def test_callable_default_does_not_override_stored_value(self, user):
        register_preference("theme", schema=ThemePreference, default=lambda: "dark")
        set_value(user, "theme", "light")

        assert get_value(user, "theme").value == "light"

    def test_callable_default_returning_invalid_value_is_treated_as_no_default(self, user):
        register_preference("theme", schema=ThemePreference, default=lambda: "sepia")

        assert get_default("theme") is None
        assert get_value(user, "theme") is None

    def test_callable_default_returning_empty_means_no_default(self, user):
        from habarico.contrib.preferences.registry import EMPTY

        register_preference("theme", schema=ThemePreference, default=lambda: EMPTY)

        assert get_default("theme") is None
        assert get_value(user, "theme") is None

    def test_callable_default_accepts_pydantic_instance(self):
        register_preference(
            "dashboard",
            schema=DashboardPreference,
            default=lambda: DashboardPreference(
                widgets=[
                    WidgetConfig(
                        id="overview",
                        resource="product",
                        type="aggregate",
                        layout=WidgetLayout(x=0, y=0, w=3, h=2),
                        aggregateFunction="count",
                    )
                ]
            ),
        )

        default = get_default("dashboard")
        assert default["widgets"][0]["id"] == "overview"
        assert default["widgets"][0]["aggregateFunction"] == "count"


class TestStandardPreferencesAutoRegistration:
    def test_no_settings_registers_all_keys_without_defaults(self, settings):
        from habarico.contrib.preferences.base import register_base_preferences

        if hasattr(settings, "HABARICO_PREFERENCES"):
            del settings.HABARICO_PREFERENCES

        register_base_preferences()

        assert is_registered("theme") is True
        assert is_registered("locale") is True
        assert get_default("theme") is None
        assert get_default("locale") is None

    def test_default_from_settings_is_applied_others_stay_unset(self, settings):
        from habarico.contrib.preferences.base import register_base_preferences

        settings.HABARICO_PREFERENCES = {"DEFAULTS": {"theme": "dark"}}

        register_base_preferences()

        assert is_registered("theme") is True
        assert is_registered("locale") is True
        assert get_default("theme") == "dark"
        assert get_default("locale") is None

    def test_registers_dashboard_with_pydantic_default(self, settings):
        from habarico.contrib.preferences.base import register_base_preferences

        settings.HABARICO_PREFERENCES = {
            "DEFAULTS": {
                "preferences.dashboard": DashboardPreference(
                    widgets=[
                        WidgetConfig(
                            id="overview",
                            resource="product",
                            type="aggregate",
                            layout=WidgetLayout(x=0, y=0, w=3, h=2),
                            aggregateFunction="count",
                        )
                    ]
                ),
            }
        }

        register_base_preferences()

        default = get_default("preferences.dashboard")
        assert default["widgets"][0]["id"] == "overview"

    def test_invalid_settings_default_raises_at_registration(self, settings):
        from habarico.contrib.preferences.base import register_base_preferences

        settings.HABARICO_PREFERENCES = {"DEFAULTS": {"theme": "sepia"}}

        with pytest.raises(PreferenceValidationError):
            register_base_preferences()

    def test_patterns_always_registered(self):
        from habarico.contrib.preferences.base import register_base_preferences

        register_base_preferences()

        assert is_registered("preferences.product.savedQueries")
        assert is_registered("preferences.product.columns")
        assert is_registered("preferences.orders_table.columns")
        assert is_registered("preferences.product.columnWidths")

    def test_pattern_validates_value(self):
        from habarico.contrib.preferences.base import register_base_preferences

        register_base_preferences()

        assert validate("preferences.product.columns", ["name", "price"]) == ["name", "price"]
        with pytest.raises(PreferenceValidationError):
            validate("preferences.product.columns", [1, 2])

    def test_pattern_has_no_built_in_default(self, user):
        from habarico.contrib.preferences.base import register_base_preferences

        register_base_preferences()

        assert get_default("preferences.product.savedQueries") is None
        assert get_value(user, "preferences.article.savedQueries") is None
        assert get_value(user, "preferences.table.columns") is None
        assert get_value(user, "preferences.product.columnWidths") is None

    def test_explicit_registration_provides_per_key_default_for_pattern_match(self):
        from habarico.contrib.preferences.base import register_base_preferences

        register_base_preferences()
        register_preference("preferences.product.columns", schema=ColumnsPreference, default=["name", "price"])

        assert get_default("preferences.product.columns") == ["name", "price"]
        assert get_default("preferences.article.columns") is None  # other matches stay unset


class TestRegisterPreferencePattern:
    def test_pattern_matches_multiple_keys(self):
        from habarico.contrib.preferences.registry import register_preference_pattern

        register_preference_pattern(r".+\.savedQueries", schema=SavedQueriesPreference)

        assert is_registered("product.savedQueries")
        assert is_registered("anything.savedQueries")
        assert not is_registered("product.notMatching")

    def test_exact_registration_wins_over_pattern(self):
        from habarico.contrib.preferences.registry import register_preference_pattern

        register_preference_pattern(r".+\.savedQueries", schema=SavedQueriesPreference)
        register_preference(
            "product.savedQueries",
            schema={"type": "object", "properties": {"custom": {"type": "string"}}},
            default={"custom": "x"},
        )

        assert get_default("product.savedQueries") == {"custom": "x"}
        assert get_default("article.savedQueries") is None

    def test_pattern_set_value_roundtrip(self, user):
        from habarico.contrib.preferences.registry import register_preference_pattern

        register_preference_pattern(r".+\.columns", schema=ColumnsPreference)

        set_value(user, "product.columns", ["name"])
        assert get_value(user, "product.columns").value == ["name"]


class TestRegistryValueSizeLimit:
    """`MAX_VALUE_BYTES` caps the serialized size of a single preference value."""

    @override_settings(HABARICO_PREFERENCES={"MAX_VALUE_BYTES": {"default": 200}})
    def test_value_within_limit_is_accepted(self):
        register_preference("product.columns", schema=ColumnsPreference)

        assert validate("product.columns", ["a", "b"]) == ["a", "b"]

    @override_settings(HABARICO_PREFERENCES={"MAX_VALUE_BYTES": {"default": 200}})
    def test_value_over_limit_raises(self):
        register_preference("product.columns", schema=ColumnsPreference)

        with pytest.raises(PreferenceValueTooLarge):
            validate("product.columns", ["x" * 300])

    @override_settings(HABARICO_PREFERENCES={"MAX_VALUE_BYTES": {"default": 200}})
    def test_explicit_max_bytes_overrides_the_settings_default(self):
        register_preference("product.columns", schema=ColumnsPreference, max_bytes=10_000)

        assert validate("product.columns", ["x" * 300]) == ["x" * 300]

    @override_settings(HABARICO_PREFERENCES={"MAX_VALUE_BYTES": {"default": 200}})
    def test_max_bytes_none_falls_back_to_the_settings_default(self):
        # None is "not given", not "unlimited" -- a size is never None, so no sentinel is needed.
        register_preference("product.columns", schema=ColumnsPreference, max_bytes=None)

        with pytest.raises(PreferenceValueTooLarge):
            validate("product.columns", ["x" * 300])

    @override_settings(HABARICO_PREFERENCES={"MAX_VALUE_BYTES": {"default": 200, "product.columns": None}})
    def test_a_none_settings_entry_disables_the_limit_for_that_key(self):
        register_preference("product.columns", schema=ColumnsPreference)
        register_preference("order.columns", schema=ColumnsPreference)

        assert validate("product.columns", ["x" * 10_000]) == ["x" * 10_000]
        with pytest.raises(PreferenceValueTooLarge):
            validate("order.columns", ["x" * 300])

    @override_settings(HABARICO_PREFERENCES={"MAX_VALUE_BYTES": {"default": 200, "product.columns": 10_000}})
    def test_per_key_settings_entry_wins_over_default(self):
        register_preference("product.columns", schema=ColumnsPreference)
        register_preference("order.columns", schema=ColumnsPreference)

        assert validate("product.columns", ["x" * 300]) == ["x" * 300]
        with pytest.raises(PreferenceValueTooLarge):
            validate("order.columns", ["x" * 300])

    @override_settings(HABARICO_PREFERENCES={"MAX_VALUE_BYTES": {"default": 200, r"[a-z]+\.savedQueries": 10_000}})
    def test_pattern_key_resolves_the_entry_registered_for_its_pattern(self):
        register_preference_pattern(r"[a-z]+\.savedQueries", schema=SavedQueriesPreference)

        big = [{"label": "x" * 400, "value": {}}]
        assert validate("product.savedQueries", big) == big

    def test_the_limit_is_resolved_once_at_registration(self):
        # Same contract as DEFAULTS: the setting is read when the preference is registered, so
        # changing it afterwards does not move a limit that is already in place.
        with override_settings(HABARICO_PREFERENCES={"MAX_VALUE_BYTES": {"default": 10_000}}):
            register_preference("product.columns", schema=ColumnsPreference)

        with override_settings(HABARICO_PREFERENCES={"MAX_VALUE_BYTES": {"default": 10}}):
            assert validate("product.columns", ["x" * 300]) == ["x" * 300]
            assert max_bytes_for("product.columns") == 10_000

    @override_settings(HABARICO_PREFERENCES={"MAX_VALUE_BYTES": {"default": 41}})
    def test_size_is_the_utf8_wire_size_not_the_ascii_escaped_one(self):
        # 40 bytes as UTF-8, 56 once non-ASCII is escaped. Measuring the escaped copy
        # would make the limit harsher for non-English content and disagree with the Ruby backend.
        register_preference("product.columns", schema=ColumnsPreference)
        value = ["Objednávky za poslední čtvrtletí"]

        assert validate("product.columns", value) == value

    @override_settings(HABARICO_PREFERENCES={"MAX_VALUE_BYTES": {"default": 200}})
    def test_set_value_does_not_persist_a_value_over_the_limit(self, user):
        register_preference("product.columns", schema=ColumnsPreference)

        with pytest.raises(PreferenceValueTooLarge):
            set_value(user, "product.columns", ["x" * 300])

        assert not UserPreference.objects.filter(user=user, key="product.columns").exists()

    @override_settings(HABARICO_PREFERENCES={"MAX_VALUE_BYTES": {"default": None}})
    def test_default_none_disables_the_limit_for_every_key(self):
        register_preference("product.columns", schema=ColumnsPreference)

        assert validate("product.columns", ["x" * 10_000]) == ["x" * 10_000]


class TestRegistryKeyCountLimit:
    """`MAX_KEYS_PER_USER` caps how many preference rows one user may hold."""

    @override_settings(HABARICO_PREFERENCES={"MAX_KEYS_PER_USER": 2})
    def test_creating_a_key_past_the_limit_raises(self, user):
        for key in ("a.columns", "b.columns", "c.columns"):
            register_preference(key, schema=ColumnsPreference)
        set_value(user, "a.columns", ["x"])
        set_value(user, "b.columns", ["x"])

        with pytest.raises(TooManyPreferences):
            set_value(user, "c.columns", ["x"])

        assert UserPreference.objects.filter(user=user).count() == 2

    @override_settings(HABARICO_PREFERENCES={"MAX_KEYS_PER_USER": 2})
    def test_overwriting_an_existing_key_at_the_limit_is_allowed(self, user):
        for key in ("a.columns", "b.columns"):
            register_preference(key, schema=ColumnsPreference)
        set_value(user, "a.columns", ["x"])
        set_value(user, "b.columns", ["x"])

        assert set_value(user, "a.columns", ["y"]).value == ["y"]

    @override_settings(HABARICO_PREFERENCES={"MAX_KEYS_PER_USER": 1})
    def test_the_limit_is_counted_per_user(self, user, other_user):
        for key in ("a.columns", "b.columns"):
            register_preference(key, schema=ColumnsPreference)
        set_value(user, "a.columns", ["x"])

        assert set_value(other_user, "b.columns", ["x"]).value == ["x"]

    @override_settings(HABARICO_PREFERENCES={"MAX_KEYS_PER_USER": None})
    def test_none_disables_the_count_limit(self, user):
        for key in ("a.columns", "b.columns", "c.columns"):
            register_preference(key, schema=ColumnsPreference)
        for key in ("a.columns", "b.columns", "c.columns"):
            set_value(user, key, ["x"])

        assert UserPreference.objects.filter(user=user).count() == 3
