import pytest
from django.core.exceptions import ValidationError
from habarico.serializers.fields import AdminFileSerializer
from habarico.validators import MaxFileSizeValidator, max_size_for_serializer_field


class _Sized:
    def __init__(self, size):
        self.size = size


def test_rejects_a_file_over_the_limit():
    with pytest.raises(ValidationError):
        MaxFileSizeValidator(1_000)(_Sized(1_001))


def test_accepts_a_file_at_exactly_the_limit():
    MaxFileSizeValidator(1_000)(_Sized(1_000))


def test_error_carries_the_sizes_for_the_message():
    with pytest.raises(ValidationError) as excinfo:
        MaxFileSizeValidator(1_000)(_Sized(2_000))
    assert excinfo.value.code == "file_too_large"
    assert excinfo.value.params == {"size": 2_000, "max_size": 1_000}


def test_a_value_with_no_readable_size_passes():
    """This validator is about size and nothing else - a value the parent field has not turned into
    a file yet is not its business."""
    MaxFileSizeValidator(1_000)("not-a-file")


def test_a_non_positive_limit_is_refused_at_declaration_time():
    with pytest.raises(ValueError):
        MaxFileSizeValidator(0)


def test_equal_validators_compare_equal():
    """DRF deep-copies a field's declared kwargs on every bind; equality is what keeps a copied
    validator recognisable as the same declaration."""
    assert MaxFileSizeValidator(1_000) == MaxFileSizeValidator(1_000)
    assert MaxFileSizeValidator(1_000) != MaxFileSizeValidator(2_000)


def test_deconstructs_for_migrations():
    path, args, kwargs = MaxFileSizeValidator(1_000).deconstruct()
    assert path.endswith("MaxFileSizeValidator")
    assert args == (1_000,)


def test_max_size_for_serializer_field_reads_the_declaration():
    field = AdminFileSerializer(validators=[MaxFileSizeValidator(5_000_000)])
    assert max_size_for_serializer_field(field) == 5_000_000


def test_max_size_for_serializer_field_takes_the_strictest_of_several():
    field = AdminFileSerializer(validators=[MaxFileSizeValidator(5_000_000), MaxFileSizeValidator(1_000)])
    assert max_size_for_serializer_field(field) == 1_000


def test_max_size_for_serializer_field_none_without_a_declaration():
    assert max_size_for_serializer_field(AdminFileSerializer()) is None


def test_runs_through_drf_field_validation():
    """Runs where every other field validator runs, so any save path is covered without a caller
    having to call it up front."""
    from rest_framework.exceptions import ValidationError as DRFValidationError

    field = AdminFileSerializer(validators=[MaxFileSizeValidator(1_000)])
    with pytest.raises(DRFValidationError):
        field.run_validators(_Sized(2_000))
    field.run_validators(_Sized(500))
