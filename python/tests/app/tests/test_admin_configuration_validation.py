"""Tests for the registration-time admin configuration validation (HAB-553)."""

import django_filters
import pytest
from app.models import Article, Author, Product
from django.core.exceptions import ImproperlyConfigured
from habarico import ModelAdmin, site
from habarico.schema import (
    Action,
    Box,
    Field,
    FieldWrapper,
    Filter,
    GridBox,
    ListBox,
    ObjectBox,
    Sorting,
    TabBox,
    WizardBox,
)
from habarico.schema.generators import (
    CreateViewSchemaGenerator,
    ListViewSchemaGenerator,
    ShowViewSchemaGenerator,
)
from habarico.schema.types import SortDirectionType
from habarico.serializers import AdminModelSerializer
from habarico.validation import AdminConfigurationValidator
from habarico.views import AdminModelViewSet


def validate(admin_class: type[ModelAdmin]) -> ModelAdmin:
    """
    Run the registration-time validation hook for an admin class.

    The admins below are ``abstract = True`` so they stay out of the global registry; this is what
    ``AdminSite.register()`` does for a real admin, once, when the class is registered.
    """
    admin = admin_class()
    admin.validate_configuration()
    return admin


class TestValidateClasses:
    """Class-type attributes (model, base_viewset, base_serializer_class, generator classes, filterset_class)."""

    def test_valid_admin_registers(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article

        assert validate(_Admin).model is Article

    def test_model_not_a_model_subclass_raises(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = object

        with pytest.raises(ImproperlyConfigured, match="model"):
            validate(_Admin)

    def test_base_viewset_wrong_type_raises(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            base_viewset = object

        with pytest.raises(ImproperlyConfigured, match="base_viewset"):
            validate(_Admin)

    def test_base_viewset_correct_subclass_passes(self, db):
        class _CustomViewSet(AdminModelViewSet):
            pass

        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            base_viewset = _CustomViewSet

        assert validate(_Admin).base_viewset is _CustomViewSet

    def test_base_serializer_class_wrong_type_raises(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            base_serializer_class = object

        with pytest.raises(ImproperlyConfigured, match="base_serializer_class"):
            validate(_Admin)

    def test_base_serializer_class_correct_subclass_passes(self, db):
        class _CustomSerializer(AdminModelSerializer):
            class Meta:
                model = Article
                fields = "__all__"

        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            base_serializer_class = _CustomSerializer

        assert validate(_Admin).base_serializer_class is _CustomSerializer

    def test_menu_schema_generator_none_passes(self, db):
        """None is a legitimate opt-out (hides the admin from the menu)."""

        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            menu_schema_generator = None

        assert validate(_Admin).menu_schema_generator is None

    def test_menu_schema_generator_wrong_type_raises(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            menu_schema_generator = object()

        with pytest.raises(ImproperlyConfigured, match="menu_schema_generator"):
            validate(_Admin)

    def test_view_schema_generators_entry_wrong_type_raises(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            view_schema_generators = [object()]

        with pytest.raises(ImproperlyConfigured, match="view_schema_generators"):
            validate(_Admin)

    def test_action_schema_generators_entry_wrong_type_raises(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            action_schema_generators = [object()]

        with pytest.raises(ImproperlyConfigured, match="action_schema_generators"):
            validate(_Admin)

    def test_filterset_class_wrong_type_raises(self, db):
        class _ViewSet(AdminModelViewSet):
            filterset_class = object

        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            base_viewset = _ViewSet

        with pytest.raises(ImproperlyConfigured, match="filterset_class"):
            validate(_Admin)

    def test_filterset_class_meta_model_mismatch_raises(self, db):
        class _WrongModelFilterSet(django_filters.FilterSet):
            class Meta:
                model = Product
                fields = []

        class _ViewSet(AdminModelViewSet):
            filterset_class = _WrongModelFilterSet

        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            base_viewset = _ViewSet

        with pytest.raises(ImproperlyConfigured, match="filterset_class"):
            validate(_Admin)

    def test_filterset_class_matching_model_passes(self, db):
        class _ArticleFilterSet(django_filters.FilterSet):
            class Meta:
                model = Article
                fields = []

        class _ViewSet(AdminModelViewSet):
            filterset_class = _ArticleFilterSet

        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            base_viewset = _ViewSet

        assert validate(_Admin).base_viewset is _ViewSet


class TestValidateConstraints:
    """
    ``validate_constraints()`` is the extension point a pro/enterprise validator overrides to
    check the attributes its own ``ModelAdmin`` mixins contribute (e.g. ``aggregate_max_buckets``
    in ``AggregateConfigurationValidatorMixin``). Core declares no constraint of its own.
    """

    def test_core_declares_no_constraints(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article

        # Must not raise - a free-only admin has nothing to constrain.
        validate(_Admin)

    def test_subclass_constraint_is_enforced(self, db):
        from habarico.validation import AdminConfigurationValidator

        class _Validator(AdminConfigurationValidator):
            def validate_constraints(self):
                super().validate_constraints()
                if self.admin.max_items <= 0:
                    raise self.error("max_items", self.admin.max_items, "must be a positive integer")

        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            max_items = 0
            configuration_validator_class = _Validator

        with pytest.raises(ImproperlyConfigured, match="max_items"):
            validate(_Admin)


class TestValidateFieldLists:
    """search_fields / filter_fields / ordering_fields / fields / read_only_fields."""

    def test_valid_field_lists_pass(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            search_fields = ["title", "author__name", "title__icontains"]
            filter_fields = ["status", "category"]
            ordering_fields = ["title", ("created_at", "Created")]
            fields = ["title", "slug", Field(name="author")]
            read_only_fields = ["created_at"]

        assert validate(_Admin).model is Article

    def test_search_fields_typo_raises(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            search_fields = ["titel"]

        with pytest.raises(ImproperlyConfigured, match="search_fields"):
            validate(_Admin)

    def test_search_fields_suggests_close_match(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            search_fields = ["titel"]

        with pytest.raises(ImproperlyConfigured, match="Did you mean 'title'"):
            validate(_Admin)

    def test_filter_fields_typo_raises(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            filter_fields = ["statuss"]

        with pytest.raises(ImproperlyConfigured, match="filter_fields"):
            validate(_Admin)

    def test_ordering_fields_may_name_an_extra_ordering_field(self, db):
        class _ViewSet(AdminModelViewSet):
            extra_ordering_fields = ["relevance"]

        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            base_viewset = _ViewSet
            ordering_fields = ["relevance"]

        assert validate(_Admin).model is Article

    def test_an_ordering_alias_is_resolved_by_its_lookup(self, db):
        """A `(key, lookup, label)` triple names the client-facing key first; only the lookup is ORM."""

        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            ordering_fields = [("author_name", "author__name", "Author")]

        assert validate(_Admin).model is Article

    def test_an_ordering_alias_with_a_broken_lookup_raises(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            ordering_fields = [("author_name", "auther__name", "Author")]

        with pytest.raises(ImproperlyConfigured, match="ordering_fields"):
            validate(_Admin)

    def test_default_sorting_is_not_checked(self, db):
        """An ordering may name an annotation, and the validator cannot see where one comes from.

        It may sit on the viewset's queryset, be added in a custom ``get_queryset()``, or be
        attached by the ordering filter itself. A typo surfaces on the first list request as a
        Django ``FieldError`` instead (HAB-915).
        """

        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            default_sorting = "-creted_at"

        assert validate(_Admin).model is Article

    def test_ordering_fields_typo_raises(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            ordering_fields = ["titel"]

        with pytest.raises(ImproperlyConfigured, match="ordering_fields"):
            validate(_Admin)

    def test_fields_typo_raises(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            fields = ["titel"]

        with pytest.raises(ImproperlyConfigured, match="fields"):
            validate(_Admin)

    def test_read_only_fields_typo_raises(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            read_only_fields = ["titel"]

        with pytest.raises(ImproperlyConfigured, match="read_only_fields"):
            validate(_Admin)


class TestValidatePaginationLimits:
    """``default_page_limit`` / ``max_page_limit`` numeric constraints (HAB-946)."""

    def test_unset_limits_pass(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article

        admin = validate(_Admin)
        assert admin.default_page_limit is None
        assert admin.max_page_limit is None

    def test_valid_limits_pass(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            default_page_limit = 25
            max_page_limit = 250

        assert validate(_Admin).max_page_limit == 250

    def test_zero_default_page_limit_passes(self, db):
        """Zero is a deliberate value - it asks for the meta block without any objects."""

        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            default_page_limit = 0

        assert validate(_Admin).default_page_limit == 0

    def test_negative_default_page_limit_raises(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            default_page_limit = -1

        with pytest.raises(ImproperlyConfigured, match="default_page_limit"):
            validate(_Admin)

    def test_non_integer_default_page_limit_raises(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            default_page_limit = "25"

        with pytest.raises(ImproperlyConfigured, match="default_page_limit"):
            validate(_Admin)

    def test_zero_max_page_limit_raises(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            max_page_limit = 0

        with pytest.raises(ImproperlyConfigured, match="max_page_limit"):
            validate(_Admin)

    def test_negative_max_page_limit_raises(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            max_page_limit = -10

        with pytest.raises(ImproperlyConfigured, match="max_page_limit"):
            validate(_Admin)

    def test_default_above_max_raises(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            default_page_limit = 100
            max_page_limit = 50

        with pytest.raises(ImproperlyConfigured, match="default_page_limit"):
            validate(_Admin)

    def test_default_equal_to_max_passes(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            default_page_limit = 50
            max_page_limit = 50

        assert validate(_Admin).default_page_limit == 50


class TestValidateExport:
    """export_fields / export_formats (HAB-535)."""

    def test_valid_export_configuration_passes(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            export_fields = ["title", "author__name"]
            export_formats = ["csv"]

        assert validate(_Admin).model is Article

    def test_export_fields_typo_raises(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            export_fields = ["titel"]

        with pytest.raises(ImproperlyConfigured, match="export_fields"):
            validate(_Admin)

    def test_export_format_without_renderer_raises(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            export_formats = ["ods"]

        with pytest.raises(ImproperlyConfigured, match="export_formats"):
            validate(_Admin)


class TestValidateDescriptors:
    """Field/filter/sorting descriptors nested in view_schema_generators' boxes."""

    def test_declared_boxes_are_normalized_to_a_list(self, db):
        """
        The list generator declares a list in ``boxes``; the detail generators declare a single
        root box in ``box``. Both shapes reach the box walker as a list.
        """

        class _Admin(ModelAdmin):
            abstract = True
            model = Article

        validator = AdminConfigurationValidator(_Admin())

        list_generator = ListViewSchemaGenerator(boxes=["title", "slug"])
        assert validator.get_declared_boxes(list_generator) == ["title", "slug"]

        detail_generator = ShowViewSchemaGenerator(box=Box(boxes=["title"]))
        assert validator.get_declared_boxes(detail_generator) == [detail_generator.box]

        # nothing declared: the content is derived from the serializer at render time
        assert validator.get_declared_boxes(ShowViewSchemaGenerator()) == []
        assert validator.get_declared_boxes(ListViewSchemaGenerator()) == []

    def test_valid_nested_boxes_pass(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            view_schema_generators = [
                CreateViewSchemaGenerator(
                    box=WizardBox(
                        boxes=[
                            TabBox(boxes=[Box(boxes=["title", "slug", Field(name="content")])]),
                            GridBox(boxes=[Box(grid_item={"xs": 12}, boxes=["status", "priority"])]),
                        ]
                    )
                ),
                ListViewSchemaGenerator(
                    boxes=["title", "author__name", Field(name="category__name")],
                    filters=["status", Filter(name="category__name")],
                    default_sorting=Sorting(field_name="created_at", direction=SortDirectionType.DESC),
                ),
            ]

        assert validate(_Admin).model is Article

    def test_nested_box_field_typo_raises(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            view_schema_generators = [ShowViewSchemaGenerator(box=Box(boxes=["titel"]))]

        with pytest.raises(ImproperlyConfigured, match="does not resolve"):
            validate(_Admin)

    def test_field_wrapper_name_is_not_validated(self, db):
        """A wrapper's name is presentational — it must not be resolved against the model."""

        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            view_schema_generators = [
                ShowViewSchemaGenerator(box=Box(boxes=[FieldWrapper(name="wrap", fields=["title", "slug"])]))
            ]

        assert validate(_Admin).model is Article

    def test_field_wrapper_sub_field_typo_raises(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            view_schema_generators = [
                ShowViewSchemaGenerator(box=Box(boxes=[FieldWrapper(name="wrap", fields=["titel"])]))
            ]

        with pytest.raises(ImproperlyConfigured, match="'titel': does not resolve"):
            validate(_Admin)

    def test_object_box_switches_to_related_model(self, db):
        """ObjectBox(target="author", ...) validates its nested fields against Author, not Article."""

        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            view_schema_generators = [
                ShowViewSchemaGenerator(box=Box(boxes=[ObjectBox(target="author", boxes=["titel"])]))
            ]

        with pytest.raises(ImproperlyConfigured, match=f"does not resolve to a field on {Author.__name__}"):
            validate(_Admin)

    def test_object_box_unresolvable_target_is_skipped(self, db):
        """When target itself doesn't resolve to a relation, the subtree is skipped, not raised on."""

        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            view_schema_generators = [
                ShowViewSchemaGenerator(box=Box(boxes=[ObjectBox(target="not_a_field", boxes=["also_bogus"])]))
            ]

        assert validate(_Admin).model is Article

    def test_list_box_contents_are_not_validated(self, db):
        """ListBox references a different admin resource — out of scope, so its boxes are skipped."""

        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            view_schema_generators = [
                ShowViewSchemaGenerator(
                    box=Box(boxes=[ListBox(reference="other-resource", target="whatever", boxes=["totally_bogus"])])
                )
            ]

        assert validate(_Admin).model is Article

    def test_filters_typo_raises(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            view_schema_generators = [ListViewSchemaGenerator(filters=["statuss"])]

        with pytest.raises(ImproperlyConfigured, match="filters"):
            validate(_Admin)

    def test_default_sorting_is_not_checked(self, db):
        """A view's ordering may name an annotation too - see the resource-level counterpart."""

        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            view_schema_generators = [ListViewSchemaGenerator(default_sorting="-titel")]

        assert validate(_Admin).model is Article


class TestValidateActions:
    """Built-in CRUD action names (create/show/edit/delete) checked against can_* flags."""

    def test_builtin_action_without_permission_raises(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            can_update = False
            view_schema_generators = [ListViewSchemaGenerator(row_actions=["edit"])]

        with pytest.raises(ImproperlyConfigured, match="can_update"):
            validate(_Admin)

    def test_builtin_action_with_permission_passes(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            can_update = True
            view_schema_generators = [ListViewSchemaGenerator(row_actions=["edit"])]

        assert validate(_Admin).model is Article

    def test_custom_action_name_is_not_validated(self, db):
        """Free-form/custom action names have no static registry and are left unvalidated."""

        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            can_update = False
            view_schema_generators = [ListViewSchemaGenerator(row_actions=["create-invoice", Action(name="preview")])]

        assert validate(_Admin).model is Article

    def test_double_click_action_is_checked(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            can_update = False
            view_schema_generators = [ListViewSchemaGenerator(double_click_action="edit")]

        with pytest.raises(ImproperlyConfigured, match="can_update"):
            validate(_Admin)


class TestWhenValidationRuns:
    """Validation is a registration-time concern, not a per-instantiation one."""

    def test_instantiation_does_not_validate(self, db):
        """
        A fresh admin instance is built for every request (``AdminSite.get_admin`` /
        ``get_schema``), so ``__init__`` must not pay for validation.
        """

        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            search_fields = ["titel"]

        assert _Admin().model is Article  # no raise — nothing is validated here

        with pytest.raises(ImproperlyConfigured, match="search_fields"):
            _Admin().validate_configuration()

    def test_registration_validates_once(self, db):
        """``AdminSite.register()`` calls the hook exactly once, and only for the registered class."""
        calls = []

        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            name = "registration_hook_article"

            def validate_configuration(self):
                calls.append(self)
                super().validate_configuration()

        site.register(_Admin)
        try:
            assert len(calls) == 1
            site.get_admin(_Admin.name)
            site.get_admin(_Admin.name)
            assert len(calls) == 1  # per-request instantiation does not re-validate
        finally:
            site._registry.pop(_Admin.name, None)
            site._routers.pop()

    def test_registration_rejects_a_misconfigured_admin(self, db):
        """A typo raises while the class is being registered, before it enters the registry."""

        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            name = "misconfigured_article"
            search_fields = ["titel"]

        with pytest.raises(ImproperlyConfigured, match="Did you mean 'title'"):
            site.register(_Admin)

        assert not site.exists_admin(_Admin.name)


class TestConfigurationValidatorClass:
    """`configuration_validator_class` is the extension point for the checks themselves."""

    def test_none_skips_validation(self, db):
        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            search_fields = ["titel"]
            configuration_validator_class = None

        validate(_Admin)  # no raise

    def test_subclass_can_add_checks(self, db):
        class _StrictValidator(AdminConfigurationValidator):
            def validate(self):
                super().validate()
                if not self.admin.label:
                    raise self.error("label", self.admin.label, "must be set on this project's admins")

        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            configuration_validator_class = _StrictValidator

        with pytest.raises(ImproperlyConfigured, match="label"):
            validate(_Admin)

    def test_subclass_can_relax_checks(self, db):
        class _LenientValidator(AdminConfigurationValidator):
            def validate_field_lists(self) -> None:
                pass

        class _Admin(ModelAdmin):
            abstract = True
            model = Article
            search_fields = ["titel"]
            configuration_validator_class = _LenientValidator

        assert validate(_Admin).model is Article
