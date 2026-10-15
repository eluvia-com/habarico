"""
Tests for extension point 3 (HAB-811): swappable FieldSchemaGenerator.

``DEFAULT_FIELD_SCHEMA_GENERATOR_CLASS`` lets a pro/enterprise package override
``get_schema()`` (calling ``super().get_schema()`` and extending the result) instead of
core hardcoding feature-specific checks (like today's uploads ``apps.is_installed()``
branch) inside the base class. Nested/array/object fields recurse via ``type(self)``,
so the override applies all the way down, not just at the top level.
"""

from habarico.schema.generators import FieldSchemaGenerator
from habarico.settings import admin_api_settings
from rest_framework.fields import CharField
from rest_framework.serializers import Serializer


class _DemoTaggedFieldSchemaGenerator(FieldSchemaGenerator):
    def get_schema(self):
        schema = super().get_schema()
        schema._options = {**(schema._options or {}), "demo_extension_point": True}
        return schema


def _nested_object_field():
    class ChildSerializer(Serializer):
        name = CharField()

    field = ChildSerializer()
    field.bind(field_name="child", parent=Serializer())
    return field


class TestDefaultFieldSchemaGeneratorWiring:
    def test_default_is_core_class(self):
        assert admin_api_settings.DEFAULT_FIELD_SCHEMA_GENERATOR_CLASS is FieldSchemaGenerator

    def test_overridden_default_is_used_and_applies_to_nested_fields(self, settings):
        settings.ADMIN_REST_FRAMEWORK = {
            "DEFAULT_FIELD_SCHEMA_GENERATOR_CLASS": (
                "app.tests.test_extension_point_field_schema_generator._DemoTaggedFieldSchemaGenerator"
            )
        }
        generator_class = admin_api_settings.DEFAULT_FIELD_SCHEMA_GENERATOR_CLASS
        generator = generator_class(_nested_object_field(), view=None)

        schema = generator.get_schema()

        assert schema._options["demo_extension_point"] is True
        assert len(schema._properties) == 1
        nested_property = schema._properties[0]
        assert isinstance(nested_property, _DemoTaggedFieldSchemaGenerator)
        assert nested_property.get_schema()._options["demo_extension_point"] is True
