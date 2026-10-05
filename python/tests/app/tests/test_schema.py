"""
Tests for schema generation.

This module contains comprehensive tests for all schema generators including:
- View schema generators (List, Create, Edit, Show, Action)
- Action schema generators (Create, Edit, Show, Delete, Link, ViewLink)
- Field and Filter schema generators
- Menu and Admin schema generators
- Helper functions for field type/format detection
"""

import pytest
from django.core.validators import RegexValidator
from habarico import site
from habarico.schema.actions import (
    ExportActionDescriptor,
    ExportActionParameters,
    SaveActionDescriptor,
    UploadImagesActionDescriptor,
    UploadImagesActionParameters,
)
from habarico.schema.boxes import Box, TabBox, TabItemBox, WizardBox
from habarico.schema.fields import (
    Field,
    MaxLengthValidatorRule,
    RegexValidatorRule,
    ValidatorRule,
)
from habarico.schema.generators import (
    CreateViewSchemaGenerator,
    EditViewSchemaGenerator,
    FieldSchemaGenerator,
    ListViewSchemaGenerator,
    ShowViewSchemaGenerator,
    get_field_format,
    get_field_type,
)
from habarico.schema.types import (
    FieldFormatType,
    FieldType,
    RequestMethodType,
    ViewType,
)
from habarico.serializers.fields import AdminCharField
from rest_framework.fields import (
    BooleanField,
    CharField,
    ChoiceField,
    DateField,
    DateTimeField,
    DecimalField,
    EmailField,
    FloatField,
    IntegerField,
    SlugField,
    URLField,
    UUIDField,
)
from rest_framework.serializers import ListSerializer, Serializer


class TestFieldTypeDetection:
    """Tests for get_field_type helper function."""

    def test_integer_field_type(self):
        """Test IntegerField returns INTEGER type."""
        field = IntegerField()
        assert get_field_type(field) == FieldType.INTEGER

    def test_float_field_type(self):
        """Test FloatField returns NUMBER type."""
        field = FloatField()
        assert get_field_type(field) == FieldType.NUMBER

    def test_boolean_field_type(self):
        """Test BooleanField returns BOOLEAN type."""
        field = BooleanField()
        assert get_field_type(field) == FieldType.BOOLEAN

    def test_char_field_type(self):
        """Test CharField returns STRING type (default)."""
        field = CharField()
        assert get_field_type(field) == FieldType.STRING

    def test_decimal_field_type(self):
        """Test DecimalField returns STRING type."""
        field = DecimalField(max_digits=10, decimal_places=2)
        assert get_field_type(field) == FieldType.STRING

    def test_list_serializer_type(self):
        """Test ListSerializer returns ARRAY type."""
        field = ListSerializer(child=CharField())
        assert get_field_type(field) == FieldType.ARRAY

    def test_serializer_type(self):
        """Test Serializer returns OBJECT type."""

        class NestedSerializer(Serializer):
            name = CharField()

        field = NestedSerializer()
        assert get_field_type(field) == FieldType.OBJECT


class TestFieldFormatDetection:
    """Tests for get_field_format helper function."""

    def test_date_field_format(self):
        """Test DateField returns DATE format."""
        field = DateField()
        assert get_field_format(field) == FieldFormatType.DATE

    def test_datetime_field_format(self):
        """Test DateTimeField returns DATETIME format."""
        field = DateTimeField()
        assert get_field_format(field) == FieldFormatType.DATETIME

    def test_email_field_format(self):
        """Test EmailField returns EMAIL format."""
        field = EmailField()
        assert get_field_format(field) == FieldFormatType.EMAIL

    def test_url_field_format(self):
        """Test URLField returns URL format."""
        field = URLField()
        assert get_field_format(field) == FieldFormatType.URL

    def test_uuid_field_format(self):
        """Test UUIDField returns UUID format."""
        field = UUIDField()
        assert get_field_format(field) == FieldFormatType.UUID

    def test_choice_field_format(self):
        """Test ChoiceField returns CHOICES format."""
        field = ChoiceField(choices=[("a", "A"), ("b", "B")])
        assert get_field_format(field) == FieldFormatType.CHOICES

    def test_decimal_field_format(self):
        """Test DecimalField returns DECIMAL format."""
        field = DecimalField(max_digits=10, decimal_places=2)
        assert get_field_format(field) == FieldFormatType.DECIMAL

    def test_char_field_format_none(self):
        """Test CharField returns None format (no specific format)."""
        field = CharField()
        assert get_field_format(field) is None

    def test_custom_format_attribute(self):
        """Test field with custom format attribute."""
        field = CharField()
        field.format = FieldFormatType.TEXT
        assert get_field_format(field) == FieldFormatType.TEXT


