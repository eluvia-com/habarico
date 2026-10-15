"""File content-type derivation for serializer-field validators (HAB-966).

Not a safety mechanism, and carries no opinion about what is dangerous - see
``habarico_enterprise.uploads.content_types`` for the hard blocklist that guards what a chunked
upload's ``initiate`` endpoint actually accepts. This only answers "what did the field's own
validators declare", the same way ``validators.files.max_size_for_serializer_field`` does for size.
"""

from __future__ import annotations

import mimetypes

from django.core.validators import FileExtensionValidator, validate_image_file_extension
from rest_framework.fields import Field


def content_types_for_serializer_field(field: Field) -> frozenset[str] | None:
    """Derive the allowed content-types for a serializer field, or ``None`` for no restriction.

    A ``FileExtensionValidator`` -> concrete types guessed from its allowed extensions - checked
    first, since naming extensions explicitly is a more specific declaration than a bare "this is
    an image field" and must not be silently widened by it. Only when there is none: a field
    carrying Django's ``validate_image_file_extension`` (as ``AdminImageFileSerializer`` always
    does) -> ``{"image/*"}``. Neither -> ``None``.

    Args:
        field: The serializer field to read ``validators`` off.

    Returns:
        The content types the field's own validators imply, or ``None`` when they imply none.
    """
    validators = getattr(field, "validators", None) or []
    extension_types = _content_types_for_extensions(_allowed_extensions(validators))
    if extension_types:
        return extension_types
    if validate_image_file_extension in validators:
        return frozenset({"image/*"})
    return None


def _allowed_extensions(validators: list) -> list[str]:
    extensions = []
    for validator in validators:
        if isinstance(validator, FileExtensionValidator):
            extensions.extend(validator.allowed_extensions)
    return extensions


def _content_types_for_extensions(extensions: list[str]) -> frozenset[str] | None:
    guessed = {mimetypes.guess_type(f"file.{ext.lstrip('.')}")[0] for ext in extensions}
    guessed.discard(None)
    return frozenset(guessed) or None
