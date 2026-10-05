"""
Tests for ``LIST`` — the resource the surrounding box lists.

A box's header toolbar renders in the parent's context, so a button for the listed resource has to
name it. ``LIST`` says it without repeating the name the box already carries, and keeps the two from
drifting apart when the box is later pointed somewhere else.

The address it resolves to is the whole query of the box's own schema request: its ``schema_params``
and the link to the record the surrounding view renders. The box's ``list`` slots need none of that —
they are read in the schema the box already asked for — but a header descriptor leaves that context,
so it has to carry it.
"""

import json

import pytest
from habarico.schema import CURRENT, LIST, Action, DefaultActions
from habarico.schema.boxes import GalleryBox, ListBox, ListBoxParameters
from habarico.schema.reference import build_resource_reference


def box_dict(box, **kwargs):
    return box.to_dict(**kwargs)


def on_record(box, article, parent="article"):
    """Serialize a box the way a detail view of its parent does."""
    return box_dict(box, obj=article, schema_source=build_resource_reference(parent, record_pk=article.pk))


class TestListResolvesToTheBoxesResource:

    def test_a_header_button_points_at_the_listed_resource(self):
        box = ListBox(reference="order_item", target="order", toolbar_actions=[Action(name="create", reference=LIST)])

        assert box_dict(box)["toolbar_actions"] == [
            {"type": "action", "name": "create", "reference": {"resource": "order_item"}}
        ]

    def test_default_actions_take_it_too(self):
        """What the slot is for: the listed resource's own buttons, in the box header."""
        box = ListBox(reference="order_item", target="order", toolbar_actions=[DefaultActions(reference=LIST)])

        assert box_dict(box)["toolbar_actions"] == [
            {"type": "default_actions", "reference": {"resource": "order_item"}}
        ]

    def test_a_foreign_service_splits_in_two(self):
        box = ListBox(
            reference="school/teacher", target="school", toolbar_actions=[Action(name="create", reference=LIST)]
        )

        assert box_dict(box)["toolbar_actions"][0]["reference"] == {"service": "school", "resource": "teacher"}

    def test_a_gallery_box_stamps_its_own(self):
        box = GalleryBox(
            reference="photo",
            image_field="file",
            target="product",
            toolbar_actions=[Action(name="upload-images", reference=LIST)],
        )

        assert box_dict(box)["toolbar_actions"][0]["reference"] == {"resource": "photo"}

    def test_the_query_of_the_boxes_schema_request_comes_along(self):
        """A button loading that resource's schema asks for it the way the box does."""
        box = ListBox(
            reference="order_item",
            target="order",
            schema_params={"variant": "full"},
            toolbar_actions=[Action(name="create", reference=LIST)],
        )

        assert box_dict(box)["toolbar_actions"][0]["reference"] == {
            "resource": "order_item",
            "params": {"variant": "full"},
        }

    def test_a_box_names_the_resource_it_lists(self):
        """
        A sentinel stands in place of an address, not inside one, so a box cannot point at
        ``CURRENT``: it exists to point elsewhere, and an author declaring it knows the name.
        """
        with pytest.raises(AssertionError, match="stands in place of an address"):
            ListBoxParameters(reference=CURRENT, target="parent")


class TestListOutsideABox:

    def test_it_is_refused(self):
        """
        Failing is louder than a button that never renders: the sentinel means a box that is not
        there, so the descriptor was placed somewhere it cannot mean anything.
        """
        with pytest.raises(AssertionError, match="LIST has no listed resource"):
            Action(name="create", reference=LIST).to_dict()

    def test_a_sibling_box_does_not_see_it(self):
        """The stamp belongs to the box's own subtree, not to the view it sits in."""
        from habarico.schema.boxes import Box

        outer = Box(
            boxes=[
                ListBox(reference="order_item", target="order"),
                Box(toolbar_actions=[Action(name="create", reference=LIST)]),
            ]
        )

        with pytest.raises(AssertionError, match="LIST has no listed resource"):
            outer.to_dict()


class TestParentLink:
    """
    The pair the box header cannot do without: the descriptor is rendered in the parent's context,
    so an address pointing out of it has to say which record it belongs to. The backend holds both
    halves — the record from the context, the column from the box.
    """

    def test_the_target_names_the_column_and_the_parent_id(self, db, article):
        box = ListBox(reference="comment", target="article", toolbar_actions=[Action(name="create", reference=LIST)])

        params = on_record(box, article)["toolbar_actions"][0]["reference"]["params"]

        assert json.loads(params["_target"]) == {"article": article.pk}

    def test_the_source_names_the_parent_resource_and_the_same_id(self, db, article):
        box = ListBox(reference="comment", target="article", toolbar_actions=[Action(name="create", reference=LIST)])

        params = on_record(box, article)["toolbar_actions"][0]["reference"]["params"]

        assert json.loads(params["_source"]) == {"article": article.pk}

    def test_the_source_carries_the_service_of_a_foreign_parent(self, db, article):
        box = ListBox(reference="comment", target="article", toolbar_actions=[Action(name="create", reference=LIST)])

        params = on_record(box, article, parent="school/article")["toolbar_actions"][0]["reference"]["params"]

        assert json.loads(params["_source"]) == {"school/article": article.pk}

    def test_a_box_without_a_target_still_names_the_parent(self, db, article):
        """``_target`` needs a column to filter by; the source is known either way."""
        box = ListBox(reference="comment", toolbar_actions=[Action(name="create", reference=LIST)])

        params = on_record(box, article)["toolbar_actions"][0]["reference"]["params"]

        assert "_target" not in params
        assert json.loads(params["_source"]) == {"article": article.pk}

    def test_no_record_means_no_link(self, db):
        """A collection schema renders no box of a record, so there is no parent to link to."""
        box = ListBox(reference="comment", target="article", toolbar_actions=[Action(name="create", reference=LIST)])

        assert "params" not in box_dict(box)["toolbar_actions"][0]["reference"]

    def test_declared_schema_params_survive_beside_the_link(self, db, article):
        box = ListBox(
            reference="comment",
            target="article",
            schema_params={"variant": "full"},
            toolbar_actions=[Action(name="create", reference=LIST)],
        )

        params = on_record(box, article)["toolbar_actions"][0]["reference"]["params"]

        assert params["variant"] == "full"
        assert json.loads(params["_target"]) == {"article": article.pk}

    def test_the_spelling_matches_the_frontends(self, db, article):
        """
        ``JSON.stringify`` puts no space after the separators, and the frontend composes this very
        pair for the box's own schema request — two spellings of one fact would have the client cache
        the same schema twice.
        """
        box = ListBox(reference="comment", target="article", toolbar_actions=[Action(name="create", reference=LIST)])

        params = on_record(box, article)["toolbar_actions"][0]["reference"]["params"]

        assert params["_target"] == f'{{"article":{article.pk}}}'

    def test_a_uuid_key_is_serialized_rather_than_refused(self, db, product):
        """``Product`` has a UUID primary key, which plain ``json.dumps`` raises on."""
        box = ListBox(reference="image", target="product", toolbar_actions=[Action(name="create", reference=LIST)])

        params = on_record(box, product, parent="product")["toolbar_actions"][0]["reference"]["params"]

        assert json.loads(params["_target"]) == {"product": str(product.pk)}
        assert json.loads(params["_source"]) == {"product": str(product.pk)}

    def test_the_boxes_own_list_slots_stay_bare(self, db, article):
        """They are read in the schema the box already requested with this very query."""
        box = ListBox(reference="comment", target="article")

        assert on_record(box, article)["list"]["row_actions"] == [{"type": "default_actions", "scope": "detail"}]
