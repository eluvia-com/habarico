"""
Tests for filter classes.
"""

from app.models import Article
from habarico.filters import model_filter_set_factory


class TestFilterSetFactory:
    """Tests for model_filter_set_factory."""

    def test_filter_set_creation(self, db):
        """Test automatic filter set creation."""
        filter_set_class = model_filter_set_factory(Article, fields=["status", "author"])

        assert filter_set_class is not None
        assert "status" in filter_set_class.base_filters
        assert "author" in filter_set_class.base_filters

    def test_filter_set_with_lookups(self, db):
        """Test filter set with lookup expressions."""
        filter_set_class = model_filter_set_factory(
            Article, fields={"title": ["exact", "icontains"], "view_count": ["exact", "gte", "lte"]}
        )

        assert filter_set_class is not None
