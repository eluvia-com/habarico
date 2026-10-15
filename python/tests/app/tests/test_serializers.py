"""
Tests for serializer fields.

Note: These tests verify the serializer configuration and basic functionality.
Full integration tests would require a complete DRF request/response cycle.
"""

from habarico import site
from rest_framework import serializers


def create_viewset_with_action(admin_name, action="list"):
    """Helper to create a viewset with required attributes set."""
    admin = site.get_admin(admin_name)
    viewset = admin.viewset()
    viewset.action = action
    viewset.request = None
    viewset.format_kwarg = None
    viewset.kwargs = {}
    return viewset


class TestSerializerConfiguration:
    """Tests for serializer configuration."""

    def test_serializer_is_model_serializer(self, db):
        """Test that generated serializer is a ModelSerializer."""
        viewset = create_viewset_with_action("article")
        serializer_class = viewset.get_serializer_class()
        assert issubclass(serializer_class, serializers.ModelSerializer)

    def test_serializer_has_model(self, db):
        """Test that serializer has model set."""
        viewset = create_viewset_with_action("article")
        serializer_class = viewset.get_serializer_class()
        assert hasattr(serializer_class.Meta, "model")

    def test_serializer_has_fields(self, db):
        """Test that serializer has fields configured."""
        viewset = create_viewset_with_action("article")
        serializer_class = viewset.get_serializer_class()
        serializer = serializer_class()

        assert "title" in serializer.fields
        assert "content" in serializer.fields


class TestSerializerFieldTypes:
    """Tests for serializer field type handling."""

    def test_foreign_key_field(self, db):
        """Test foreign key field is correctly configured."""
        viewset = create_viewset_with_action("article")
        serializer_class = viewset.get_serializer_class()
        serializer = serializer_class()

        assert "author" in serializer.fields

    def test_choice_field(self, db):
        """Test choice field is correctly configured."""
        viewset = create_viewset_with_action("article")
        serializer_class = viewset.get_serializer_class()
        serializer = serializer_class()

        assert "status" in serializer.fields

    def test_m2m_field(self, db):
        """Test many-to-many field is correctly configured."""
        viewset = create_viewset_with_action("article")
        serializer_class = viewset.get_serializer_class()
        serializer = serializer_class()

        assert "tags" in serializer.fields


class TestReadOnlyFields:
    """Tests for read-only field handling."""

    def test_read_only_fields_configured(self, db):
        """Test that read-only fields are properly configured."""
        viewset = create_viewset_with_action("article")
        serializer_class = viewset.get_serializer_class()
        serializer = serializer_class()

        assert serializer.fields["created_at"].read_only
        assert serializer.fields["updated_at"].read_only

    def test_non_readonly_fields_writable(self, db):
        """Test that non-readonly fields are writable."""
        viewset = create_viewset_with_action("article")
        serializer_class = viewset.get_serializer_class()
        serializer = serializer_class()

        assert not serializer.fields["title"].read_only


class TestSerializerValidation:
    """Tests for serializer validation."""

    def test_valid_data_passes_validation(self, db, author, category):
        """Test that valid data passes validation."""
        viewset = create_viewset_with_action("article", "create")
        serializer_class = viewset.get_serializer_class()

        data = {
            "title": "Test Article",
            "slug": "test-article-validation",
            "content": "Test content",
            "status": "draft",
            "author": author.pk,
        }
        serializer = serializer_class(data=data)
        assert serializer.is_valid(), serializer.errors

    def test_invalid_choice_fails_validation(self, db, author):
        """Test that invalid choice value fails validation."""
        viewset = create_viewset_with_action("article", "create")
        serializer_class = viewset.get_serializer_class()

        data = {
            "title": "Test",
            "slug": "test-invalid-status",
            "content": "Content",
            "status": "invalid_status",
            "author": author.pk,
        }
        serializer = serializer_class(data=data)
        assert not serializer.is_valid()
        assert "status" in serializer.errors


class TestSerializerSerialization:
    """Tests for serializer data serialization."""

    def test_serialize_instance_fields(self, db, article):
        """Test serializing a model instance - verify serializer processes instance."""
        viewset = create_viewset_with_action("article", "retrieve")
        serializer_class = viewset.get_serializer_class()
        serializer = serializer_class(instance=article)

        assert serializer.instance == article
        assert "title" in serializer.fields
        assert "content" in serializer.fields
        assert "status" in serializer.fields


class TestSerializerCreation:
    """Tests for serializer object creation."""

    def test_create_object(self, db, author, category):
        """Test creating an object through serializer."""
        viewset = create_viewset_with_action("article", "create")
        serializer_class = viewset.get_serializer_class()

        data = {
            "title": "New Article",
            "slug": "new-article-create",
            "content": "New content",
            "status": "draft",
            "author": author.pk,
            "category": category.pk,
        }
        serializer = serializer_class(data=data)
        assert serializer.is_valid(), serializer.errors

        instance = serializer.save()
        assert instance.pk is not None
        assert instance.title == "New Article"
        assert instance.author == author


