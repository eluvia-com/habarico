"""
Tests for test app models.
"""

import uuid

from app.models import Article, Product


class TestArticleModel:
    """Tests for Article test model."""

    def test_create_article(self, db, author, category):
        """Test creating an article."""
        article = Article.objects.create(
            title="Test Article",
            slug="test-article",
            content="Test content",
            author=author,
            category=category,
        )
        assert article.pk is not None
        assert article.status == Article.Status.DRAFT

    def test_article_str(self, db, article):
        """Test article string representation."""
        assert str(article) == article.title

    def test_article_default_ordering(self, db, author):
        """Test article default ordering."""
        Article.objects.create(
            title="First",
            slug="first",
            content="Content",
            author=author,
        )
        article2 = Article.objects.create(
            title="Second",
            slug="second",
            content="Content",
            author=author,
        )

        articles = list(Article.objects.all())
        assert articles[0] == article2


class TestProductModel:
    """Tests for Product test model with UUID."""

    def test_create_product(self, db):
        """Test creating a product with UUID."""
        product = Product.objects.create(
            name="Test Product",
            price=99.99,
            stock=10,
        )
        assert product.pk is not None
        assert isinstance(product.pk, uuid.UUID)

    def test_product_str(self, db, product):
        """Test product string representation."""
        assert str(product) == product.name
