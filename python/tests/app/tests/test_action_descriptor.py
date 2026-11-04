"""
Tests for ``ActionDescriptor`` — one entry in a view's action slot.

Two schemas share those slots, told apart by ``type``: ``ActionDescriptor`` names a single action,
``DefaultActionsDescriptor`` stands for a resource's defaults and the client expands it into one
action entry per action. ``reference`` says where a named action is defined and what it binds to.
"""

import pytest
from habarico.schema.actions import Action, DefaultActions, generate_actions_descriptor
from habarico.schema.reference import CURRENT, ResourceReference
from habarico.schema.types import ActionScopeType

UUID = "3fa85f64-5717-4562-b3fc-2c963f66afa6"


class TestActionEntry:
    """``type: action`` — the ordinary case, which is every descriptor that existed before."""

    def test_type_is_emitted(self):
        assert Action(name="edit").to_dict() == {"type": "action", "name": "edit"}

    def test_a_nameless_action_is_refused(self):
        """An action is the action it names; the signature is what says so."""
        with pytest.raises(TypeError, match="name"):
            Action()

    def test_menu_items_carry_their_own_type(self):
        """Nested descriptors are descriptors: the discriminator is required there too."""
        assert Action(name="more", menu_items=["edit", "delete"]).to_dict() == {
            "type": "action",
            "name": "more",
            "menu_items": [
                {"type": "action", "name": "edit"},
                {"type": "action", "name": "delete"},
            ],
        }

    def test_a_bare_string_normalizes_into_an_action(self):
        assert [descriptor.to_dict() for descriptor in generate_actions_descriptor(["edit"])] == [
            {"type": "action", "name": "edit"}
        ]


class TestActionReference:
    """Where the action named by ``name`` is defined, and what it is bound to."""

    def test_a_resource_name_becomes_a_reference(self):
        assert Action(name="create", reference="school/teacher").to_dict() == {
            "type": "action",
            "name": "create",
            "reference": {"service": "school", "resource": "teacher"},
        }

    def test_a_reference_object_is_taken_as_given(self):
        reference = ResourceReference("teacher", record_pk=UUID)

        assert Action(name="approve", reference=reference).to_dict() == {
            "type": "action",
            "name": "approve",
            "reference": {"resource": "teacher", "record_pk": UUID},
        }

    def test_current_resolves_against_the_stamped_source(self):
        """What an action of the surrounding record looks like from inside a list box."""
        source = ResourceReference("article", record_pk=UUID)

        assert Action(name="recalculate", reference=CURRENT).to_dict(schema_source=source) == {
            "type": "action",
            "name": "recalculate",
            "reference": {"resource": "article", "record_pk": UUID},
        }

    def test_no_reference_emits_no_key(self):
        """A descriptor without one resolves in the ambient schema, as it always did."""
        assert "reference" not in Action(name="edit").to_dict()


class TestDefaultActionsEntry:
    """
    ``DefaultActionsDescriptor`` — a resource's defaults, expanded by the client. A schema of its
    own: it names no action and carries none of a button's appearance, because a label, an icon and
    a colour belong to each action it expands into.
    """

    def test_it_carries_its_own_type(self):
        assert DefaultActions(reference="order_item").to_dict() == {
            "type": "default_actions",
            "reference": {"resource": "order_item"},
        }

    def test_it_carries_no_name(self):
        """``name`` has no meaning for a group: the expansion names each action itself."""
        assert "name" not in DefaultActions(reference="order_item").to_dict()

    def test_scope_narrows_which_actions_expand(self):
        assert DefaultActions(reference="order_item", scope=ActionScopeType.LIST).to_dict() == {
            "type": "default_actions",
            "reference": {"resource": "order_item"},
            "scope": "list",
        }

    def test_scope_accepts_a_plain_string(self):
        assert DefaultActions(reference="order_item", scope="detail").to_dict()["scope"] == "detail"

    def test_absent_scope_emits_no_key(self):
        """The contract's default is ``all``; the client applies it, the wire stays quiet."""
        assert "scope" not in DefaultActions(reference="order_item").to_dict()

    def test_no_reference_means_the_generated_resource(self):
        """A slot of a resource's own view does not have to name it."""
        assert DefaultActions().to_dict() == {"type": "default_actions"}

    def test_it_takes_none_of_a_buttons_appearance(self):
        """A label belongs to each expanded action, which already has one."""
        with pytest.raises(TypeError):
            DefaultActions(reference="order_item", label="Everything")

    def test_current_is_a_valid_reference(self):
        source = ResourceReference("article")

        assert DefaultActions(reference=CURRENT).to_dict(schema_source=source) == {
            "type": "default_actions",
            "reference": {"resource": "article"},
        }

    def test_it_passes_as_a_descriptor(self):
        """``generate_actions_descriptor`` must take it without wrapping it in an action."""
        descriptors = generate_actions_descriptor([DefaultActions(reference="order_item"), "create"])

        assert [descriptor.to_dict() for descriptor in descriptors] == [
            {"type": "default_actions", "reference": {"resource": "order_item"}},
            {"type": "action", "name": "create"},
        ]


class TestConfirmDialog:
    """
    The confirm dialog a descriptor puts in front of the action it names, overriding the one the
    action's own schema declares — the same override the descriptor offers for ``label``, ``icon``
    and ``color``.
    """

    def test_both_halves_make_a_dialog(self):
        assert Action(
            name="delete",
            confirm_dialog_title="Delete article",
            confirm_dialog_message="This cannot be undone.",
        ).to_dict() == {
            "type": "action",
            "name": "delete",
            "confirm_dialog": {"title": "Delete article", "message": "This cannot be undone."},
        }

    def test_no_dialog_emits_no_key(self):
        assert "confirm_dialog" not in Action(name="delete").to_dict()

    def test_half_a_dialog_is_refused(self):
        """
        The client takes the override whole (``descriptor.confirmDialog || schema.confirmDialog``) and
        never merges the halves, so a title alone would render a dialog with an empty body.
        """
        with pytest.raises(AssertionError, match="both a title and a message"):
            Action(name="delete", confirm_dialog_title="Delete article")
