import json
import re
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Tuple, Type, Union

from django.core.serializers.json import DjangoJSONEncoder
from habarico.contrib.preferences.exceptions import (
    InvalidPreferenceKey,
    PreferenceAlreadyRegistered,
    PreferenceNotRegistered,
    PreferenceValidationError,
    PreferenceValueTooLarge,
    TooManyPreferences,
)
from habarico.contrib.preferences.settings import preference_settings
from jsonschema import Draft202012Validator
from jsonschema import ValidationError as JSONSchemaValidationError
from pydantic import BaseModel

KEY_PATTERN = re.compile(r"^[a-zA-Z][a-zA-Z0-9_./-]*$")

PreferenceSchema = Union[Dict[str, Any], Type[BaseModel]]


class _Empty:
    def __repr__(self) -> str:
        return "EMPTY"


EMPTY = _Empty()


@dataclass(frozen=True)
class _Entry:
    schema: Dict[str, Any]
    default: Any
    validator: Draft202012Validator
    # The size limit, already resolved: either the one passed to `register`, or the one the
    # settings held for this key or pattern when it was registered. None means unlimited.
    # Resolved once, here, the same way `default` is -- nothing reads the settings per write.
    max_bytes: Optional[int] = None
    # The owner's chance to bring a stored value that no longer validates up to date, taken from
    # the schema at registration -- `_normalize_schema` keeps only the JSON Schema, so the class
    # is not available later. None when the schema offers none, and the value is then deleted.
    migrate_value: Optional[Callable[[Any], Any]] = None


@dataclass(frozen=True)
class ResolvedPreference:
    key: str
    value: Any
    updated_at: Optional[datetime]


def _normalize_schema(schema: PreferenceSchema) -> Dict[str, Any]:
    if isinstance(schema, type) and issubclass(schema, BaseModel):
        return schema.model_json_schema()
    if isinstance(schema, dict):
        return schema
    raise TypeError("schema must be a dict (JSON Schema) or a pydantic BaseModel subclass")


def _normalize_value(value: Any) -> Any:
    if isinstance(value, BaseModel):
        return value.model_dump(mode="json")
    # Coerce to JSON-native types so values are validated and stored exactly as
    # they will be serialized in API responses. DjangoJSONEncoder resolves lazy
    # objects (e.g. gettext_lazy labels), datetimes and Decimals to plain types.
    try:
        return json.loads(json.dumps(value, cls=DjangoJSONEncoder))
    except TypeError:
        return value


def _resolve_max_bytes(registered_as: str, max_bytes: Optional[int]) -> Optional[int]:
    """Settings limit for the key -- or pattern -- a preference is being registered under.

    ``HABARICO_PREFERENCES["MAX_VALUE_BYTES"]`` decides first, by the very string the preference is
    registered under: a deployment's word outranks a limit a package registered, which is itself a
    default above the dict's ``"default"`` entry. A None anywhere there means unlimited. Read once,
    at registration, exactly like ``DEFAULTS``: changing the setting afterwards does not move an
    already-registered limit.
    """
    limits = preference_settings.MAX_VALUE_BYTES or {}
    if registered_as in limits:
        return limits[registered_as]
    if max_bytes is not None:
        return max_bytes
    return limits.get("default")


def _migrate_value_of(schema: PreferenceSchema) -> Optional[Callable[[Any], Any]]:
    """The ``migrate_value`` a pydantic schema offers for a stored value in an older shape, if any."""
    if isinstance(schema, type) and issubclass(schema, BaseModel):
        return getattr(schema, "migrate_value", None)
    return None


def _build_entry(key: str, schema: PreferenceSchema, default: Any, max_bytes: Optional[int] = None) -> _Entry:
    json_schema = _normalize_schema(schema)
    validator = Draft202012Validator(json_schema)
    resolved_max_bytes = _resolve_max_bytes(key, max_bytes)
    migrate_value = _migrate_value_of(schema)

    if default is EMPTY or callable(default):
        return _Entry(
            schema=json_schema,
            default=default,
            validator=validator,
            max_bytes=resolved_max_bytes,
            migrate_value=migrate_value,
        )

    default = _normalize_value(default)
    try:
        validator.validate(default)
    except JSONSchemaValidationError as exc:
        raise PreferenceValidationError(key, exc.message) from exc

    return _Entry(
        schema=json_schema,
        default=default,
        validator=validator,
        migrate_value=migrate_value,
        max_bytes=resolved_max_bytes,
    )


