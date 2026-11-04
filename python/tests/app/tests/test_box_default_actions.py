"""
Tests for the default actions a list box publishes.

A box's ``list`` slots are rendered in the schema of the resource the box points at, so an entry
there names no resource either — an absent address is that resource, the same rule a view's own slot
follows.

The parent link those actions need is the client's: it composes the ``_target`` / ``_source`` pair
from the box's ``target`` and the record it renders, and loads the box's schema with it.
"""

from habarico.schema.boxes import ListBoxParameters


def box_slots(target="article", reference="comment", **kwargs):
    return ListBoxParameters(target=target, reference=reference, **kwargs).to_dict()


class TestListBoxDefaultActions:

    def test_row_actions_default_to_the_listed_records_own(self):
        """Row buttons act on one record, whose id the row supplies — hence ``detail`` scope."""
        assert box_slots()["row_actions"] == [{"type": "default_actions", "scope": "detail"}]

    def test_list_actions_default_to_the_collections_own(self):
        """The buttons above the table act on the collection — the same slot, the other scope."""
        assert box_slots()["list_actions"] == [{"type": "default_actions", "scope": "list"}]

    def test_the_entries_name_no_resource(self):
        """The box names it once, in ``list.reference``; its slots are read in that context."""
        slot = box_slots()["row_actions"]

        assert "reference" not in slot[0]

    def test_a_declared_slot_wins(self):
        assert box_slots(row_actions=["edit"])["row_actions"] == [{"type": "action", "name": "edit"}]

    def test_an_explicitly_empty_slot_stays_empty(self):
        """``[]`` is a decision, and it survives serialization as one: absent is what means nothing."""
        assert box_slots(row_actions=[])["row_actions"] == []

    def test_none_turns_the_default_off(self):
        """
        The switch an author reaches for. Only a slot nothing was said about carries the default,
        which is why the unset state is a sentinel of its own rather than ``None``.
        """
        assert "row_actions" not in box_slots(row_actions=None)

    def test_each_slot_switches_on_its_own(self):
        assert "list_actions" not in box_slots(list_actions=None)
        assert box_slots(list_actions=None)["row_actions"] == [{"type": "default_actions", "scope": "detail"}]
