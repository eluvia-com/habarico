"""
Test models for habarico library testing.
"""

import uuid

from django.db import models
from habarico.models import MoneyField


class Category(models.Model):
    """Test category model for testing relations."""

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "app"
        verbose_name = "Category"
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


class Tag(models.Model):
    """Test tag model for M2M relations."""

    name = models.CharField(max_length=50)

    class Meta:
        app_label = "app"

    def __str__(self):
        return self.name


class Author(models.Model):
    """Test author model."""

    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    bio = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        app_label = "app"

    def __str__(self):
        return self.name


class Article(models.Model):
    """Test article model with various field types and relations."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        ARCHIVED = "archived", "Archived"

    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    content = models.TextField()
    summary = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)

    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name="articles")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="articles")
    tags = models.ManyToManyField(Tag, blank=True, related_name="articles")

    view_count = models.IntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    priority = models.FloatField(default=1.0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateField(null=True, blank=True)

    class Meta:
        app_label = "app"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class Product(models.Model):
    """Test product model with UUID primary key."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    price_money = MoneyField(currency="USD", null=True, blank=True)
    stock = models.IntegerField(default=0)
    is_available = models.BooleanField(default=True)

    class Meta:
        app_label = "app"

    def __str__(self):
        return self.name