def _value_size(value: Any) -> int:
    r"""Serialized size of a value in bytes, measured the way it is actually stored and sent.

    ``ensure_ascii=False`` is what makes this the size on the wire rather than the size of an
    escaped copy: the default would render every non-ASCII character as ``\uXXXX``, six bytes
    instead of the two or three UTF-8 takes, so a Czech or Japanese value would be measured up
    to three times too big -- tighter than the same limit is for English, and tighter than the
    Ruby backend, which serializes UTF-8 directly.
    """
    return len(json.dumps(value, cls=DjangoJSONEncoder, separators=(",", ":"), ensure_ascii=False).encode("utf-8"))


class PreferenceRegistry:
    def __init__(self) -> None:
        self._entries: Dict[str, _Entry] = {}
        self._pattern_entries: List[Tuple[re.Pattern, _Entry]] = []

    def _clear(self) -> None:
        self._entries.clear()
        self._pattern_entries.clear()

    def register(
        self,
        key: str,
        schema: PreferenceSchema,
        default: Any = EMPTY,
        max_bytes: Optional[int] = None,
    ) -> None:
        if not isinstance(key, str) or not KEY_PATTERN.match(key):
            raise InvalidPreferenceKey(key)
        if key in self._entries:
            raise PreferenceAlreadyRegistered(key)

        self._entries[key] = _build_entry(key, schema, default, max_bytes)

    def register_pattern(
        self,
        pattern: Union[str, re.Pattern],
        schema: PreferenceSchema,
        max_bytes: Optional[int] = None,
    ) -> None:
        # A pattern entry never carries a default -- there is no single key to attach one to -- so
        # `_build_entry` returns on its EMPTY branch without validating anything. Same entry, one
        # place: the two registration paths cannot drift when a field is added to `_Entry`.
        compiled = re.compile(pattern) if isinstance(pattern, str) else pattern
        self._pattern_entries.append((compiled, _build_entry(compiled.pattern, schema, EMPTY, max_bytes)))

    def is_registered(self, key: str) -> bool:
        if key in self._entries:
            return True
        return any(p.fullmatch(key) for p, _ in self._pattern_entries)

    def _get_entry(self, key: str) -> _Entry:
        if key in self._entries:
            return self._entries[key]
        for pattern, entry in self._pattern_entries:
            if pattern.fullmatch(key):
                return entry
        raise PreferenceNotRegistered(key)

    def get_schema(self, key: str) -> Dict[str, Any]:
        return self._get_entry(key).schema

    def get_default(self, key: str) -> Optional[Any]:
        default = self._resolve_default(key, self._get_entry(key))
        return None if default is EMPTY else default

    def _resolve_default(self, key: str, entry: _Entry) -> Any:
        default = entry.default
        if callable(default):
            default = default()
            if default is EMPTY:
                return EMPTY
            default = _normalize_value(default)
            try:
                entry.validator.validate(default)
            except JSONSchemaValidationError:
                return EMPTY
        return default

    def max_bytes_for(self, key: str) -> Optional[int]:
        """Size limit in bytes for a key, or None when it is unlimited."""
        return self._get_entry(key).max_bytes

    def validate(self, key: str, value: Any) -> Any:
        entry = self._get_entry(key)
        # Ahead of the schema: the size guard is the cheap check and the one that has to hold
        # for free-form branches (`SavedQueryValue.filter`) the schema does not bound at all.
        limit = entry.max_bytes
        if limit is not None:
            size = _value_size(value)
            if size > limit:
                raise PreferenceValueTooLarge(key, limit, size)
        try:
            entry.validator.validate(value)
        except JSONSchemaValidationError as exc:
            raise PreferenceValidationError(key, exc.message) from exc
        return value

    def _migrate_stored_value(self, entry: _Entry, record) -> bool:
        """
        Give the owner's schema a chance to bring a stored value up to date, in place.

        A migration that does not validate, or one that raises, leaves the record to be deleted: a
        schema's own bug must not make reading preferences fail.
        """
        if entry.migrate_value is None:
            return False
        try:
            migrated = _normalize_value(entry.migrate_value(record.value))
            entry.validator.validate(migrated)
        except Exception:
            return False
        record.value = migrated
        record.save(update_fields=["value"])
        return True

    def _resolve(self, key: str, entry: _Entry, record) -> Optional[ResolvedPreference]:
        if record is not None:
            try:
                entry.validator.validate(record.value)
            except JSONSchemaValidationError:
                if not self._migrate_stored_value(entry, record):
                    record.delete()
                    record = None
            if record is not None:
                return ResolvedPreference(key=key, value=record.value, updated_at=record.updated_at)

        default = self._resolve_default(key, entry)
        if default is EMPTY:
            return None
        return ResolvedPreference(key=key, value=default, updated_at=None)

    def get_value(self, user, key: str) -> Optional[ResolvedPreference]:
        from habarico.contrib.preferences.models import UserPreference

        entry = self._get_entry(key)
        try:
            record = UserPreference.objects.get(user=user, key=key)
        except UserPreference.DoesNotExist:
            record = None
        return self._resolve(key, entry, record)

    def get_values(self, user) -> List[ResolvedPreference]:
        from habarico.contrib.preferences.models import UserPreference

        resolved: Dict[str, ResolvedPreference] = {}

        for record in UserPreference.objects.filter(user=user):
            try:
                entry = self._get_entry(record.key)
            except PreferenceNotRegistered:
                record.delete()
            else:
                item = self._resolve(record.key, entry, record)
                if item is not None:
                    resolved[record.key] = item

        for key, entry in self._entries.items():
            if key not in resolved and (item := self._resolve(key, entry, None)) is not None:
                resolved[key] = item

        return [resolved[k] for k in sorted(resolved)]

    def set_value(self, user, key: str, value: Any) -> ResolvedPreference:
        from habarico.contrib.preferences.models import UserPreference

        self.validate(key, value)
        self._ensure_key_budget(user, key)
        obj, _ = UserPreference.objects.update_or_create(user=user, key=key, defaults={"value": value})
        return ResolvedPreference(key=key, value=obj.value, updated_at=obj.updated_at)

    def _ensure_key_budget(self, user, key: str) -> None:
        """Refuse a NEW key once the user holds the maximum number of preferences.

        Overwriting a key the user already has is always allowed, so nobody who is already
        past the limit is locked out of shrinking or fixing what they stored.
        """
        from habarico.contrib.preferences.models import UserPreference

        limit = preference_settings.MAX_KEYS_PER_USER
        if limit is None:
            return
        every_key_of_user = UserPreference.objects.filter(user=user)
        # Overwriting a key the user already has adds no row, so it never spends budget -- and
        # without this branch a user sitting exactly at the limit could not rewrite anything.
        if every_key_of_user.filter(key=key).exists():
            return
        if every_key_of_user.count() >= limit:
            raise TooManyPreferences(key, limit)

    def delete_value(self, user, key: str) -> None:
        from habarico.contrib.preferences.models import UserPreference

        self._get_entry(key)
        UserPreference.objects.filter(user=user, key=key).delete()

    def delete_values(self, user) -> None:
        from habarico.contrib.preferences.models import UserPreference

        UserPreference.objects.filter(user=user).delete()


