"""
Tests for extension point 5 (HAB-811): swappable FieldTypeResolver.

``get_field_type()``/``get_field_format()``/``get_filter_type()``/``get_filter_format()``
stay as module-level functions (existing public API - see test_schema.py) but now
delegate to ``DEFAULT_FIELD_TYPE_RESOLVER_CLASS``, so a pro/enterprise package can add
its own field/filter classes by overriding a ``get_*`` method and calling ``super()``
for the isinstance-ordered fallback, instead of mutating the module-level dicts.
"""

from habarico.schema.generators import (
    FieldTypeResolver,
    get_field_format,
    get_field_type,
    get_field_type_resolver,
)
from habarico.schema.types import FieldFormatType, FieldType
from habarico.settings import admin_api_settings
from rest_framework.fields import BooleanField, CharField, IntegerField


class _DemoPercentageField(IntegerField):
    """Stand-in for a hypothetical pro/enterprise field class."""


class _DemoFieldTypeResolver(FieldTypeResolver):
    def get_field_format(self, field):
        if isinstance(field, _DemoPercentageField):
            return FieldFormatType.RANGE
        return super().get_field_format(field)


class TestDefaultFieldTypeResolverWiring:
    def test_default_is_core_class(self):
        assert admin_api_settings.DEFAULT_FIELD_TYPE_RESOLVER_CLASS is FieldTypeResolver

    def test_module_level_functions_unchanged_by_default(self):
        # Collision-order sanity check preserved from the pre-resolver dicts: BooleanField
        # resolves to BOOLEAN even though bool fields have no explicit format entry.
        assert get_field_type(BooleanField()) == FieldType.BOOLEAN
        assert get_field_format(CharField()) is None

    def test_overridden_resolver_extends_field_format_via_super(self, settings):
        settings.ADMIN_REST_FRAMEWORK = {
            "DEFAULT_FIELD_TYPE_RESOLVER_CLASS": (
                "app.tests.test_extension_point_field_type_resolver._DemoFieldTypeResolver"
            )
        }

        assert get_field_format(_DemoPercentageField()) == FieldFormatType.RANGE
        # Falls back to the built-in resolution (super()) for anything it doesn't know.
        assert get_field_format(CharField()) is None
        assert get_field_type(CharField()) == FieldType.STRING


class TestResolverInstanceIsShared:
    """
    The resolver is built once per settings load, not once per resolved field - a subclass doing
    real work in ``__init__`` would otherwise pay for it on every field of every schema.
    """

    def test_same_instance_across_calls(self):
        assert get_field_type_resolver() is get_field_type_resolver()

    def test_instance_is_of_the_configured_class(self):
        assert type(get_field_type_resolver()) is FieldTypeResolver

    def test_changed_setting_replaces_the_instance(self, settings):
        before = get_field_type_resolver()
        settings.ADMIN_REST_FRAMEWORK = {
            "DEFAULT_FIELD_TYPE_RESOLVER_CLASS": (
                "app.tests.test_extension_point_field_type_resolver._DemoFieldTypeResolver"
            )
        }

        after = get_field_type_resolver()

        assert after is not before
        assert type(after) is _DemoFieldTypeResolver

    def test_resolver_is_instantiated_once_per_settings_load(self, settings, monkeypatch):
        instantiations = []

        class _CountingResolver(FieldTypeResolver):
            def __init__(self):
                instantiations.append(1)

        monkeypatch.setattr(
            "app.tests.test_extension_point_field_type_resolver._DemoFieldTypeResolver",
            _CountingResolver,
        )
        settings.ADMIN_REST_FRAMEWORK = {
            "DEFAULT_FIELD_TYPE_RESOLVER_CLASS": (
                "app.tests.test_extension_point_field_type_resolver._DemoFieldTypeResolver"
            )
        }

        for _ in range(10):
            get_field_type(CharField())

        assert len(instantiations) == 1
