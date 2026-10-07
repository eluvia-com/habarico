"""
Tests for what an endpoint addresses.

Which resource, which record and which action are one address — a ``ResourceReference`` — while
``path`` and ``method`` stay beside it: how a thing is called is not part of where it is.
"""

import pytest
from habarico.schema.actions import ResourceActionEndpointParameters, ResourceActionSchema
from habarico.schema.reference import ResourceReference
from habarico.schema.types import ActionType
from habarico.schema.views import ViewEndpointParameters

UUID = "3fa85f64-5717-4562-b3fc-2c963f66afa6"


class TestViewEndpoint:

    def test_the_address_is_one_object(self):
        data = ViewEndpointParameters(
            method="get",
            reference=ResourceReference("article", action_name="approve"),
        ).to_dict()

        assert data == {"method": "get", "reference": {"resource": "article", "action_name": "approve"}}

    def test_the_parts_are_no_longer_flat(self):
        with pytest.raises(TypeError, match="action_name"):
            ViewEndpointParameters(method="get", action_name="approve")

    def test_an_address_is_optional(self):
        """Absent means the resource the schema was generated for."""
        assert ViewEndpointParameters(method="get").to_dict() == {"method": "get"}


class TestResourceActionEndpoint:

    def test_path_and_method_stay_beside_the_address(self):
        data = ResourceActionEndpointParameters(
            method="post",
            path="/admin/articles/7/approve/",
            reference=ResourceReference("article", record_pk=UUID),
        ).to_dict()

        assert data == {
            "method": "post",
            "path": "/admin/articles/7/approve/",
            "reference": {"resource": "article", "record_pk": UUID},
        }

    def test_the_parts_are_no_longer_flat(self):
        with pytest.raises(TypeError, match="record_pk"):
            ResourceActionEndpointParameters(method="post", record_pk=UUID)


class TestViewActionEndpointParametersIsGone:
    """Its three properties were the address and nothing else, so the wrapper had no content left."""

    def test_the_class_no_longer_exists(self):
        with pytest.raises(ImportError):
            from habarico.schema.menu import ViewActionEndpointParameters  # noqa: F401


class TestActionSchemaEndpoint:
    """What a declared action puts on the wire."""

    def test_a_resource_action_carries_one_address(self):
        action = ResourceActionSchema(
            name="approve",
            type=ActionType.RESOURCE,
            reference="article",
            action_name="approve",
            record_pk=7,
            resource_path="/admin/articles/7/approve/",
            resource_method="post",
        )

        assert action.to_dict()["resource"]["endpoint"] == {
            "method": "post",
            "path": "/admin/articles/7/approve/",
            "reference": {"resource": "article", "action_name": "approve", "record_pk": 7},
        }

    def test_a_view_action_carries_one_address(self):
        action = ResourceActionSchema(
            name="show",
            type=ActionType.VIEW,
            view_name="show",
            reference="article",
            record_pk=7,
        )

        assert action.to_dict()["view"]["reference"] == {"resource": "article", "record_pk": 7}

    def test_an_action_part_without_a_resource_is_refused(self):
        """
        ``action_name`` and ``record_pk`` live inside the address now, so there is nowhere to put
        them without one. Dropping them silently would leave the action calling the wrong endpoint;
        filling the resource is the generator's job, since it knows which admin it serves.
        """
        with pytest.raises(AssertionError, match="reference"):
            ResourceActionSchema(
                name="approve",
                type=ActionType.RESOURCE,
                resource_method="post",
                action_name="approve",
            )

    def test_an_action_addressing_nothing_at_all_is_fine(self):
        """A plain action on the generated resource needs no address; absence says that."""
        action = ResourceActionSchema(name="save", type=ActionType.SAVE)

        assert "reference" not in (action.to_dict().get("resource") or {})