preferences = PreferenceRegistry()


def register_preference(
    key: str,
    schema: PreferenceSchema,
    default: Any = EMPTY,
    max_bytes: Optional[int] = None,
) -> None:
    preferences.register(key, schema, default, max_bytes)


def register_preference_pattern(
    pattern: Union[str, re.Pattern],
    schema: PreferenceSchema,
    max_bytes: Optional[int] = None,
) -> None:
    preferences.register_pattern(pattern, schema, max_bytes)


def max_bytes_for(key: str) -> Optional[int]:
    return preferences.max_bytes_for(key)


def is_registered(key: str) -> bool:
    return preferences.is_registered(key)


def get_schema(key: str) -> Dict[str, Any]:
    return preferences.get_schema(key)


def get_default(key: str) -> Any:
    return preferences.get_default(key)


def validate(key: str, value: Any) -> Any:
    return preferences.validate(key, value)


def get_value(user, key: str) -> Optional[ResolvedPreference]:
    return preferences.get_value(user, key)


def set_value(user, key: str, value: Any) -> ResolvedPreference:
    return preferences.set_value(user, key, value)


def get_values(user) -> List[ResolvedPreference]:
    return preferences.get_values(user)


def delete_value(user, key: str) -> None:
    preferences.delete_value(user, key)


def delete_values(user) -> None:
    preferences.delete_values(user)