class TestAdminSchemaStructure:
    """Tests for AdminSchemaGenerator and schema structure."""

    def test_schema_is_dict(self, db, mock_request):
        """Test schema generator returns a dict."""
        admin = site.get_admin("article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)
        assert isinstance(schema_dict, dict)

    def test_schema_has_required_keys(self, db, mock_request):
        """Test schema has required top-level keys."""
        admin = site.get_admin("article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        assert "name" in schema_dict
        assert "label" in schema_dict
        assert "pk_field_name" in schema_dict
        assert "views" in schema_dict
        assert "actions" in schema_dict

    def test_schema_name_matches_admin(self, db, mock_request):
        """Test schema name matches admin name."""
        admin = site.get_admin("article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        assert schema_dict["name"] == "article"

    def test_schema_pk_field_name(self, db, mock_request):
        """Test schema has correct pk_field_name."""
        admin = site.get_admin("article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        assert schema_dict["pk_field_name"] == "id"

    def test_schema_views_is_list(self, db, mock_request):
        """Test schema views is a list."""
        admin = site.get_admin("article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        assert isinstance(schema_dict["views"], list)
        assert len(schema_dict["views"]) > 0

    def test_schema_actions_is_list(self, db, mock_request):
        """Test schema actions is a list."""
        admin = site.get_admin("article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        assert isinstance(schema_dict["actions"], list)
        assert len(schema_dict["actions"]) > 0

    def test_schema_menu_structure(self, db, mock_request):
        """Test schema menu has correct structure."""
        admin = site.get_admin("article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        assert "menu" in schema_dict
        menu = schema_dict["menu"]
        assert isinstance(menu, dict)
        assert "label" in menu

    def test_all_registered_admins_produce_valid_schema(self, db, mock_request):
        """Test all registered admins produce valid schema dict."""
        for name in site._registry:
            admin = site.get_admin(name)
            schema = admin.get_schema(mock_request)
            schema_dict = schema.to_dict(request=mock_request)

            assert isinstance(schema_dict, dict), f"Admin {name} schema is not a dict"
            assert "name" in schema_dict, f"Admin {name} schema missing 'name'"
            assert "views" in schema_dict, f"Admin {name} schema missing 'views'"
            assert "actions" in schema_dict, f"Admin {name} schema missing 'actions'"


class TestViewSchemaStructure:
    """Tests for view schema structure."""

    def test_view_schemas_are_list_of_dicts(self, db, mock_request):
        """Test view schemas are list of dicts."""
        admin = site.get_admin("article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        views = schema_dict["views"]
        assert isinstance(views, list)
        for view in views:
            assert isinstance(view, dict)

    def test_view_schema_has_required_keys(self, db, mock_request):
        """Test each view schema has required keys."""
        admin = site.get_admin("article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        for view in schema_dict["views"]:
            assert "name" in view, f"View missing 'name': {view}"
            assert "type" in view, f"View missing 'type': {view}"
            assert "is_detail" in view, f"View missing 'is_detail': {view}"

    def test_list_view_structure(self, db, mock_request):
        """Test list view has correct structure."""
        admin = site.get_admin("article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        list_views = [v for v in schema_dict["views"] if v["type"].value == "list"]
        assert len(list_views) == 1

        list_view = list_views[0]
        assert list_view["name"] == "list"
        assert list_view["is_detail"] is False
        assert "endpoint" in list_view
        assert isinstance(list_view["endpoint"], dict)

    def test_list_view_contains_endpoint(self, db, mock_request):
        """Test list view contains endpoint definition."""
        admin = site.get_admin("article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        list_views = [v for v in schema_dict["views"] if v["type"].value == "list"]
        list_view = list_views[0]

        assert "endpoint" in list_view
        assert isinstance(list_view["endpoint"], dict)
        assert "method" in list_view["endpoint"]

    def test_create_view_structure(self, db, mock_request):
        """Test create view has correct structure."""
        admin = site.get_admin("article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        create_views = [v for v in schema_dict["views"] if v["type"].value == "create"]
        assert len(create_views) == 1

        create_view = create_views[0]
        assert create_view["name"] == "create"
        assert create_view["is_detail"] is False
        assert "endpoint" in create_view

    def test_edit_view_structure(self, db, mock_request):
        """Test edit view has correct structure."""
        admin = site.get_admin("article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        edit_views = [v for v in schema_dict["views"] if v["type"].value == "edit"]
        assert len(edit_views) == 1

        edit_view = edit_views[0]
        assert edit_view["name"] == "edit"
        assert edit_view["is_detail"] is True
        assert "endpoint" in edit_view

    def test_show_view_structure(self, db, mock_request):
        """Test show view has correct structure."""
        admin = site.get_admin("article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        show_views = [v for v in schema_dict["views"] if v["type"].value == "show"]
        assert len(show_views) == 1

        show_view = show_views[0]
        assert show_view["name"] == "show"
        assert show_view["is_detail"] is True
        assert "endpoint" in show_view

    def test_view_endpoint_structure(self, db, mock_request):
        """Test view endpoint has correct structure."""
        admin = site.get_admin("article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        for view in schema_dict["views"]:
            assert "endpoint" in view, f"View {view['name']} missing 'endpoint'"
            endpoint = view["endpoint"]
            assert isinstance(endpoint, dict)
            assert "method" in endpoint


class TestActionSchemaStructure:
    """Tests for action schema structure."""

    def test_action_schemas_are_list_of_dicts(self, db, mock_request):
        """Test action schemas are list of dicts."""
        admin = site.get_admin("article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        actions = schema_dict["actions"]
        assert isinstance(actions, list)
        for action in actions:
            assert isinstance(action, dict)

    def test_action_schema_has_required_keys(self, db, mock_request):
        """Test each action schema has required keys."""
        admin = site.get_admin("article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        for action in schema_dict["actions"]:
            assert "name" in action, f"Action missing 'name': {action}"
            assert "type" in action, f"Action missing 'type': {action}"

    def test_create_action_structure(self, db, mock_request):
        """Test create action has correct structure."""
        admin = site.get_admin("article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        create_actions = [a for a in schema_dict["actions"] if a["name"] == "create"]
        assert len(create_actions) == 1

        create_action = create_actions[0]
        assert create_action["type"] == "view"
        assert "is_detail" in create_action
        assert create_action["is_detail"] is False

    def test_edit_action_structure(self, db, mock_request):
        """Test edit action has correct structure."""
        admin = site.get_admin("article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        edit_actions = [a for a in schema_dict["actions"] if a["name"] == "edit"]
        assert len(edit_actions) == 1

        edit_action = edit_actions[0]
        assert edit_action["type"] == "view"
        assert edit_action["is_detail"] is True

    def test_show_action_structure(self, db, mock_request):
        """Test show action has correct structure."""
        admin = site.get_admin("article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        show_actions = [a for a in schema_dict["actions"] if a["name"] == "show"]
        assert len(show_actions) == 1

        show_action = show_actions[0]
        assert show_action["type"] == "view"
        assert show_action["is_detail"] is True

    def test_delete_action_structure(self, db, mock_request):
        """Test delete action has correct structure."""
        admin = site.get_admin("article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        delete_actions = [a for a in schema_dict["actions"] if a["name"] == "delete"]
        assert len(delete_actions) == 1

        delete_action = delete_actions[0]
        assert delete_action["type"] == "resource"
        assert delete_action["is_detail"] is True
        assert "show_in_list" in delete_action

    def test_action_count_matches_permissions(self, db, mock_request):
        """Test action count corresponds to admin permissions."""
        # Full CRUD admin should have 4 actions
        full_admin = site.get_admin("article")
        full_schema = full_admin.get_schema(mock_request).to_dict(request=mock_request)
        assert len(full_schema["actions"]) == 4

        # Read-only admin should have fewer actions
        readonly_admin = site.get_admin("readonly_article")
        readonly_schema = readonly_admin.get_schema(mock_request).to_dict(request=mock_request)
        # Even readonly may have all action generators, but they're filtered at render
        assert len(readonly_schema["actions"]) >= 1


class TestActionDefaultIcons:
    """Every default action ships an icon, so the frontend never has to guess one for it."""

    def test_list_action_icons(self, db, api_client, article):
        response = api_client.get("/admin/article/schema/")

        icons = {action["name"]: action.get("icon") for action in response.json()["actions"]}
        assert icons == {"create": "Add"}

    def test_detail_action_icons(self, db, api_client, article):
        response = api_client.get(f"/admin/article/{article.pk}/schema/")

        icons = {action["name"]: action.get("icon") for action in response.json()["actions"]}
        assert icons == {"show": "Visibility", "edit": "Edit", "delete": "Delete"}


class TestMenuSchemaStructure:
    """Tests for menu schema structure."""

    def test_menu_schema_is_dict(self, db, mock_request):
        """Test menu schema is a dict."""
        admin = site.get_admin("article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        assert "menu" in schema_dict
        assert isinstance(schema_dict["menu"], dict)

    def test_menu_has_label(self, db, mock_request):
        """Test menu has label."""
        admin = site.get_admin("article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        menu = schema_dict["menu"]
        assert "label" in menu
        assert isinstance(menu["label"], str)
        assert len(menu["label"]) > 0

    def test_menu_has_type(self, db, mock_request):
        """Test menu has type."""
        admin = site.get_admin("article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        menu = schema_dict["menu"]
        assert "type" in menu

    def test_all_admins_have_menu_with_label(self, db, mock_request):
        """Test all registered admins have menu with label."""
        for name in site._registry:
            admin = site.get_admin(name)
            schema = admin.get_schema(mock_request)
            schema_dict = schema.to_dict(request=mock_request)

            # An admin this request may not read renders no views, and with nothing to link to it
            # contributes no menu entry either - see NoReadArticleAdmin / AuthenticatedArticleAdmin.
            if not schema_dict.get("views"):
                continue

            assert "menu" in schema_dict, f"Admin {name} missing menu"
            assert "label" in schema_dict["menu"], f"Admin {name} menu missing label"


class TestFieldOptionsStructure:
    """The typed FieldOptions must be able to express every slot the contract defines."""

    def test_field_options_carry_number_phone_and_upload(self):
        from habarico.schema.fields import FieldOptions, NumberFieldOptions, PhoneFieldOptions, UploadFieldOptions

        options = FieldOptions(
            number=NumberFieldOptions(style="currency", currency="USD", minimum_fraction_digits=2),
            phone=PhoneFieldOptions(default_region="CZ", allowed_regions=["CZ", "SK"]),
            upload=UploadFieldOptions(provider="tus", chunk_size=1024, endpoint="https://upload.example.com"),
        )
        data = options.to_dict()

        assert data["number"] == {"style": "currency", "currency": "USD", "minimum_fraction_digits": 2}
        assert data["phone"] == {"default_region": "CZ", "allowed_regions": ["CZ", "SK"]}
        assert data["upload"] == {"provider": "tus", "chunk_size": 1024, "endpoint": "https://upload.example.com"}

    def test_filter_schema_carries_help_text(self):
        from habarico.schema.fields import FilterSchema
        from habarico.schema.types import FieldType

        assert FilterSchema(name="title", type=FieldType.STRING, help_text="Search by title").to_dict()[
            "help_text"
        ] == ("Search by title")

    def test_view_action_descriptor_carries_dialog_width(self):
        from habarico.schema.actions import ActionDescriptor
        from habarico.schema.types import DialogWidthType, ViewModeType

        descriptor = ActionDescriptor(name="edit", view_mode=ViewModeType.DIALOG, view_dialog_width=DialogWidthType.MD)

        assert descriptor.to_dict()["view"]["dialog_width"] == "md"


class TestFieldSchemaStructure:
    """Tests for field schema structure within views."""

    def test_list_view_endpoint_structure(self, db, mock_request):
        """Test list view endpoint has correct structure."""
        admin = site.get_admin("article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        list_view = [v for v in schema_dict["views"] if v["type"].value == "list"][0]
        endpoint = list_view["endpoint"]

        assert isinstance(endpoint, dict)
        assert "method" in endpoint

    def test_view_has_required_keys(self, db, mock_request):
        """Test all views have required keys."""
        admin = site.get_admin("article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        for view in schema_dict["views"]:
            assert "name" in view
            assert "type" in view
            assert "is_detail" in view
            assert "endpoint" in view


class TestCategoryAdminSchema:
    """Tests for CategoryAdmin schema."""

    def test_category_schema_structure(self, db, mock_request):
        """Test CategoryAdmin produces valid schema."""
        admin = site.get_admin("category")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        assert schema_dict["name"] == "category"
        assert "views" in schema_dict
        assert "actions" in schema_dict
        assert len(schema_dict["views"]) == 4


class TestProductAdminSchema:
    """Tests for ProductAdmin with UUID primary key."""

    def test_product_schema_structure(self, db, mock_request):
        """Test ProductAdmin produces valid schema."""
        admin = site.get_admin("product")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        assert schema_dict["name"] == "product"
        assert "views" in schema_dict
        assert "actions" in schema_dict

    def test_product_pk_field_is_id(self, db, mock_request):
        """Test ProductAdmin pk_field_name is id (UUID)."""
        admin = site.get_admin("product")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        assert schema_dict["pk_field_name"] == "id"


class TestFreeOnlyResourceSchemaKeys:
    """
    ``global_fulltext_search_enabled`` / ``aggregate_enabled`` / ``dashboard_enabled`` are
    pro/enterprise-contributed keys (see ``SearchAdminMixin`` / ``AggregateAdminMixin`` in
    habarico_enterprise, which declare them on their own ``GlobalResourceSchema`` subclass). None
    of them is required by ``contract/openapi.yaml``, so a free-only install omits them entirely
    rather than advertising features it does not ship.
    """

    ENTERPRISE_KEYS = ("global_fulltext_search_enabled", "aggregate_enabled", "dashboard_enabled")

    def test_enterprise_keys_absent(self, db, mock_request):
        """A free-only admin emits none of the enterprise opt-in keys."""
        admin = site.get_admin("nosearch_article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        for key in self.ENTERPRISE_KEYS:
            assert key not in schema_dict

    def test_enterprise_keys_absent_for_every_registered_admin(self, db, mock_request):
        """Not one registered free-only admin reports an enterprise key."""
        for name in site._registry:
            schema_dict = site.get_admin(name).get_schema(mock_request).to_dict(request=mock_request)
            for key in self.ENTERPRISE_KEYS:
                assert key not in schema_dict, f"{name} reports {key}"


class TestAdminSchemaGeneratorExtensionPoints:
    """
    ``schema_class`` + ``get_resource_schema_kwargs()`` are how a pro/enterprise package adds
    optional keys to the resource schema without core knowing about them (HAB-811).
    """

    def test_subclass_can_contribute_extra_keys(self, db, mock_request):
        from habarico.schema.generators import AdminSchemaGenerator
        from habarico.schema.resource import GlobalResourceSchema

        class _ExtendedResourceSchema(GlobalResourceSchema):
            def __init__(self, *, feature_enabled=False, **kwargs):
                super().__init__(**kwargs)
                self._feature_enabled = feature_enabled

        class _ExtendedGenerator(AdminSchemaGenerator):
            schema_class = _ExtendedResourceSchema

            def get_resource_schema_kwargs(self):
                return {**super().get_resource_schema_kwargs(), "feature_enabled": True}

        admin = site.get_admin("nosearch_article")
        schema_dict = _ExtendedGenerator(admin).to_dict(request=mock_request)

        assert schema_dict["feature_enabled"] is True
        # The core keys still come from one place.
        assert schema_dict["name"] == admin.name
        assert "views" in schema_dict


class TestViewModeContract:
    """Tests for the SIDEPANEL mode and nullable trigger view_mode (HAB-422 / HAB-594)."""

    def test_view_mode_type_has_sidepanel(self):
        """SIDEPANEL is a valid ViewModeType value."""
        from habarico.schema.types import ViewModeType

        assert ViewModeType.SIDEPANEL == "sidepanel"

    def test_resource_view_action_without_mode_omits_mode_key(self):
        """A view action built without view_mode must not emit a 'mode' key (FE reads absence as redirect)."""
        from habarico.schema.actions import ResourceActionSchema
        from habarico.schema.types import ActionType

        action = ResourceActionSchema(name="show", type=ActionType.VIEW, reference="article")
        data = action.to_dict()

        assert "view" in data
        assert "mode" not in data["view"]

    def test_resource_view_action_with_mode_emits_mode_key(self):
        """An explicit view_mode is emitted verbatim."""
        from habarico.schema.actions import ResourceActionSchema
        from habarico.schema.types import ActionType, ViewModeType

        action = ResourceActionSchema(
            name="show", type=ActionType.VIEW, reference="article", view_mode=ViewModeType.SIDEPANEL
        )
        data = action.to_dict()

        assert data["view"]["mode"] == "sidepanel"

    def test_action_schema_without_mode_omits_mode_key(self):
        """ActionSchema view without view_mode must not emit a 'mode' key."""
        from habarico.schema.actions import ActionSchema
        from habarico.schema.types import ActionType

        action = ActionSchema(type=ActionType.VIEW, reference="article")
        data = action.to_dict()

        assert "view" in data
        assert "mode" not in data["view"]

    def test_action_schema_with_mode_emits_mode_key(self):
        """ActionSchema view with view_mode emits it."""
        from habarico.schema.actions import ActionSchema
        from habarico.schema.types import ActionType, ViewModeType

        action = ActionSchema(type=ActionType.VIEW, reference="article", view_mode=ViewModeType.DIALOG)
        data = action.to_dict()

        assert data["view"]["mode"] == "dialog"

    def test_action_schema_link_emits_link_parameters(self):
        """A link ActionSchema carries url and target, with the target stored without the underscore."""
        from habarico.schema.actions import ActionSchema
        from habarico.schema.types import ActionType, LinkTargetType

        action = ActionSchema(
            type=ActionType.LINK, label="Docs", link_url="https://docs.example.com", link_target=LinkTargetType.BLANK
        )
        data = action.to_dict()

        assert data["link"] == {"url": "https://docs.example.com", "target": "blank"}

    def test_resource_action_schema_link_emits_link_parameters(self):
        """The same branch on the resource-level action schema."""
        from habarico.schema.actions import ResourceActionSchema
        from habarico.schema.types import ActionType, LinkTargetType

        action = ResourceActionSchema(
            name="docs", type=ActionType.LINK, link_url="https://docs.example.com", link_target=LinkTargetType.SELF
        )
        data = action.to_dict()

        assert data["link"] == {"url": "https://docs.example.com", "target": "self"}

    def test_menu_schema_link_emits_link_parameters(self):
        """A link menu item carries the same shared LinkActionParameters."""
        from habarico.schema.menu import MenuSchema
        from habarico.schema.types import LinkTargetType, MenuType

        menu = MenuSchema(
            name="docs",
            label="Docs",
            type=MenuType.LINK,
            link_url="https://docs.example.com",
            link_target=LinkTargetType.BLANK,
        )
        data = menu.to_dict()

        assert data["type"] == "link"
        assert data["link"] == {"url": "https://docs.example.com", "target": "blank"}

    def test_action_schema_emits_confirm_dialog(self):
        """Title and message are nested under confirm_dialog."""
        from habarico.schema.actions import ActionSchema
        from habarico.schema.types import ActionType

        action = ActionSchema(
            type=ActionType.VIEW,
            reference="article",
            confirm_dialog_title="Delete?",
            confirm_dialog_message="This cannot be undone.",
        )
        data = action.to_dict()

        assert data["confirm_dialog"] == {"title": "Delete?", "message": "This cannot be undone."}

    def test_action_schema_resource_builds_the_endpoint(self):
        """A resource ActionSchema nests its call target in `resource.endpoint`, like ResourceActionSchema."""
        from habarico.schema.actions import ActionSchema
        from habarico.schema.types import ActionType

        action = ActionSchema(
            type=ActionType.RESOURCE,
            reference="article",
            record_pk=7,
            resource_path="/admin/articles/7/approve/",
            resource_method="post",
            resource_data={"note": "ok"},
        )
        resource = action.to_dict()["resource"]

        assert resource["endpoint"] == {
            "method": "post",
            "path": "/admin/articles/7/approve/",
            "reference": {"resource": "article", "record_pk": 7},
        }
        assert resource["data"] == {"note": "ok"}
        # The reference belongs to the endpoint only - it used to be carried twice.
        assert "reference" not in resource

    def test_view_schema_emits_mode_when_set(self):
        """A view carrying a default mode emits it (FE fallback when trigger has no mode)."""
        from habarico.schema.types import ViewModeType, ViewType
        from habarico.schema.views import ListViewParameters, ViewSchema

        view = ViewSchema(
            name="list",
            type=ViewType.LIST,
            is_detail=False,
            list=ListViewParameters(),
            mode=ViewModeType.SIDEPANEL,
        )
        data = view.to_dict()

        assert data["mode"] == "sidepanel"

    def test_view_schema_omits_mode_when_none(self):
        """A view without a default mode does not emit the key."""
        from habarico.schema.types import ViewType
        from habarico.schema.views import ListViewParameters, ViewSchema

        view = ViewSchema(name="list", type=ViewType.LIST, is_detail=False, list=ListViewParameters())
        data = view.to_dict()

        assert "mode" not in data

    def test_show_view_generator_propagates_view_mode(self, db, mock_request):
        """A show generator configured with view_mode surfaces it in the rendered view schema."""
        admin = site.get_admin("sidepanel_article")
        schema_dict = admin.get_schema(mock_request).to_dict(request=mock_request)

        show_views = [v for v in schema_dict["views"] if v["type"] == "show"]
        assert len(show_views) == 1
        assert show_views[0]["mode"] == "sidepanel"

    def test_default_views_omit_view_mode(self, db, mock_request):
        """Views without an explicit mode do not emit the key (backward compatible)."""
        admin = site.get_admin("article")
        schema_dict = admin.get_schema(mock_request).to_dict(request=mock_request)

        for view in schema_dict["views"]:
            assert "mode" not in view

    def test_default_view_actions_omit_mode(self, db, mock_request):
        """Default view actions no longer emit an explicit 'redirect' mode (FE treats absence as redirect)."""
        admin = site.get_admin("article")
        schema_dict = admin.get_schema(mock_request).to_dict(request=mock_request)

        view_actions = [a for a in schema_dict["actions"] if a.get("type") == "view"]
        assert view_actions  # create / show / edit are view actions
        for action in view_actions:
            assert "mode" not in action.get("view", {})


class TestSingleClickPreview:
    """Tests for list-view single-click preview config (HAB-422 / HAB-594).

    ``single_click_action`` is a full action (ActionDescriptor) carrying its own ``view_mode``; a plain
    string is accepted and normalized into an action descriptor.
    """

    def test_list_params_emit_single_click_action_descriptor(self):
        """ListViewParameters serializes single_click_action as an action carrying its view mode."""
        from habarico.schema.actions import Action
        from habarico.schema.types import ViewModeType
        from habarico.schema.views import ListViewParameters

        params = ListViewParameters(single_click_action=Action(name="show", view_mode=ViewModeType.SIDEPANEL))
        data = params.to_dict()

        assert data["single_click_action"] == {"type": "action", "name": "show", "view": {"mode": "sidepanel"}}

    def test_list_params_normalize_string_single_click_action(self):
        """A plain string is normalized into an action descriptor (mode left to frontend precedence)."""
        from habarico.schema.views import ListViewParameters

        data = ListViewParameters(single_click_action="show").to_dict()

        assert data["single_click_action"] == {"type": "action", "name": "show"}

    def test_list_params_omit_single_click_when_unset(self):
        """When single-click is not configured the key is absent (backward compatible)."""
        from habarico.schema.views import ListViewParameters

        data = ListViewParameters(sortable_field_name="position").to_dict()

        assert "single_click_action" not in data

    def test_generator_stores_single_click_action(self):
        """ListViewSchemaGenerator keeps the configured single-click action."""
        from habarico.schema.actions import Action
        from habarico.schema.types import ViewModeType

        action = Action(name="show", view_mode=ViewModeType.SIDEPANEL)
        generator = ListViewSchemaGenerator(single_click_action=action)

        assert generator.single_click_action is action

    def test_single_click_absent_by_default(self):
        """Without any single-click config the getter yields nothing (single click inert, as today)."""
        generator = ListViewSchemaGenerator()

        assert generator.get_single_click_action() is None

    def test_single_click_emitted_regardless_of_target_view(self, db, mock_request):
        """The single-click action is emitted as configured; the backend does not gate it by view
        availability (the frontend resolves the target and falls back on its own)."""
        from habarico.schema.actions import Action
        from habarico.schema.types import ViewModeType

        admin = site.get_admin("noshow_article")  # list only, no show view
        generator = ListViewSchemaGenerator(
            single_click_action=Action(name="show", view_mode=ViewModeType.SIDEPANEL)
        ).bind(admin=admin)
        generator.setup(request=mock_request)

        assert generator.get_single_click_action() is not None

    def test_full_list_schema_endpoint_emits_single_click(self, db, api_client):
        """End-to-end: the rendered list-view schema exposes the single-click preview action."""
        response = api_client.get("/admin/sidepanel_article/schema/")
        assert response.status_code == 200

        list_views = [v for v in response.data["views"] if v["type"] == "list"]
        assert len(list_views) == 1
        assert list_views[0]["list"]["single_click_action"] == {
            "type": "action",
            "name": "show",
            "view": {"mode": "sidepanel"},
        }

    def test_list_box_passes_single_click_action(self):
        """An embedded ListBox forwards the single-click action (mirror of double_click_action)."""
        from habarico.schema.actions import Action
        from habarico.schema.boxes import ListBox
        from habarico.schema.types import ViewModeType

        box = ListBox(
            reference="article",
            single_click_action=Action(name="show", view_mode=ViewModeType.SIDEPANEL),
        )
        data = box.to_dict()

        assert data["list"]["single_click_action"] == {"type": "action", "name": "show", "view": {"mode": "sidepanel"}}

    def test_single_click_custom_action_kept(self, db, mock_request):
        """A custom (non-reserved) single-click target is emitted like any other."""
        from habarico.schema.actions import Action
        from habarico.schema.types import ViewModeType

        admin = site.get_admin("noshow_article")
        generator = ListViewSchemaGenerator(
            single_click_action=Action(name="create-invoice", view_mode=ViewModeType.DIALOG)
        ).bind(admin=admin)
        generator.setup(request=mock_request)

        assert generator.get_single_click_action() is not None


class TestDoubleClickAction:
    """``double_click_action`` mirrors ``single_click_action``: a full action carrying its own view mode,
    with a plain string normalized into an action descriptor (HAB-594)."""

    def test_list_params_emit_double_click_action_descriptor(self):
        """ListViewParameters serializes double_click_action as an action carrying its view mode."""
        from habarico.schema.actions import Action
        from habarico.schema.types import ViewModeType
        from habarico.schema.views import ListViewParameters

        params = ListViewParameters(double_click_action=Action(name="edit", view_mode=ViewModeType.DIALOG))
        data = params.to_dict()

        assert data["double_click_action"] == {"type": "action", "name": "edit", "view": {"mode": "dialog"}}

    def test_list_params_normalize_string_double_click_action(self):
        """A plain string is normalized into an action descriptor."""
        from habarico.schema.views import ListViewParameters

        data = ListViewParameters(double_click_action="edit").to_dict()

        assert data["double_click_action"] == {"type": "action", "name": "edit"}

    def test_double_click_emitted_regardless_of_target_view(self, db, mock_request):
        """The double-click action is emitted as configured, even when the admin exposes no matching
        view (no backend gating; the frontend resolves the target itself)."""
        admin = site.get_admin("sidepanel_article")  # only show + list, no edit view
        generator = ListViewSchemaGenerator(double_click_action="edit").bind(admin=admin)
        generator.setup(request=mock_request)

        assert generator.get_double_click_action() is not None

    def test_double_click_custom_action_kept(self, db, mock_request):
        """A custom (non-reserved) double-click target is emitted like any other."""
        admin = site.get_admin("sidepanel_article")
        generator = ListViewSchemaGenerator(double_click_action="create-invoice").bind(admin=admin)
        generator.setup(request=mock_request)

        assert generator.get_double_click_action() is not None

    def test_list_box_passes_double_click_action(self):
        """An embedded ListBox forwards the double-click action as a descriptor."""
        from habarico.schema.actions import Action
        from habarico.schema.boxes import ListBox
        from habarico.schema.types import ViewModeType

        box = ListBox(reference="article", double_click_action=Action(name="edit", view_mode=ViewModeType.DIALOG))
        data = box.to_dict()

        assert data["list"]["double_click_action"] == {"type": "action", "name": "edit", "view": {"mode": "dialog"}}


class TestReadonlyAdminSchema:
    """Tests for read-only admin schema."""

    def test_readonly_schema_structure(self, db, mock_request):
        """Test ReadOnlyArticleAdmin produces valid schema."""
        admin = site.get_admin("readonly_article")
        schema = admin.get_schema(mock_request)
        schema_dict = schema.to_dict(request=mock_request)

        assert schema_dict["name"] == "readonly_article"
        assert "views" in schema_dict
        assert "actions" in schema_dict


class TestListViewSchemaGenerator:
    """Tests for ListViewSchemaGenerator."""

    def test_list_view_default_properties(self):
        """Test ListViewSchemaGenerator default properties."""
        generator = ListViewSchemaGenerator()
        assert generator.type == ViewType.LIST
        assert generator.is_detail is False
        assert generator.method == RequestMethodType.GET
        assert generator.basename == "list"

    def test_list_view_with_fields(self):
        """Test ListViewSchemaGenerator with custom fields."""
        generator = ListViewSchemaGenerator(boxes=["title", "status", "author"])
        assert generator.boxes == ["title", "status", "author"]

    def test_list_view_with_filters(self):
        """Test ListViewSchemaGenerator with custom filters."""
        generator = ListViewSchemaGenerator(filters=["status", "author"])
        assert generator.filters == ["status", "author"]

    def test_list_view_with_sorting(self):
        """Test ListViewSchemaGenerator with default sorting."""
        generator = ListViewSchemaGenerator(default_sorting="-created_at")
        assert generator.default_sorting == "-created_at"

    def test_list_view_with_row_actions(self):
        """Test ListViewSchemaGenerator with row actions."""
        generator = ListViewSchemaGenerator(row_actions=["edit", "delete"])
        assert generator.row_actions == ["edit", "delete"]

    def test_list_view_with_toolbar_actions(self):
        """Test ListViewSchemaGenerator with toolbar actions."""
        generator = ListViewSchemaGenerator(toolbar_actions=["create"])
        assert generator.toolbar_actions == ["create"]

    def test_list_view_with_extra_filters(self):
        """Test ListViewSchemaGenerator with extra filters."""
        generator = ListViewSchemaGenerator(extra_filters={"status": "published"})
        assert generator.extra_filters == {"status": "published"}

    def test_list_view_with_sortable_field(self):
        """Test ListViewSchemaGenerator with sortable field for drag & drop."""
        generator = ListViewSchemaGenerator(sortable_field_name="position")
        assert generator.sortable_field_name == "position"

    def test_list_view_name_override(self):
        """Test ListViewSchemaGenerator with custom name."""
        generator = ListViewSchemaGenerator(name="custom_list")
        assert generator.name == "custom_list"

    def test_list_view_label_override(self):
        """Test ListViewSchemaGenerator with custom label."""
        generator = ListViewSchemaGenerator(label="Custom List View")
        assert generator.label == "Custom List View"


class TestCreateViewSchemaGenerator:
    """Tests for CreateViewSchemaGenerator."""

    def test_create_view_default_properties(self):
        """Test CreateViewSchemaGenerator default properties."""
        generator = CreateViewSchemaGenerator()
        assert generator.type == ViewType.CREATE
        assert generator.is_detail is False
        assert generator.method == RequestMethodType.POST
        assert generator.basename == "create"

    def test_create_view_has_bottom_actions(self):
        """Test CreateViewSchemaGenerator has save bottom action."""
        generator = CreateViewSchemaGenerator()
        assert generator.bottom_actions is not None
        assert len(generator.bottom_actions) == 1

    def test_create_view_with_box(self):
        """Test CreateViewSchemaGenerator with box containing fields."""
        from habarico.schema.boxes import Box

        box = Box(boxes=["title", "slug", "content"])
        generator = CreateViewSchemaGenerator(box=box)
        assert generator.box == box
        assert generator.box is not None


class TestEditViewSchemaGenerator:
    """Tests for EditViewSchemaGenerator."""

    def test_edit_view_default_properties(self):
        """Test EditViewSchemaGenerator default properties."""
        generator = EditViewSchemaGenerator()
        assert generator.type == ViewType.EDIT
        assert generator.is_detail is True
        assert generator.method == RequestMethodType.PUT
        assert generator.basename == "edit"

    def test_edit_view_has_bottom_actions(self):
        """Test EditViewSchemaGenerator has save bottom action."""
        generator = EditViewSchemaGenerator()
        assert generator.bottom_actions is not None
        assert len(generator.bottom_actions) == 1

    def test_edit_view_is_not_readonly(self):
        """Test EditViewSchemaGenerator is not read-only."""
        generator = EditViewSchemaGenerator()
        assert generator.is_read_only is False


class TestShowViewSchemaGenerator:
    """Tests for ShowViewSchemaGenerator."""

    def test_show_view_default_properties(self):
        """Test ShowViewSchemaGenerator default properties."""
        generator = ShowViewSchemaGenerator()
        assert generator.type == ViewType.SHOW
        assert generator.is_detail is True
        assert generator.method == RequestMethodType.GET
        assert generator.basename == "show"

    def test_show_view_read_only(self):
        """Test ShowViewSchemaGenerator is read-only."""
        generator = ShowViewSchemaGenerator()
        assert generator.is_read_only is True

    def test_show_view_no_bottom_actions(self):
        """Test ShowViewSchemaGenerator has no bottom actions by default."""
        generator = ShowViewSchemaGenerator()
        assert generator.bottom_actions is None


class TestViewSchemaGeneratorInheritance:
    """Tests for view schema generator class inheritance."""

    def test_list_view_inherits_correctly(self):
        """Test ListViewSchemaGenerator has correct inheritance chain."""
        from habarico.schema.generators import (
            ListViewSchemaGenerator,
            ResourceViewSchemaGeneratorMixin,
            ViewSchemaGenerator,
        )

        assert issubclass(ListViewSchemaGenerator, ViewSchemaGenerator)
        assert issubclass(ListViewSchemaGenerator, ResourceViewSchemaGeneratorMixin)

    def test_create_view_inherits_correctly(self):
        """Test CreateViewSchemaGenerator has correct inheritance chain."""
        from habarico.schema.generators import (
            CreateViewSchemaGenerator,
            ResourceDetailViewSchemaGenerator,
        )

        assert issubclass(CreateViewSchemaGenerator, ResourceDetailViewSchemaGenerator)

    def test_edit_view_inherits_correctly(self):
        """Test EditViewSchemaGenerator has correct inheritance chain."""
        from habarico.schema.generators import (
            EditViewSchemaGenerator,
            ResourceDetailViewSchemaGenerator,
        )

        assert issubclass(EditViewSchemaGenerator, ResourceDetailViewSchemaGenerator)

    def test_show_view_inherits_correctly(self):
        """Test ShowViewSchemaGenerator has correct inheritance chain."""
        from habarico.schema.generators import (
            ResourceDetailViewSchemaGenerator,
            ShowViewSchemaGenerator,
        )

        assert issubclass(ShowViewSchemaGenerator, ResourceDetailViewSchemaGenerator)


class TestAdminConfiguration:
    """Tests for admin configuration affecting schemas."""

    def test_article_admin_can_crud(self, db):
        """Test ArticleAdmin has full CRUD permissions."""
        admin = site.get_admin("article")
        assert admin.can_create is True
        assert admin.can_read is True
        assert admin.can_update is True
        assert admin.can_delete is True

    def test_readonly_admin_permissions(self, db):
        """Test ReadOnlyArticleAdmin has read-only permissions."""
        admin = site.get_admin("readonly_article")
        assert admin.can_create is False
        assert admin.can_read is True
        assert admin.can_update is False
        assert admin.can_delete is False


class TestSchemaGeneratorInstantiation:
    """Tests for schema generator instantiation with various parameters."""

    def test_list_view_all_parameters(self):
        """Test ListViewSchemaGenerator with all parameters."""
        generator = ListViewSchemaGenerator(
            name="custom_list",
            label="Custom List",
            boxes=["title", "status"],
            filters=["status"],
            row_actions=["edit", "delete"],
            toolbar_actions=["create"],
            default_sorting="-created_at",
            extra_filters={"is_active": True},
            sortable_field_name="position",
            sortable_sort_for_filters={"category": 1},
        )
        assert generator.name == "custom_list"
        assert generator.label == "Custom List"
        assert generator.boxes == ["title", "status"]
        assert generator.filters == ["status"]
        assert generator.row_actions == ["edit", "delete"]
        assert generator.toolbar_actions == ["create"]
        assert generator.default_sorting == "-created_at"
        assert generator.extra_filters == {"is_active": True}
        assert generator.sortable_field_name == "position"
        assert generator.sortable_sort_for_filters == {"category": 1}

    def test_create_view_with_box_parameter(self):
        """Test CreateViewSchemaGenerator with box parameter."""
        from habarico.schema.boxes import Box

        box = Box(boxes=["title", "content"])
        generator = CreateViewSchemaGenerator(box=box)
        assert generator.box == box

    def test_edit_view_with_toolbar_actions(self):
        """Test EditViewSchemaGenerator with toolbar actions."""
        generator = EditViewSchemaGenerator(toolbar_actions=["delete", "show"])
        assert generator.toolbar_actions == ["delete", "show"]


class TestViewSchemaGeneratorGetters:
    """Tests for view schema generator getter methods."""

    def test_list_view_get_boxes_returns_configured_fields(self):
        """Test ListViewSchemaGenerator.get_boxes returns configured fields."""
        generator = ListViewSchemaGenerator(boxes=["title", "author", "status"])
        assert generator.get_boxes() == ["title", "author", "status"]

    def test_list_view_get_row_actions(self):
        """Test ListViewSchemaGenerator.get_row_actions returns configured actions."""
        generator = ListViewSchemaGenerator(row_actions=["edit", "delete"])
        assert generator.get_row_actions() == ["edit", "delete"]

    def test_list_view_get_toolbar_actions(self):
        """Test ListViewSchemaGenerator.get_toolbar_actions returns configured actions."""
        generator = ListViewSchemaGenerator(toolbar_actions=["create"])
        assert generator.get_toolbar_actions() == ["create"]

    def test_list_view_get_default_sorting(self):
        """Test ListViewSchemaGenerator.get_default_sorting returns configured sorting."""
        generator = ListViewSchemaGenerator(default_sorting="-created_at")
        assert generator.get_default_sorting() == "-created_at"

    def test_list_view_get_extra_filters(self):
        """Test ListViewSchemaGenerator.get_extra_filters returns configured filters."""
        generator = ListViewSchemaGenerator(extra_filters={"status": "active"})
        assert generator.get_extra_filters() == {"status": "active"}

    def test_list_view_get_sortable_field_name(self):
        """Test ListViewSchemaGenerator.get_sortable_field_name returns configured field."""
        generator = ListViewSchemaGenerator(sortable_field_name="order")
        assert generator.get_sortable_field_name() == "order"


class TestMultipleAdminForSameModel:
    """Tests for multiple admin configurations for the same model."""

    def test_different_admins_for_article(self, db):
        """Test Article model has multiple admin configurations."""
        article_admin = site.get_admin("article")
        readonly_admin = site.get_admin("readonly_article")
        nosearch_admin = site.get_admin("nosearch_article")

        # All should be different instances
        assert article_admin is not readonly_admin
        assert article_admin is not nosearch_admin
        assert readonly_admin is not nosearch_admin

    def test_different_admins_have_different_names(self, db, mock_request):
        """Test different admins for same model have different schema names."""
        article_schema = site.get_admin("article").get_schema(mock_request).to_dict(request=mock_request)
        readonly_schema = site.get_admin("readonly_article").get_schema(mock_request).to_dict(request=mock_request)
        nosearch_schema = site.get_admin("nosearch_article").get_schema(mock_request).to_dict(request=mock_request)

        assert article_schema["name"] == "article"
        assert readonly_schema["name"] == "readonly_article"
        assert nosearch_schema["name"] == "nosearch_article"

    def test_different_admins_have_different_permissions(self, db):
        """Test different admins for same model have different permissions."""
        article_admin = site.get_admin("article")
        readonly_admin = site.get_admin("readonly_article")

        # Check that permissions differ between admins
        assert article_admin.can_create is True
        assert readonly_admin.can_create is False
        assert article_admin.can_update is True
        assert readonly_admin.can_update is False
        assert article_admin.can_delete is True
        assert readonly_admin.can_delete is False


class TestSchemaConsistency:
    """Tests for schema consistency across multiple calls."""

    def test_schema_is_consistent(self, db, mock_request):
        """Test schema returns same structure on multiple calls."""
        admin = site.get_admin("article")

        schema1 = admin.get_schema(mock_request).to_dict(request=mock_request)
        schema2 = admin.get_schema(mock_request).to_dict(request=mock_request)

        assert schema1["name"] == schema2["name"]
        assert len(schema1["views"]) == len(schema2["views"])
        assert len(schema1["actions"]) == len(schema2["actions"])

    def test_all_admins_produce_consistent_schema(self, db, mock_request):
        """Test all admins produce consistent schema structure."""
        for name in site._registry:
            admin = site.get_admin(name)
            schema = admin.get_schema(mock_request).to_dict(request=mock_request)

            # All schemas should have these keys
            assert "name" in schema
            assert "label" in schema
            assert "pk_field_name" in schema
            assert "views" in schema
            assert "actions" in schema

            # An admin this request may not read renders no views, and therefore no menu; the
            # structural assertions below only say anything about one that renders something.
            if not schema["views"]:
                continue

            assert "menu" in schema

            # Views should be a non-empty list
            assert isinstance(schema["views"], list)
            assert len(schema["views"]) > 0

            # Each view should have required keys
            for view in schema["views"]:
                assert "name" in view
                assert "type" in view
                assert "is_detail" in view
                assert "endpoint" in view


class TestUploadImagesActionParameters:
    """Tests for UploadImagesActionParameters serialization."""

    def test_no_args_yields_none(self):
        assert UploadImagesActionParameters().to_dict() is None

    def test_reference_in_dict(self):
        result = UploadImagesActionParameters(reference="photos").to_dict()
        assert result == {"reference": {"resource": "photos"}}

    def test_target_in_dict(self):
        result = UploadImagesActionParameters(target="article").to_dict()
        assert result == {"target": "article"}

    def test_accept_in_dict(self):
        result = UploadImagesActionParameters(accept=[".png", ".jpg"]).to_dict()
        assert result == {"accept": [".png", ".jpg"]}

    def test_data_in_dict(self):
        result = UploadImagesActionParameters(data={"public": True}).to_dict()
        assert result == {"data": {"public": True}}

    def test_image_field_in_dict(self):
        result = UploadImagesActionParameters(image_field="photo").to_dict()
        assert result == {"image_field": "photo"}

    def test_all_params_in_dict(self):
        result = UploadImagesActionParameters(
            reference="photos", target="article", accept=[".png"], data={"public": True}, image_field="photo"
        ).to_dict()
        assert result == {
            "reference": {"resource": "photos"},
            "target": "article",
            "accept": [".png"],
            "data": {"public": True},
            "image_field": "photo",
        }


class TestUploadImagesActionDescriptor:
    """Tests for UploadImagesActionDescriptor serialization."""

    def test_default_name(self):
        assert UploadImagesActionDescriptor().to_dict()["name"] == "upload-images"

    def test_default_icon(self):
        assert UploadImagesActionDescriptor().to_dict()["icon"] == "AddPhotoAlternate"

    def test_has_label(self):
        result = UploadImagesActionDescriptor().to_dict()
        assert "label" in result
        assert result["label"]

    def test_no_color_by_default(self):
        assert "color" not in UploadImagesActionDescriptor().to_dict()

    def test_action_type_is_upload_images(self):
        assert UploadImagesActionDescriptor().to_dict()["action"]["type"] == "upload-images"

    def test_no_upload_images_params_when_empty(self):
        assert "upload_images" not in UploadImagesActionDescriptor().to_dict()["action"]

    def test_the_upload_target_resource_is_an_address(self):
        """Images are created in that resource, and its schema is where the upload config is read."""
        params = UploadImagesActionDescriptor(reference="photo", target="article").to_dict()["action"]["upload_images"]

        assert params["reference"] == {"resource": "photo"}
        assert params["target"] == "article"

    def test_an_upload_into_another_service_splits_the_address(self):
        params = UploadImagesActionDescriptor(reference="photos/photo").to_dict()["action"]["upload_images"]

        assert params["reference"] == {"service": "photos", "resource": "photo"}

    def test_accept_propagates_to_action(self):
        result = UploadImagesActionDescriptor(accept=[".png", ".gif"]).to_dict()
        assert result["action"]["upload_images"]["accept"] == [".png", ".gif"]

    def test_reference_and_target_propagate(self):
        result = UploadImagesActionDescriptor(reference="photos", target="article").to_dict()
        upload = result["action"]["upload_images"]
        assert upload["reference"] == {"resource": "photos"}
        assert upload["target"] == "article"

    def test_data_propagates_to_action(self):
        result = UploadImagesActionDescriptor(data={"public": True}).to_dict()
        assert result["action"]["upload_images"]["data"] == {"public": True}

    def test_image_field_propagates_to_action(self):
        result = UploadImagesActionDescriptor(image_field="photo").to_dict()
        assert result["action"]["upload_images"]["image_field"] == "photo"

    def test_custom_name_overrides_default(self):
        assert UploadImagesActionDescriptor(name="my-upload").to_dict()["name"] == "my-upload"

    def test_custom_color_in_dict(self):
        from habarico.schema.types import ColorType

        result = UploadImagesActionDescriptor(color=ColorType.PRIMARY).to_dict()
        assert result["color"] == ColorType.PRIMARY


class TestExportActionParameters:
    """Tests for ExportActionParameters serialization (HAB-529)."""

    def test_no_args_yields_none(self):
        assert ExportActionParameters().to_dict() is None

    def test_format_in_dict(self):
        result = ExportActionParameters(format="csv").to_dict()
        assert result == {"format": "csv"}

    def test_fields_in_dict(self):
        result = ExportActionParameters(fields=["title", "status"]).to_dict()
        assert result == {"fields": ["title", "status"]}

    def test_all_params_in_dict(self):
        result = ExportActionParameters(format="csv", fields=["title"]).to_dict()
        assert result == {"format": "csv", "fields": ["title"]}


class TestExportActionDescriptor:
    """Tests for ExportActionDescriptor serialization (HAB-529)."""

    def test_export_action_type_enum_value(self):
        from habarico.schema.types import ActionType

        assert ActionType.EXPORT.value == "export"

    def test_default_name(self):
        assert ExportActionDescriptor().to_dict()["name"] == "export"

    def test_default_icon(self):
        assert ExportActionDescriptor().to_dict()["icon"] == "GetApp"

    def test_has_label(self):
        result = ExportActionDescriptor().to_dict()
        assert "label" in result
        assert result["label"]

    def test_no_color_by_default(self):
        assert "color" not in ExportActionDescriptor().to_dict()

    def test_action_type_is_export(self):
        assert ExportActionDescriptor().to_dict()["action"]["type"] == "export"

    def test_no_export_params_when_empty(self):
        assert "export" not in ExportActionDescriptor().to_dict()["action"]

    def test_format_propagates_to_action(self):
        result = ExportActionDescriptor(format="csv").to_dict()
        assert result["action"]["export"]["format"] == "csv"

    def test_fields_propagate_to_action(self):
        result = ExportActionDescriptor(fields=["title", "status"]).to_dict()
        assert result["action"]["export"]["fields"] == ["title", "status"]

    def test_custom_name_overrides_default(self):
        assert ExportActionDescriptor(name="export-csv").to_dict()["name"] == "export-csv"

    def test_custom_color_in_dict(self):
        from habarico.schema.types import ColorType

        result = ExportActionDescriptor(color=ColorType.PRIMARY).to_dict()
        assert result["color"] == ColorType.PRIMARY


class TestListActions:
    """Tests for the list_actions slot in the list view schema (HAB-529).

    ``list_actions`` holds utility actions of the table (export, print, ...) rendered
    next to the filters, separate from ``toolbar_actions`` and ``row_actions``.
    """

    def test_list_params_emit_list_actions(self):
        from habarico.schema.views import ListViewParameters

        data = ListViewParameters(list_actions=["export"]).to_dict()
        assert data["list_actions"] == [{"type": "action", "name": "export"}]

    def test_list_params_omit_list_actions_when_unset(self):
        from habarico.schema.views import ListViewParameters

        data = ListViewParameters(sortable_field_name="position").to_dict()
        assert "list_actions" not in data

    def test_generator_stores_list_actions(self):
        generator = ListViewSchemaGenerator(list_actions=["export"])
        assert generator.list_actions == ["export"]

    def test_generator_get_list_actions(self):
        generator = ListViewSchemaGenerator(list_actions=["export"])
        assert generator.get_list_actions() == ["export"]

    def test_list_actions_absent_by_default(self):
        generator = ListViewSchemaGenerator()
        assert generator.get_list_actions() is None

    def test_full_list_schema_endpoint_emits_list_actions(self, db, api_client):
        """End-to-end: the rendered list-view schema exposes the export action in list_actions."""
        response = api_client.get("/admin/export_article/schema/")
        assert response.status_code == 200

        list_views = [v for v in response.data["views"] if v["type"] == "list"]
        assert len(list_views) == 1
        list_actions = list_views[0]["list"]["list_actions"]
        assert len(list_actions) == 1
        export_action = list_actions[0]
        assert export_action["name"] == "export"
        assert export_action["action"]["type"] == "export"
        assert export_action["action"]["export"] == {"format": "csv", "fields": ["title", "status"]}


class TestEnumTypeIcon:
    """Tests for EnumType icon serialization."""

    def test_icon_included_when_set(self):
        from habarico.schema.fields import EnumType

        result = EnumType(value="new", label="New", color="info", icon="FiberNew").to_dict()
        assert result["icon"] == "FiberNew"

    def test_icon_omitted_when_none(self):
        from habarico.schema.fields import EnumType

        result = EnumType(value="new", label="New", color="info").to_dict()
        assert "icon" not in result

    def test_color_and_value_unaffected(self):
        from habarico.schema.fields import EnumType

        result = EnumType(value="sale", label="Sale", color="error", icon="LocalOffer").to_dict()
        assert result["value"] == "sale"
        assert result["label"] == "Sale"
        assert result["color"] == "error"
        assert result["icon"] == "LocalOffer"

    def test_get_enum_includes_icon_from_choice_icons(self):
        from habarico.schema.generators import FieldSchemaGenerator
        from rest_framework.fields import ChoiceField

        field = ChoiceField(choices=[("new", "New"), ("sale", "Sale")])
        field.field_name = "tags"
        field.choice_colors = {"new": "info", "sale": "error"}
        field.choice_icons = {"new": "FiberNew", "sale": "LocalOffer"}

        gen = FieldSchemaGenerator(field, view=None)
        enum = gen.get_enum()

        assert enum is not None
        new_entry = next(e for e in enum if e._value == "new")
        assert new_entry._icon == "FiberNew"
        assert new_entry._color == "info"

        sale_entry = next(e for e in enum if e._value == "sale")
        assert sale_entry._icon == "LocalOffer"

    def test_get_enum_no_icon_when_choice_icons_absent(self):
        from habarico.schema.generators import FieldSchemaGenerator
        from rest_framework.fields import ChoiceField

        field = ChoiceField(choices=[("a", "A"), ("b", "B")])
        field.field_name = "status"

        gen = FieldSchemaGenerator(field, view=None)
        enum = gen.get_enum()

        assert enum is not None
        for entry in enum:
            assert entry._icon is None


class TestBoxNavigation:
    def test_wizard_navigation_default_true(self):
        assert WizardBox(boxes=["a"]).to_dict()["wizard"]["show_toolbar_navigation"] is True

    def test_tab_navigation_default_false(self):
        assert TabBox(boxes=["a"]).to_dict()["tab"]["show_toolbar_navigation"] is False

    def test_wizard_navigation_explicit_false(self):
        assert (
            WizardBox(boxes=["a"], show_toolbar_navigation=False).to_dict()["wizard"]["show_toolbar_navigation"]
            is False
        )

    def test_tab_navigation_explicit_true(self):
        assert TabBox(boxes=["a"], show_toolbar_navigation=True).to_dict()["tab"]["show_toolbar_navigation"] is True

    def test_wizard_validate_steps_default_true(self):
        assert WizardBox(boxes=["a"]).to_dict()["wizard"]["validate_steps"] is True

    def test_wizard_validate_steps_explicit_false(self):
        assert WizardBox(boxes=["a"], validate_steps=False).to_dict()["wizard"]["validate_steps"] is False

    def test_tab_has_no_validate_steps(self):
        assert "validate_steps" not in TabBox(boxes=["a"]).to_dict()["tab"]

    def test_tab_item_requires_label(self):
        with pytest.raises(TypeError):
            TabItemBox(boxes=["a"])

    def test_tab_item_has_no_tab_item_key(self):
        result = TabItemBox(label="Step 1", boxes=["a"]).to_dict()
        assert "tab_item" not in result
        assert result["label"] == "Step 1"


class TestBoxToolbarActions:
    def test_box_has_no_toolbar_actions_by_default(self):
        assert "toolbar_actions" not in Box(boxes=["a"]).to_dict()

    def test_box_toolbar_actions_emitted(self):
        box = Box(boxes=["a"], toolbar_actions=[SaveActionDescriptor()])
        result = box.to_dict()
        assert [action["name"] for action in result["toolbar_actions"]] == ["save"]

    def test_wizard_toolbar_actions_emitted(self):
        box = WizardBox(boxes=["a"], toolbar_actions=[SaveActionDescriptor()])
        result = box.to_dict()
        assert [action["name"] for action in result["toolbar_actions"]] == ["save"]

    def test_tab_toolbar_actions_emitted(self):
        box = TabBox(boxes=["a"], toolbar_actions=[SaveActionDescriptor()])
        result = box.to_dict()
        assert [action["name"] for action in result["toolbar_actions"]] == ["save"]

    def test_box_toolbar_actions_accepts_strings(self):
        box = Box(boxes=["a"], toolbar_actions=["save"])
        result = box.to_dict()
        assert [action["name"] for action in result["toolbar_actions"]] == ["save"]


class TestListBoxToolbarSlots:
    """
    A ``ListBox`` has one toolbar, the box-level ``toolbar_actions`` at the box root. The table's
    own utility actions (``list_actions``) sit beside the filters and are a different slot.
    """

    def test_box_level_toolbar_actions_emitted_at_box_root(self):
        from habarico.schema.boxes import ListBox

        result = ListBox(reference="article", toolbar_actions=["refresh"]).to_dict()
        assert [action["name"] for action in result["toolbar_actions"]] == ["refresh"]
        assert "toolbar_actions" not in result["list"]

    def test_the_box_toolbar_and_the_table_actions_are_independent(self):
        from habarico.schema.boxes import ListBox

        result = ListBox(
            reference="article",
            toolbar_actions=["refresh"],
            list_actions=["export"],
        ).to_dict()
        assert [action["name"] for action in result["toolbar_actions"]] == ["refresh"]
        assert [action["name"] for action in result["list"]["list_actions"]] == ["export"]
        assert "toolbar_actions" not in result["list"]

    def test_list_toolbar_actions_absent_by_default(self):
        from habarico.schema.boxes import ListBox

        result = ListBox(reference="article").to_dict()
        assert "toolbar_actions" not in result
        assert "toolbar_actions" not in result["list"]


class TestSchemaGetter:
    """Tests for the schema_getter decorator (getter-only serialized fields)."""

    def test_getter_only_field_without_backing_attribute_is_serialized(self):
        """A @schema_getter method with no backing attribute emits its field."""
        from habarico.schema.base import BaseSchema, schema_getter

        class MySchema(BaseSchema):
            @schema_getter
            def get_extra(self):
                return "value"

        assert MySchema().to_dict() == {"extra": "value"}

    def test_getter_only_field_reads_context(self):
        """A getter-only field can compute its value from self.context."""
        from habarico.schema.base import BaseSchema, SchemaContext, schema_getter

        class MySchema(BaseSchema):
            @schema_getter
            def get_owner(self):
                return self.context.obj

        assert MySchema().to_dict(context=SchemaContext(obj="ART#42")) == {"owner": "ART#42"}

    def test_getter_only_field_survives_override_without_reannotation(self):
        """Overriding a getter-only field in a subclass keeps it registered without re-annotating."""
        from habarico.schema.base import BaseSchema, schema_getter

        class Parent(BaseSchema):
            @schema_getter
            def get_extra(self):
                return "parent"

        class Child(Parent):
            def get_extra(self):  # no decorator on the override
                return "child"

        assert Child().to_dict() == {"extra": "child"}


class TestNameManglingExclusion:
    """Name-mangled (double-underscore) attributes must never be serialized, even via a subclass."""

    def test_parent_mangled_attribute_excluded_in_subclass(self):
        from habarico.schema.base import BaseSchema

        class Parent(BaseSchema):
            def __init__(self):
                self.__secret = "hidden"  # -> _Parent__secret
                self._visible = "shown"

        class Child(Parent):
            pass

        assert Child().to_dict() == {"visible": "shown"}


class TestBoxParamsOverride:
    """Boxes build their nested params via a schema_getter, so subclasses can override by context."""

    def test_list_box_params_overridable_via_context(self):
        from habarico.schema.base import SchemaContext
        from habarico.schema.boxes import ListBox

        class OwnerListBox(ListBox):
            def _get_list_kwargs(self):
                return {**super()._get_list_kwargs(), "extra_filters": {"owner": self.context.obj}}

        box = OwnerListBox(reference="article", target="author_id")
        result = box.to_dict(context=SchemaContext(obj="U#7"))
        assert result["list"]["extra_filters"] == {"owner": "U#7"}

    def test_list_box_default_output_unchanged(self):
        from habarico.schema.boxes import ListBox

        result = ListBox(reference="article", target="author_id", extra_filters={"a": 1}).to_dict()
        assert result["type"] == "list"
        assert result["list"]["reference"] == {"resource": "article"}
        assert result["list"]["target"] == "author_id"
        assert result["list"]["extra_filters"] == {"a": 1}

    def test_object_box_params_overridable_via_context(self):
        from habarico.schema.base import SchemaContext
        from habarico.schema.boxes import ObjectBox

        class ScopedObjectBox(ObjectBox):
            def _get_object_kwargs(self):
                return {**super()._get_object_kwargs(), "target": self.context.obj}

        result = ScopedObjectBox(target="static", boxes=["a"]).to_dict(context=SchemaContext(obj="dynamic"))
        assert result["object"]["target"] == "dynamic"

    def test_scalar_and_processed_fields_overridable_without_conversion(self):
        """label / boxes are stored attributes, so a subclass getter overrides them via opt-in dispatch."""
        from habarico.schema.boxes import Box, generate_boxes_descriptor

        class DynBox(Box):
            def get_label(self):
                return f"ctx:{self.context.read_only}"

            def get_boxes(self):
                return generate_boxes_descriptor(["a", "b"] if self.context.read_only else ["a"])

        result = DynBox(label="static", boxes=["x"]).to_dict(read_only=True)
        assert result["label"] == "ctx:True"
        assert [b["name"] for b in result["boxes"]] == ["a", "b"]


class TestDescriptorParamsOverride:
    """Descriptors build their nested params via schema_getter, overridable by context."""

    def test_field_descriptor_options_overridable_even_when_not_declared(self):
        from habarico.schema.base import SchemaContext
        from habarico.schema.fields import FieldDescriptor

        class DynField(FieldDescriptor):
            def _get_options_kwargs(self):
                return {**super()._get_options_kwargs(), "prefix": self.context.obj}

        result = DynField(name="f").to_dict(context=SchemaContext(obj="$$"))
        assert result["options"]["prefix"] == "$$"

    def test_field_descriptor_without_options_has_no_options_key(self):
        from habarico.schema.fields import FieldDescriptor

        assert "options" not in FieldDescriptor(name="f").to_dict()

    def test_action_descriptor_view_overridable_via_context(self):
        from habarico.schema.actions import ActionDescriptor
        from habarico.schema.base import SchemaContext
        from habarico.schema.types import ViewModeType

        class DynAction(ActionDescriptor):
            def _get_view_kwargs(self):
                return {**super()._get_view_kwargs(), "mode": ViewModeType.DIALOG}

        result = DynAction(name="a").to_dict(context=SchemaContext())
        assert result["view"]["mode"] == ViewModeType.DIALOG


class TestLocalResourceSchemaEndpoints:
    """The per-resource schema route emits the methods under `endpoints`, as the contract names it."""

    def test_local_schema_emits_endpoints_key(self, db, api_client):
        response = api_client.get("/admin/article/schema/")
        assert response.status_code == 200

        assert "endpoint" not in response.data
        assert isinstance(response.data["endpoints"], dict)
        assert "get" in response.data["endpoints"]

    def test_endpoints_schema_serializes_methods(self):
        from habarico.schema.resource import EndpointsSchema, LocalResourceSchema, MethodSchema

        schema = LocalResourceSchema(
            name="article",
            label="Article",
            pk_field_name="id",
            endpoints=EndpointsSchema(get=MethodSchema(fields=[])),
        )

        assert set(schema.to_dict()) == {"name", "label", "pk_field_name", "endpoints"}


class TestFieldValidatorsExtraction:
    """Tests for auto-extraction of validation rules into field options (HAB-445)."""

    @staticmethod
    def _field_schema(field, descriptor=None):
        class TestSerializer(Serializer):
            pass

        TestSerializer._declared_fields = {"value": field}
        bound_field = TestSerializer().fields["value"]
        return FieldSchemaGenerator(bound_field, view=None, descriptor=descriptor).get_schema().to_dict()

    @staticmethod
    def _rule(schema, type):
        """Find the rule of the given `type` in schema["options"]["validators"], or None."""
        return next((rule for rule in schema["options"]["validators"] if rule["type"] == type), None)

    def test_char_field_length_constraints(self):
        """Test CharField max_length and min_length are exported into options.validators."""
        schema = self._field_schema(CharField(max_length=100, min_length=2))
        assert schema["options"]["validators"] == [
            {"type": "max_length", "value": 100},
            {"type": "min_length", "value": 2},
        ]

    def test_integer_field_value_constraints(self):
        """Test IntegerField min_value and max_value are exported, including falsy zero."""
        schema = self._field_schema(IntegerField(min_value=0, max_value=10))
        assert schema["options"]["validators"] == [
            {"type": "max_value", "value": 10},
            {"type": "min_value", "value": 0},
        ]

    def test_regex_validator_exported_without_message(self):
        """Test the first RegexValidator is exported as its pattern only; the message is not stolen.

        Auto-extracted rules carry no message so the frontend renders its own localized default;
        the backend never bakes a (backend-locale) DRF message into the schema (HAB-445 review).
        """
        field = CharField(validators=[RegexValidator(r"^[A-Z]{2}[0-9]{4}$", message="Invalid code format.")])
        schema = self._field_schema(field)
        assert self._rule(schema, "regex") == {"type": "regex", "value": r"^[A-Z]{2}[0-9]{4}$"}

    def test_slug_field_regex_exported(self):
        """Test SlugField built-in RegexValidator is exported."""
        schema = self._field_schema(SlugField())
        assert self._rule(schema, "regex") is not None

    def test_url_field_regex_not_exported(self):
        """Test URLValidator regex is not exported (not JavaScript-compatible)."""
        schema = self._field_schema(URLField())
        validators = (schema.get("options") or {}).get("validators") or []
        assert not any(rule["type"] == "regex" for rule in validators)

    def test_field_without_constraints_has_no_validators(self):
        """Test a field without constraints does not emit the validators key."""
        schema = self._field_schema(CharField())
        assert "validators" not in (schema.get("options") or {})

    def test_explicit_options_take_precedence(self):
        """Test validators set explicitly in field options override auto-extracted values per type."""
        field = AdminCharField(
            max_length=100, min_length=2, options={"validators": [{"type": "max_length", "value": 50}]}
        )
        schema = self._field_schema(field)
        assert self._rule(schema, "max_length") == {"type": "max_length", "value": 50}
        assert self._rule(schema, "min_length") == {"type": "min_length", "value": 2}

    def test_descriptor_validators_take_precedence(self):
        """Test Field descriptor validators override auto-extracted values per type."""
        descriptor = Field(name="value", validators=[MaxLengthValidatorRule(50)])
        schema = self._field_schema(CharField(max_length=100, min_length=2), descriptor=descriptor)
        assert self._rule(schema, "max_length") == {"type": "max_length", "value": 50}
        assert self._rule(schema, "min_length") == {"type": "min_length", "value": 2}

    def test_descriptor_only_validators(self):
        """Test Field descriptor validators are exported even without auto-extracted rules."""
        descriptor = Field(name="value", validators=[RegexValidatorRule("^[a-z]+$", "Lowercase only.")])
        schema = self._field_schema(CharField(), descriptor=descriptor)
        assert schema["options"]["validators"] == [{"type": "regex", "value": "^[a-z]+$", "message": "Lowercase only."}]

    def test_message_supported_for_non_regex_rule(self):
        """Test a custom message can be set for a non-regex rule, not just regex (HAB-445 review)."""
        descriptor = Field(name="value", validators=[MaxLengthValidatorRule(50, "Too long.")])
        schema = self._field_schema(CharField(max_length=100), descriptor=descriptor)
        assert self._rule(schema, "max_length") == {"type": "max_length", "value": 50, "message": "Too long."}

    def test_message_without_value_produces_no_rule(self):
        """Test a message given without its value never produces a dangling rule."""
        descriptor = Field(name="value", validators=[MaxLengthValidatorRule(None, "Too long.")])
        schema = self._field_schema(CharField(), descriptor=descriptor)
        assert "validators" not in (schema.get("options") or {})

    def test_multiple_descriptor_validators_serialized_as_list(self):
        """Test a list of validator objects serializes to the ordered list of ValidatorRule dicts."""
        descriptor = Field(
            name="value",
            validators=[MaxLengthValidatorRule(50), RegexValidatorRule("^[a-z]+$")],
        )
        schema = self._field_schema(CharField(), descriptor=descriptor)
        assert schema["options"]["validators"] == [
            {"type": "max_length", "value": 50},
            {"type": "regex", "value": "^[a-z]+$"},
        ]

    def test_custom_validator_subclass_is_extensible(self):
        """Test a user-defined validator subclass emits its own rule type (extensibility, HAB-445 review)."""

        class EvenValidatorRule(ValidatorRule):
            type = "even"

        descriptor = Field(name="value", validators=[EvenValidatorRule(True, "Must be even.")])
        schema = self._field_schema(CharField(), descriptor=descriptor)
        assert schema["options"]["validators"] == [{"type": "even", "value": True, "message": "Must be even."}]


class TestFieldSortableFlag:
    """Tests for the `sortable` flag being exported as a real boolean (HAB-773)."""

    @staticmethod
    def _field_schema(sortable_fields):
        class TestSerializer(Serializer):
            pass

        TestSerializer._declared_fields = {"price": CharField()}
        bound_field = TestSerializer().fields["price"]
        return FieldSchemaGenerator(bound_field, view=None, sortable_fields=sortable_fields).get_schema().to_dict()

    def test_empty_sortable_fields_exports_false(self):
        """Test an empty list of sortable fields exports `false`, not the empty list itself."""
        assert self._field_schema([])["sortable"] is False

    def test_field_missing_from_sortable_fields_exports_false(self):
        """Test a field absent from a non-empty list of sortable fields exports `false`."""
        assert self._field_schema(["title"])["sortable"] is False

    def test_field_listed_in_sortable_fields_exports_true(self):
        """Test a field present in the list of sortable fields exports `true`."""
        assert self._field_schema(["price", "title"])["sortable"] is True

    def test_sortable_fields_not_given_exports_false(self):
        """Test the flag is exported even when no sortable fields are passed - it is required by the contract."""
        assert self._field_schema(None)["sortable"] is False
