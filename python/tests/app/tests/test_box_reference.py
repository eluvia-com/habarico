"""
Tests for the reference a list or gallery box points at.

The resource and the parameters its schema request carries are one thing said once: a
``ResourceReference``. The box DSL keeps its flat keyword arguments and composes the object itself,
so an admin author writes the same thing as before.
"""

import pytest
from habarico.schema.boxes import GalleryBoxParameters, ListBox, ListBoxParameters


class TestListBoxReference:

    def test_the_resource_becomes_a_reference(self):
        data = ListBoxParameters(target="order", reference="order_item").to_dict()

        assert data["reference"] == {"resource": "order_item"}
        assert data["target"] == "order"

    def test_schema_params_travel_inside_the_reference(self):
        """They were always the query of the request that address names."""
        data = ListBoxParameters(target="order", reference="order_item", schema_params={"variant": "full"}).to_dict()

        assert data["reference"] == {"resource": "order_item", "params": {"variant": "full"}}

    def test_no_schema_params_key_remains(self):
        data = ListBoxParameters(target="order", reference="order_item", schema_params={"variant": "full"}).to_dict()

        assert "schema_params" not in data

    def test_a_foreign_service_splits_in_two(self):
        data = ListBoxParameters(target="school", reference="school/teacher").to_dict()

        assert data["reference"] == {"service": "school", "resource": "teacher"}


class TestListBoxToolbarIsGone:
    """
    A list box has one toolbar, the box's. A descriptor placed there names the resource it belongs
    to through its own reference, so a second toolbar inside the list parameters has no purpose.
    """

    def test_list_level_toolbar_actions_are_refused(self):
        with pytest.raises(TypeError, match="toolbar_actions"):
            ListBoxParameters(target="order", reference="order_item", toolbar_actions=["create"])

    def test_the_dsl_no_longer_takes_a_list_toolbar(self):
        with pytest.raises(TypeError, match="list_toolbar_actions"):
            ListBox(reference="order_item", target="order", list_toolbar_actions=["create"])

    def test_the_box_toolbar_still_takes_actions(self):
        """Where those actions go instead — on the box, each naming the resource it belongs to."""
        data = ListBox(reference="order_item", target="order", toolbar_actions=["create"]).to_dict()

        assert data["toolbar_actions"] == [{"type": "action", "name": "create"}]


class TestGalleryBoxReference:

    def test_the_resource_becomes_a_reference(self):
        data = GalleryBoxParameters(reference="photos/photo", image_field="image").to_dict()

        assert data["reference"] == {"service": "photos", "resource": "photo"}
        assert data["image_field"] == "image"

    def test_schema_params_travel_inside_the_reference(self):
        data = GalleryBoxParameters(
            reference="photo", image_field="image", schema_params={"variant": "thumb"}
        ).to_dict()

        assert data["reference"] == {"resource": "photo", "params": {"variant": "thumb"}}
        assert "schema_params" not in data
