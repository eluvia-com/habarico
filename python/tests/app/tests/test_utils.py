"""
Tests for utility functions.
"""

from types import SimpleNamespace

import pytest
from app.models import Article
from eluvia_base.integrations.fieldset import ALL_FIELDS, DEFAULT_FIELDS, RFS
from habarico.utils import clone_drf_request, f, get_model_name, resolve_fieldset_defaults
from rest_framework.request import Request


class TestResolveFieldsetDefaults:
    """Tests for resolve_fieldset_defaults utility."""

    @pytest.fixture
    def default(self):
        """Simple two-level default fieldset used across multiple tests."""
        return RFS.create_from_string("repr,schema(name,label,actions(edit,delete)),tags,trigger_action")

    # --- None / empty input ---

    def test_none_requested_returns_none(self, default):
        """None input signals the caller to fall back to the full default."""
        assert resolve_fieldset_defaults(None, default) is None

    def test_none_default_no_wildcard_returns_explicit_fields(self):
        """Explicit fields with no default and no wildcard are returned as-is."""
        result = resolve_fieldset_defaults(RFS.create_from_string("repr,tags"), None)
        assert "repr" in result
        assert "tags" in result

    # --- Wildcard expansion ---

    def test_all_fields_expands_to_full_default(self, default):
        """ALL_FIELDS alone expands to every field in the default."""
        result = resolve_fieldset_defaults(RFS.create_from_string(ALL_FIELDS), default)
        assert "repr" in result
        assert "schema" in result
        assert "tags" in result
        assert "trigger_action" in result

    def test_default_fields_behaves_same_as_all_fields(self, default):
        """DEFAULT_FIELDS is treated identically to ALL_FIELDS."""
        result_all = resolve_fieldset_defaults(RFS.create_from_string(ALL_FIELDS), default)
        result_default = resolve_fieldset_defaults(RFS.create_from_string(DEFAULT_FIELDS), default)
        assert str(result_all) == str(result_default)

    def test_wildcard_with_no_default_returns_only_explicit_fields(self):
        """When default is None wildcards expand to nothing; explicit fields still appear."""
        result = resolve_fieldset_defaults(RFS.create_from_string(f"{ALL_FIELDS},repr"), None)
        assert "repr" in result
        assert len(list(result)) == 1

    # --- Explicit fields without wildcard ---

    def test_explicit_fields_without_wildcard_no_expansion(self, default):
        """Without a wildcard only the requested fields are returned."""
        result = resolve_fieldset_defaults(RFS.create_from_string("repr,tags"), default)
        assert "repr" in result
        assert "tags" in result
        assert "schema" not in result
        assert "trigger_action" not in result

    def test_explicit_field_not_in_default_is_included(self, default):
        """A field that does not exist in the default is still included when explicitly requested."""
        result = resolve_fieldset_defaults(RFS.create_from_string("repr,extra_field"), default)
        assert "extra_field" in result

    # --- Override behaviour ---

    def test_explicit_field_overrides_default_sub_fieldset(self, default):
        """An explicit field alongside a wildcard replaces the default sub-fieldset entirely."""
        result = resolve_fieldset_defaults(
            RFS.create_from_string(f"{ALL_FIELDS},schema(name)"),
            default,
        )
        # Default had schema(name,label,actions(...)) — after override only 'name' remains.
        assert "schema" in result
        schema_sub = result["schema"].fieldset
        assert "name" in schema_sub
        assert "label" not in schema_sub
        assert "actions" not in schema_sub

    def test_explicit_field_without_sub_fieldset_overrides_default(self, default):
        """An explicit field without a sub-fieldset replaces the default entry (no sub-fieldset)."""
        result = resolve_fieldset_defaults(
            RFS.create_from_string(f"{ALL_FIELDS},schema"),
            default,
        )
        assert "schema" in result
        # schema requested without sub-fieldset → RF with no fieldset
        assert result["schema"].fieldset is None

    def test_other_fields_unchanged_when_one_is_overridden(self, default):
        """Overriding one field must not affect the remaining default fields."""
        result = resolve_fieldset_defaults(
            RFS.create_from_string(f"{ALL_FIELDS},schema(name)"),
            default,
        )
        assert "repr" in result
        assert "tags" in result
        assert "trigger_action" in result

    # --- Recursive resolution ---

    def test_wildcard_resolved_recursively_in_sub_fieldset(self, default):
        """ALL_FIELDS inside a sub-fieldset expands the corresponding default sub-tree."""
        result = resolve_fieldset_defaults(
            RFS.create_from_string(f"schema({ALL_FIELDS})"),
            default,
        )
        assert "schema" in result
        schema_sub = result["schema"].fieldset
        assert "name" in schema_sub
        assert "label" in schema_sub
        assert "actions" in schema_sub

    def test_override_inside_nested_wildcard(self, default):
        """Explicit sub-field alongside a nested wildcard overrides the matching default."""
        result = resolve_fieldset_defaults(
            RFS.create_from_string(f"schema({ALL_FIELDS},actions(edit))"),
            default,
        )
        schema_sub = result["schema"].fieldset
        assert "name" in schema_sub
        actions_sub = schema_sub["actions"].fieldset
        assert "edit" in actions_sub
        assert "delete" not in actions_sub

    def test_deeply_nested_wildcard(self):
        """Wildcards at three levels deep are resolved correctly."""
        deep_default = RFS.create_from_string("a(b(c(x,y),d),e)")
        result = resolve_fieldset_defaults(
            RFS.create_from_string(f"{ALL_FIELDS},a(b({ALL_FIELDS},c(x)))"),
            deep_default,
        )
        a_sub = result["a"].fieldset
        b_sub = a_sub["b"].fieldset
        # b expanded from default → should have d and e from b's default sub
        assert "d" in b_sub
        # c was explicitly overridden inside b → only x, not y
        c_sub = b_sub["c"].fieldset
        assert "x" in c_sub
        assert "y" not in c_sub


