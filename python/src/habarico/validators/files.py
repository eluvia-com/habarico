"""File-related serializer-field validators (HAB-965).

Not upload-specific: chunked uploads live entirely in ``habarico_enterprise.uploads`` (HAB-845,
via the swappable ``DEFAULT_FILE_FIELD_MIXIN_CLASS`` extension point), and core declares no key it
cannot produce. :class:`MaxFileSizeValidator` is a plain DRF field validator that works on any
file/image serializer field regardless of what wrote it - habarico_enterprise's chunked ones
included - so it lives here rather than in a package that only one consumer needs.
"""

from __future__ import annotations

from django.core.exceptions import ValidationError
from django.utils.deconstruct import deconstructible
from django.utils.translation import gettext_lazy as _
from rest_framework.fields import Field


@deconstructible
class MaxFileSizeValidator:
    """Reject a file larger than ``max_size`` bytes.

    Django and DRF ship no file-size validator. Attach one to a file/image serializer field::

        class ProductSerializer(AdminModelSerializer):
            datasheet = AdminFileSerializer(validators=[MaxFileSizeValidator(5 * 1024 * 1024)])

    Runs where every other serializer-field validator runs (DRF's ``Field.run_validators()``), so
    it covers any value the field produces as long as it exposes a ``size`` attribute - a plain
    uploaded ``File``, or whatever a custom field (e.g. a chunked-upload one) resolves to.

    Args:
        max_size: Largest allowed size in bytes; must be positive.
        message: Overrides the default error message.

    Raises:
        ValueError: When ``max_size`` is not positive.
    """

    message = _("File size %(size)d exceeds the maximum allowed size of %(max_size)d bytes.")
    code = "file_too_large"

    def __init__(self, max_size: int, message: str | None = None):
        if max_size <= 0:
            raise ValueError("MaxFileSizeValidator requires a positive max_size.")
        self.max_size = max_size
        if message is not None:
            self.message = message

    def __call__(self, value) -> None:
        """Validate ``value``.

        A value with no readable ``size`` (a plain string, a value the parent field has not turned
        into a file yet) passes - this validator is about size, and nothing else is its business.

        Raises:
            ValidationError: When the file is larger than ``max_size``.
        """
        size = getattr(value, "size", None)
        if size is not None and size > self.max_size:
            raise ValidationError(self.message, code=self.code, params={"size": size, "max_size": self.max_size})

    def __eq__(self, other):
        return (
            isinstance(other, MaxFileSizeValidator)
            and other.max_size == self.max_size
            and other.message == self.message
        )

    def __hash__(self):
        return hash((type(self).__name__, self.max_size))


def max_size_for_serializer_field(field: Field) -> int | None:
    """Derive the size ceiling a serializer field declares, or ``None`` for no ceiling of its own.

    Args:
        field: The serializer field to read ``validators`` off.

    Returns:
        The strictest ``MaxFileSizeValidator`` limit declared on the field, or ``None`` when it
        declares none.
    """
    limits = [
        validator.max_size
        for validator in (getattr(field, "validators", None) or [])
        if isinstance(validator, MaxFileSizeValidator)
    ]
    return min(limits) if limits else None
