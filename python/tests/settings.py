"""
Django settings for habarico test application.
"""

SECRET_KEY = "test-secret-key-for-habarico-tests"

DEBUG = True

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "rest_framework",
    "django_filters",
    "app",
    "habarico",
    "habarico.contrib.preferences",
]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
        "ATOMIC_REQUESTS": False,
    }
}

ROOT_URLCONF = "urls"

USE_TZ = True
TIME_ZONE = "UTC"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.OrderingFilter",
    ],
    "EXCEPTION_HANDLER": "eluvia_base_django.rest_framework.exceptions.custom_exception_handler",
}

ADMIN_REST_FRAMEWORK = {
    # Pagination is deliberately left at habarico's own default (``AdminModelPagination``), so the
    # suite exercises the paginator the library actually ships - including its fallback page size,
    # which is what an unconfigured project gets.
    # The suite exercises endpoint behavior, not authentication — requests are anonymous.
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    # The test project has openpyxl, so it offers XLSX next to the built-in CSV. The exporting test
    # admins opt in themselves (``export_enabled``), which keeps the export out of the schema of
    # every other resource.
    "EXPORT_RENDERER_CLASSES": [
        "habarico.export.renderers.CsvRenderer",
        "habarico.export.renderers.XlsxRenderer",
    ],
}
