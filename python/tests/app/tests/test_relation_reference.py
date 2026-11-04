"""
Tests for the reference a relation field or filter carries.

It is the resource the relation points at, which the client addresses to render the related object
and to offer its records as choices. On the wire it is the same address object every other reference
in the schema uses; what an admin author writes stays a plain resource name.
"""

from app.models import Article, Category
from habarico.schema.fields import FieldSchema, FilterSchema
from habarico.schema.reference import ResourceReference
from habarico.schema.types import FieldFormatType, FieldType
from habarico.utils import get_reference_from_model


class TestRelationFieldReference:

    def test_a_resource_name_becomes_an_address(self):
        data = FieldSchema(name="category", type=FieldType.STRING, reference="category").to_dict()

        assert data["reference"] == {"resource": "category"}

    def test_a_foreign_service_splits_in_two(self):
        data = FieldSchema(name="teacher", type=FieldType.STRING, reference="school/teacher").to_dict()

        assert data["reference"] == {"service": "school", "resource": "teacher"}

    def test_an_address_object_is_taken_as_given(self):
        reference = ResourceReference("category")
        data = FieldSchema(name="category", type=FieldType.STRING, reference=reference).to_dict()

        assert data["reference"] == {"resource": "category"}

    def test_no_relation_emits_no_reference(self):
        assert "reference" not in FieldSchema(name="title", type=FieldType.STRING).to_dict()


class TestRelationFilterReference:

    def test_a_resource_name_becomes_an_address(self):
        data = FilterSchema(
            name="category", type=FieldType.STRING, format=FieldFormatType.RELATION, reference="category"
        ).to_dict()

        assert data["reference"] == {"resource": "category"}

    def test_no_relation_emits_no_reference(self):
        assert "reference" not in FilterSchema(name="title", type=FieldType.STRING).to_dict()


class TestReferenceFromModel:
    """
    The helper stays a plain name: the serializer field it feeds decides locality by looking for a
    slash in it, and the filter options do the same. The address object is built at the schema
    boundary instead.
    """

    def test_a_registered_model_resolves_to_its_name(self, db):
        assert get_reference_from_model(Category) == "category"

    def test_an_unregistered_model_resolves_to_nothing(self, db):
        class Unregistered(Article):
            class Meta:
                proxy = True

        assert get_reference_from_model(Unregistered) is None


class TestRelationReferenceEndToEnd:

    def test_a_relation_field_of_a_real_admin_carries_the_address(self, db, api_client):
        """
        Read where a field's own schema lives: under ``endpoints``, per HTTP method. A view's box
        holds field *descriptors*, which name a field without describing it.
        """
        schema = api_client.get("/admin/article/schema/").json()

        category = next(field for field in schema["endpoints"]["post"]["fields"] if field["name"] == "category")

        assert category["format"] == "relation"
        assert category["reference"] == {"resource": "category"}

    def test_a_view_endpoint_of_this_resource_carries_no_address(self, db, api_client):
        """An absent address is the resource the schema was generated for, which a view's own is."""
        schema = api_client.get("/admin/article/schema/").json()

        create = next(view for view in schema["views"] if view["name"] == "create")

        assert create["endpoint"] == {"method": "post"}

    def test_a_view_with_an_action_name_names_the_resource_it_belongs_to(self, db):
        """
        ``action_name`` lives inside the address, and an address is either omitted or complete — so a
        view that has one cannot leave the resource out.
        """
        from habarico.schema.generators import ActionViewSchemaGenerator
        from habarico.schema.types import RequestMethodType
        from habarico.site import site

        generator = ActionViewSchemaGenerator(name="publish", action_name="publish", method=RequestMethodType.POST)

        endpoint = generator.bind(admin=site.get_admin("article")).get_endpoint_parameters().to_dict()

        assert endpoint["reference"] == {"resource": "article", "action_name": "publish"}