class TestGetModelName:
    """Tests for get_model_name utility."""

    def test_get_model_name_from_model(self, db):
        """Test model name extraction from model class."""
        name = get_model_name(Article)
        assert name == "article"

    def test_get_model_name_from_model_instance(self, db, article):
        """Test model name extraction from model instance."""
        name = get_model_name(article)
        assert name == "article"


class TestCloneDRFRequest:
    """Tests for clone_drf_request utility."""

    def test_clone_request_basic(self, request_factory):
        """Test basic request cloning."""
        original = Request(request_factory.get("/test/"))
        cloned = clone_drf_request(original)

        assert cloned is not None
        assert cloned.path == original.path

    def test_clone_request_with_params(self, request_factory):
        """Test request cloning with query parameters."""
        original = Request(request_factory.get("/test/", {"search": "foo"}))
        cloned = clone_drf_request(original)

        assert cloned.query_params.get("search") == "foo"


class Sentinel:
    """Records whether a template managed to call into Python code."""

    def __init__(self):
        self.fired = False

    def fire(self):
        self.fired = True
        return "fired"


class TestLazyFStringRendering:
    """Tests for what the lazy ``f`` template renders."""

    def test_renders_attribute_access(self, db, article):
        assert f("Article: {obj.title}").format(obj=article) == f"Article: {article.title}"

    def test_renders_nested_attribute_access(self, db, article):
        rendered = f("{obj.category.name}").format(obj=article)
        assert rendered == article.category.name

    def test_renders_mapping_key_access(self):
        assert f("{obj[name]}").format(obj={"name": "Chair"}) == "Chair"

    def test_renders_conversion(self):
        assert f("{obj!r}").format(obj="Chair") == "'Chair'"

    def test_renders_format_spec(self):
        assert f("{obj:.2f} USD").format(obj=12.5) == "12.50 USD"

    def test_renders_nested_format_spec(self):
        assert f("{obj:>{width}}").format(obj="x", width=3) == "  x"

    def test_renders_literal_braces(self):
        assert f("{{{obj}}}").format(obj="x") == "{x}"

    def test_renders_name_containing_underscore(self):
        assert f("{target_obj.first_name}").format(target_obj=SimpleNamespace(first_name="Ada")) == "Ada"

    def test_repr_keeps_the_template(self):
        assert repr(f("{obj.name}")) == "F({obj.name})"


class TestLazyFStringStrictness:
    """Tests for placeholders that cannot be resolved at render time."""

    def test_unknown_name_raises_key_error(self):
        with pytest.raises(KeyError):
            f("{missing}").format(obj=None)

    def test_attribute_on_none_raises_attribute_error(self):
        with pytest.raises(AttributeError):
            f("{obj.name}").format(obj=None)


class TestLazyFStringRejectedTemplates:
    """Tests for templates refused when the template is constructed."""

    @pytest.mark.parametrize(
        "template",
        [
            "{}",
            "{0}",
            "{obj.__class__}",
            "{obj.__class__.__init__.__globals__[SETTINGS]}",
            "{_secret}",
            "{obj._meta}",
            "{obj.name.upper()}",
            "{__import__('os').system('true')}",
            "{'shown' if obj else 'hidden'}",
            "{obj:>{obj.__class__}}",
        ],
    )
    def test_rejects_template_at_construction(self, template):
        with pytest.raises(ValueError):
            f(template)

    def test_error_names_the_offending_placeholder(self):
        with pytest.raises(ValueError, match=r"obj\.name\.upper\(\)"):
            f("Product: {obj.name.upper()}")

    def test_template_cannot_execute_code(self):
        sentinel = Sentinel()
        try:
            f("{obj.fire()}").format(obj=sentinel)
        except ValueError:
            pass
        assert sentinel.fired is False
