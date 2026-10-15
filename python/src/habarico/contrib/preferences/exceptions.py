class PreferenceError(Exception):
    pass


class PreferenceNotRegistered(PreferenceError, KeyError):
    def __init__(self, key: str) -> None:
        self.key = key
        super().__init__(f'Preference key "{key}" is not registered.')


class PreferenceAlreadyRegistered(PreferenceError):
    def __init__(self, key: str) -> None:
        self.key = key
        super().__init__(f'Preference key "{key}" is already registered.')


class InvalidPreferenceKey(PreferenceError, ValueError):
    def __init__(self, key: str) -> None:
        self.key = key
        super().__init__(
            f'Preference key "{key}" is invalid. Keys must match "^[a-zA-Z][a-zA-Z0-9_.]*$" '
            "(ASCII letters, digits, underscore, dot; must start with a letter)."
        )


class PreferenceValidationError(PreferenceError, ValueError):
    def __init__(self, key: str, message: str) -> None:
        self.key = key
        self.message = message
        super().__init__(f'Value for preference "{key}" failed validation: {message}')


class PreferenceLimitExceeded(PreferenceError, ValueError):
    """Base for the size and count guards. Both surface as 422, like a schema mismatch."""


class PreferenceValueTooLarge(PreferenceLimitExceeded):
    def __init__(self, key: str, limit: int, actual: int) -> None:
        self.key = key
        self.limit = limit
        self.actual = actual
        super().__init__(f'Value for preference "{key}" is {actual} bytes, over the {limit} byte limit.')


class TooManyPreferences(PreferenceLimitExceeded):
    def __init__(self, key: str, limit: int) -> None:
        self.key = key
        self.limit = limit
        super().__init__(
            f'Cannot store preference "{key}": the limit of {limit} preferences per user ' "is already reached."
        )
