"""
Pytest configuration and fixtures for habarico tests.
"""

import os

import django
import pytest
from app.models import Article, Author, Category, Product, Tag
from rest_framework.test import APIClient, APIRequestFactory

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "tests.settings")


def pytest_configure():
    """Configure Django for pytest."""
    django.setup()


@pytest.fixture(scope="session")
def django_db_setup(django_db_blocker):
    """Set up the test database with migrations."""
    from django.conf import settings
    from django.core.management import call_command

    settings.DATABASES["default"] = {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
        "ATOMIC_REQUESTS": False,
    }

    with django_db_blocker.unblock():
        call_command("migrate", "--run-syncdb", verbosity=0)


@pytest.fixture
def category(db):
    """Create a test category."""
    return Category.objects.create(name="Test Category", description="A test category")


@pytest.fixture
def tag(db):
    """Create a test tag."""
    return Tag.objects.create(name="Test Tag")


@pytest.fixture
def author(db):
    """Create a test author."""
    return Author.objects.create(name="Test Author", email="author@test.com", bio="Test bio", is_active=True)


@pytest.fixture
def article(db, author, category):
    """Create a test article."""
    return Article.objects.create(
        title="Test Article",
        slug="test-article",
        content="Test content for the article",
        summary="Test summary",
        status=Article.Status.DRAFT,
        author=author,
        category=category,
        view_count=100,
        rating=4.5,
        priority=1.0,
    )


@pytest.fixture
def product(db):
    """Create a test product."""
    return Product.objects.create(name="Test Product", price=99.99, stock=10, is_available=True)


@pytest.fixture
def api_client():
    """Create a DRF test client."""
    return APIClient()


@pytest.fixture
def request_factory():
    """Create a DRF request factory."""
    return APIRequestFactory()


@pytest.fixture
def mock_request(request_factory):
    """Create a mock DRF request."""
    from rest_framework.request import Request

    wsgi_request = request_factory.get("/")
    wsgi_request.user = None
    # Wrap in DRF Request to provide _request attribute
    return Request(wsgi_request)
