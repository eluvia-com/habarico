from django.core.validators import FileExtensionValidator, validate_image_file_extension
from habarico.validators.content_types import content_types_for_serializer_field


class _Field:
    def __init__(self, validators):
        self.validators = validators


def test_image_extension_validator_derives_wildcard():
    assert content_types_for_serializer_field(_Field([validate_image_file_extension])) == frozenset({"image/*"})


def test_file_extension_validator_derives_concrete_types():
    field = _Field([FileExtensionValidator(allowed_extensions=["csv"])])
    assert content_types_for_serializer_field(field) == frozenset({"text/csv"})


def test_multiple_extensions_derive_multiple_types():
    field = _Field([FileExtensionValidator(allowed_extensions=["png", "jpg"])])
    assert content_types_for_serializer_field(field) == frozenset({"image/png", "image/jpeg"})


def test_no_validators_derives_none():
    assert content_types_for_serializer_field(_Field([])) is None


def test_unguessable_extension_derives_none():
    field = _Field([FileExtensionValidator(allowed_extensions=["bogus-ext-xyz"])])
    assert content_types_for_serializer_field(field) is None


def test_explicit_extensions_narrow_an_image_field_instead_of_being_ignored():
    """An `AdminImageFileSerializer` always carries `validate_image_file_extension`; a host adding
    a `FileExtensionValidator` on top means "only these image types", not "any image" - the more
    specific declaration must win, not get silently widened back to `image/*`."""
    field = _Field([validate_image_file_extension, FileExtensionValidator(allowed_extensions=["png", "jpg"])])
    assert content_types_for_serializer_field(field) == frozenset({"image/png", "image/jpeg"})
