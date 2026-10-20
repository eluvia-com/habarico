"""
Tests for ``ResourceReference`` — the address of a resource, optionally narrowed to one record
and one of its actions.

The contract (``contract/openapi.yaml``) defines it as the parts a route is built from: the
service, ``admin/{resource_name}``, the optional ``{record_pk}`` and ``{action_name}`` segments,
and the query. These tests cover the backend side of that: normalizing what an admin author
writes into those parts, and resolving the ``CURRENT`` sentinel against the schema being
generated.
"""

import pytest
from habarico.schema.actions import Action
from habarico.schema.reference import (
    CURRENT,
    LIST,
    ResourceReference,
    build_resource_reference,
    generate_resource_reference,
)

UUID = "3fa85f64-5717-4562-b3fc-2c963f66afa6"


class TestResourceReferenceParts:
    """A reference serializes to the route parts, and to nothing it was not given."""

    def test_bare_name_is_the_resource(self):
        assert ResourceReference("teacher").to_dict() == {"resource": "teacher"}

    def test_the_service_is_a_part_of_its_own(self):
        assert ResourceReference("teacher", service="school").to_dict() == {
            "service": "school",
            "resource": "teacher",
        }

    def test_a_prefixed_name_is_refused(self):
        """Splitting one is ``build_resource_reference``'s job; the address keeps the halves apart."""
        with pytest.raises(AssertionError, match="carries a service"):
            ResourceReference("school/teacher")

    def test_every_part_serializes(self):
        reference = build_resource_reference(
            "school/teacher",
            record_pk=UUID,
            action_name="approve",
            params={"_target": '{"school": "1"}'},
        )

        assert reference.to_dict() == {
            "service": "school",
            "resource": "teacher",
            "record_pk": UUID,
            "action_name": "approve",
            "params": {"_target": '{"school": "1"}'},
        }

    def test_unset_parts_are_absent_rather_than_null(self):
        """Both backends strip nulls, so an unset part must not reach the wire at all."""
        assert ResourceReference("teacher", record_pk=None, action_name=None).to_dict() == {"resource": "teacher"}


class TestResourceReferenceNormalization:
    """What an admin author may write in place of a reference."""

    def test_a_plain_string_becomes_a_reference(self):
        """A prefixed name is split on the way in, which is the only place that happens."""
        assert generate_resource_reference("school/teacher").to_dict() == {
            "service": "school",
            "resource": "teacher",
        }

    def test_a_reference_is_left_alone(self):
        reference = ResourceReference("teacher")
        assert generate_resource_reference(reference) is reference

    def test_nothing_stays_nothing(self):
        assert generate_resource_reference(None) is None


class TestContextResourceReference:
    """
    ``CURRENT`` and ``LIST`` stand in place of an address, not inside one: the serializer swaps the
    sentinel for the address stamped on the context, so a descriptor holding one emits a plain
    address and nothing has to be merged.
    """

    def test_a_sentinel_resolves_to_the_whole_stamp(self):
        source = build_resource_reference("school/article", record_pk=UUID, action_name="publish")

        assert Action(name="approve", reference=CURRENT).to_dict(schema_source=source)["reference"] == {
            "service": "school",
            "resource": "article",
            "record_pk": UUID,
            "action_name": "publish",
        }

    def test_the_query_the_schema_was_asked_with_comes_along(self):
        source = ResourceReference("article", params={"_target": '{"author": "1"}'})

        reference = Action(name="approve", reference=CURRENT).to_dict(schema_source=source)["reference"]

        assert reference["params"] == {"_target": '{"author": "1"}'}

    def test_a_collection_stamp_omits_the_pk(self):
        """A collection schema has no single record, so the pk segment is left out."""
        source = ResourceReference("article")

        assert Action(name="approve", reference=CURRENT).to_dict(schema_source=source)["reference"] == {
            "resource": "article"
        }

    def test_it_is_written_the_way_it_reads(self):
        """What a failure and a repr name it: the sentinel as the author typed it."""
        assert (repr(CURRENT), repr(LIST)) == ("CURRENT", "LIST")

    def test_neither_reads_the_others_stamp(self):
        """One object with the key it reads, so the two cannot be satisfied by each other."""
        source = ResourceReference("article")

        with pytest.raises(AssertionError, match="CURRENT"):
            Action(name="approve", reference=CURRENT).to_dict(list_source=source)
        with pytest.raises(AssertionError, match="LIST"):
            Action(name="approve", reference=LIST).to_dict(schema_source=source)

    def test_an_unstamped_sentinel_is_refused(self):
        """
        Descriptors only reach the client through ``LocalResourceSchemaGenerator``, which stamps the
        source — the global schema carries none. So an unstamped sentinel means the schema was built
        outside that path, and failing is louder than a button that never renders.
        """
        with pytest.raises(AssertionError, match="no schema source"):
            Action(name="approve", reference=CURRENT).to_dict()

    def test_it_ignores_the_ambient_resource(self):
        """
        A nested generator overwrites ``context.resource``; the stamped source is what a descriptor
        inside a list box must resolve against.
        """
        source = ResourceReference("article")

        reference = Action(name="approve", reference=CURRENT).to_dict(
            schema_source=source, get_resource_callback=lambda: "order_item"
        )["reference"]

        assert reference == {"resource": "article"}

    def test_it_cannot_be_put_inside_an_address(self):
        """An author who needs other parts writes the address out, which is what the message says."""
        with pytest.raises(AssertionError, match="stands in place of an address"):
            ResourceReference(CURRENT, params={"mode": "quick"})


class TestResourceReferenceRejections:
    """A half-given address is a configuration error, not a value to serialize."""

    def test_a_reference_without_a_resource_is_refused(self):
        with pytest.raises(AssertionError):
            ResourceReference(None)

    def test_an_empty_resource_is_refused(self):
        with pytest.raises(AssertionError):
            ResourceReference("")
