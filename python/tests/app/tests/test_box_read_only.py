"""
Tests for a box's read-only flag when it holds only other boxes.

Such a box is read-only when every box inside it is, so it asks them — in the context it is
serialized in, since a box declared on an admin carries none of its own.
"""

from habarico.schema.base import SchemaContext
from habarico.schema.boxes import Box


def serialize(box, read_only=False):
    return box.to_dict(context=SchemaContext(read_only=read_only))


class TestBoxOfBoxesReadOnly:

    def test_editable_inner_boxes_keep_the_box_editable(self):
        box = Box(boxes=[Box(boxes=["name"]), Box(boxes=["price"])])

        assert not serialize(box).get("read_only")

    def test_read_only_inner_boxes_make_the_box_read_only(self):
        box = Box(boxes=[Box(boxes=["name"], read_only=True), Box(boxes=["price"], read_only=True)])

        assert serialize(box)["read_only"] is True

    def test_one_editable_inner_box_keeps_the_box_editable(self):
        box = Box(boxes=[Box(boxes=["name"], read_only=True), Box(boxes=["price"])])

        assert not serialize(box).get("read_only")

    def test_a_read_only_context_makes_the_box_read_only(self):
        box = Box(boxes=[Box(boxes=["name"]), Box(boxes=["price"])])

        assert serialize(box, read_only=True)["read_only"] is True

    def test_the_declared_inner_boxes_stay_unbound(self):
        inner = Box(boxes=["name"])

        serialize(Box(boxes=[inner]))

        assert inner.context is None