class TestNestedFieldOptions:
    """Tests for nested field options structure (HAB-404)."""

    def test_choice_field_icons_key_nested(self):
        from habarico.serializers.fields import AdminChoiceField

        field = AdminChoiceField(choices=[("a", "A")], icons_key="my_icons")
        options = field.get_options()
        assert "choices" in options
        assert options["choices"] == {"icons_key": "my_icons"}
        assert "iconsKey" not in options

    def test_choice_field_without_icons_key(self):
        from habarico.serializers.fields import AdminChoiceField

        field = AdminChoiceField(choices=[("a", "A")])
        options = field.get_options()
        assert "choices" not in options
        assert "iconsKey" not in options

    def test_image_serializer_nested_options(self):
        from habarico.serializers.fields import AdminImageFileSerializer

        field = AdminImageFileSerializer(resize_width=200, crop_aspect_ratio=1.5)
        options = field.get_options()
        assert "image" in options
        assert options["image"]["resize_width"] == 200
        assert options["image"]["crop_aspect_ratio"] == 1.5
        assert "resize_width" not in options
        assert "crop_aspect_ratio" not in options

    def test_image_serializer_partial_options(self):
        from habarico.serializers.fields import AdminImageFileSerializer

        field = AdminImageFileSerializer(resize_width=100)
        options = field.get_options()
        assert options["image"] == {"resize_width": 100}
        assert "crop_aspect_ratio" not in options["image"]

    def test_image_serializer_no_image_options(self):
        from habarico.serializers.fields import AdminImageFileSerializer

        field = AdminImageFileSerializer()
        options = field.get_options()
        assert "image" not in options

    def test_image_serializer_derives_accept_wildcard(self):
        """`AdminImageFileSerializer` always carries Django's `validate_image_file_extension`, so
        even with no explicit validators it advertises `accept: ["image/*"]` (HAB-965/HAB-966)."""
        from habarico.serializers.fields import AdminImageFileSerializer

        options = AdminImageFileSerializer().get_options()
        assert options["accept"] == ["image/*"]

    def test_file_serializer_derives_max_size_and_accept(self):
        from django.core.validators import FileExtensionValidator
        from habarico.serializers.fields import AdminFileSerializer
        from habarico.validators import MaxFileSizeValidator

        field = AdminFileSerializer(
            validators=[MaxFileSizeValidator(5_000_000), FileExtensionValidator(allowed_extensions=["pdf"])]
        )
        options = field.get_options()
        assert options["max_size"] == 5_000_000
        assert options["accept"] == ["application/pdf"]

    def test_file_serializer_without_validators_derives_nothing(self):
        from habarico.serializers.fields import AdminFileSerializer

        options = AdminFileSerializer().get_options()
        assert "max_size" not in options
        assert "accept" not in options

    def test_explicit_max_size_option_wins_over_the_validator(self):
        from habarico.serializers.fields import AdminFileSerializer
        from habarico.validators import MaxFileSizeValidator

        field = AdminFileSerializer(validators=[MaxFileSizeValidator(5_000_000)], options={"max_size": 1_000})
        assert field.get_options()["max_size"] == 1_000

    def test_tree_relation_parent_in_relation(self):
        from app.models import Category
        from habarico.serializers.fields import TreePrimaryKeyRelatedField

        field = TreePrimaryKeyRelatedField(
            queryset=Category.objects.all(), reference="category", parent_field="parent", sort_by="name"
        )
        options = field.get_options()
        assert "parent" not in options
        assert "relation" in options
        assert options["relation"]["parent"] == "parent"
        assert options["relation"]["sort"] == {"field_name": "name", "direction": "ASC"}

    def test_tree_relation_sort_desc(self):
        from app.models import Category
        from habarico.serializers.fields import TreePrimaryKeyRelatedField

        field = TreePrimaryKeyRelatedField(
            queryset=Category.objects.all(), reference="category", parent_field="parent", sort_by="-name"
        )
        options = field.get_options()
        assert options["relation"]["sort"] == {"field_name": "name", "direction": "DESC"}


class TestFieldOptionsSchema:
    """Tests for FieldOptions descriptor schema class (HAB-404)."""

    def test_choices_options_in_schema(self):
        from habarico.schema.base import SchemaContext
        from habarico.schema.fields import ChoicesFieldOptions, FieldOptions

        fo = FieldOptions(choices=ChoicesFieldOptions(icons_key="my_icons"))
        ctx = SchemaContext()
        result = fo.to_dict(context=ctx)
        assert result["choices"] == {"icons_key": "my_icons"}
        assert "icons_key" not in result

    def test_image_options_in_schema(self):
        from habarico.schema.base import SchemaContext
        from habarico.schema.fields import FieldOptions, ImageFieldOptions

        fo = FieldOptions(image=ImageFieldOptions(resize_width=300, crop_aspect_ratio="16:9"))
        ctx = SchemaContext()
        result = fo.to_dict(context=ctx)
        assert result["image"] == {"resize_width": 300, "crop_aspect_ratio": "16:9"}

    def test_ai_options_in_schema(self):
        from habarico.schema.base import SchemaContext
        from habarico.schema.fields import AiFieldOptions, FieldOptions

        fo = FieldOptions(ai=AiFieldOptions(source_fields=["a", "b"]))
        ctx = SchemaContext()
        result = fo.to_dict(context=ctx)
        assert result["ai"] == {"source_fields": ["a", "b"]}
        assert "ai_source_fields" not in result

    def test_relation_options_with_parent(self):
        from habarico.schema.base import SchemaContext
        from habarico.schema.fields import FieldOptions, RelationFieldOptions

        fo = FieldOptions(relation=RelationFieldOptions(parent="category"))
        ctx = SchemaContext()
        result = fo.to_dict(context=ctx)
        assert result["relation"]["parent"] == "category"

    def test_generic_options_unchanged(self):
        from habarico.schema.base import SchemaContext
        from habarico.schema.fields import FieldOptions

        fo = FieldOptions(prefix="$", postfix="pcs", text_align="right")
        ctx = SchemaContext()
        result = fo.to_dict(context=ctx)
        assert result["prefix"] == "$"
        assert result["postfix"] == "pcs"
        assert result["text_align"] == "right"
