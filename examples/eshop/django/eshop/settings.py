"""Settings of the e-shop example. Development only: the secret key and DEBUG are not for production."""

import os

SECRET_KEY = "example-only-not-a-secret"
DEBUG = True
# "django" is the service name in ../compose.yaml, reachable under that name from the frontend
# container.
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "django"]

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "django.contrib.sessions",
    "rest_framework",
    "django_filters",
    "habarico",
    "habarico.contrib.preferences",
    "accounts",
    "shop",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
]

ROOT_URLCONF = "eshop.urls"

# PostgreSQL: habarico locks a record for an update or a delete with an advisory lock. The defaults
# match the database in ../compose.yaml.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "HOST": os.environ.get("PGHOST", "localhost"),
        "PORT": os.environ.get("PGPORT", "5432"),
        "NAME": os.environ.get("PGDATABASE", "eshop"),
        "USER": os.environ.get("PGUSER", "eshop"),
        "PASSWORD": os.environ.get("PGPASSWORD", "eshop"),
    }
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
USE_TZ = True
TIME_ZONE = "UTC"
LANGUAGE_CODE = "en"

# The frontend dev server proxies /api here, so the admin and the API share one origin and the
# session cookie reaches both.
CSRF_TRUSTED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]

# The Rails backend validates the same minimum, so a password the admin accepts against one
# backend is accepted against the other too.
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
]

# The password reset e-mail is printed to the console.
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
DEFAULT_FROM_EMAIL = "eshop@example.com"
# Where the reset link in that e-mail points: the admin's reset-password page.
PASSWORD_RESET_URL = "http://localhost:5173/#/reset-password/{token}"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication"
    ],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.OrderingFilter",
    ],
    # Errors as `{"errors": [...]}`, a validation error as 422 and an anonymous request as 401 -
    # the format the admin maps onto form fields, and the status it signs the user out on.
    "EXCEPTION_HANDLER": "eluvia_base_django.rest_framework.exceptions.custom_exception_handler",
}

ADMIN_REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAdminUser"],
}
