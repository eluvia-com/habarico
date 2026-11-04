from __future__ import annotations

from .base import BaseSchema
from .types import PkType


class ContextResourceReference(BaseSchema):
    """
    A reference that takes its address from the context instead of naming one.

    It stands wherever a ``ResourceReference`` stands — written by an admin author in place of a
    resource name — and serializes as the address stamped under ``key``, so what goes on the wire is
    always a plain address. It carries no parts of its own: an author who needs a different record,
    action or query writes the address out.

    ``CURRENT`` and ``LIST`` are the two, kept as module-level values an author writes and shared by
    every descriptor that does, the way every other schema object is declared once and serialized per
    request.
    """

    def __init__(self, label: str, key: str, failure: str):
        """
        Args:
            label (str): How the sentinel is written, which is also what a failure names.
            key (str): Context attribute holding the address it stands for.
            failure (str): The rest of the message when nothing stamped that address.
        """
        self.__label = label
        self.__key = key
        self.__failure = failure

    def __repr__(self) -> str:
        return self.__label

    def _serialize(self) -> dict:
        """
        The stamped address, serialized in this reference's place.

        Raises:
            AssertionError: When nothing stamped the address, which is louder than a button that
                silently fails to render.
        """
        source = getattr(self.context, self.__key, None) if self.context else None
        assert source is not None, f"{self.__label} {self.__failure}"
        return source.to_dict(context=self.context)


# The address of the request the schema is served for — the page a descriptor was authored on.
CURRENT = ContextResourceReference(
    "CURRENT",
    "schema_source",
    "has no schema source to resolve against. It is stamped by LocalResourceSchemaGenerator, so this "
    "schema was built outside the per-resource routes.",
)

# The collection a surrounding box lists, which its header toolbar renders outside of.
LIST = ContextResourceReference(
    "LIST",
    "list_source",
    "has no listed resource to resolve against. It is stamped by the box that lists one, so this "
    "reference is not inside a list or gallery box.",
)


class ResourceReference(BaseSchema):
    """
    Address of a resource, optionally narrowed to one record and one of its actions.

    The parts are the ones a route is built from: the service, ``admin/{resource_name}``, then the
    optional ``{record_pk}`` and ``{action_name}`` segments, then the query. A bare name belongs to
    this service and leaves ``service`` out — a backend cannot name its own service.

    A value object: the parts are what an author wrote, and ``CURRENT`` / ``LIST`` stand in its place
    rather than inside it.
    """

    def __init__(
        self,
        resource: str,
        *,
        service: str | None = None,
        record_pk: PkType | None = None,
        action_name: str | None = None,
        params: dict[str, str] | None = None,
    ):
        """
        Args:
            resource (str): Resource name, without a service — splitting a prefixed one is
                ``build_resource_reference()``'s job.
            service (str, optional): Service the resource belongs to. Defaults to None, which means
                this service.
            record_pk (PkType, optional): Record to narrow to. Defaults to None.
            action_name (str, optional): Action whose own schema is addressed. Defaults to None.
            params (dict[str, str], optional): Query string of the addressed request. Defaults to None.
        """
        assert resource, "ResourceReference needs a resource; an address is either omitted or complete."
        assert isinstance(resource, str), (
            f"{resource!r} stands in place of an address, not inside one. Pass it as the reference "
            "itself, or write the address out."
        )
        assert "/" not in resource, (
            f"{resource!r} carries a service. Pass the two halves apart, or compose the address with "
            "build_resource_reference(), which splits a name."
        )

        self._service = service
        self._resource = resource
        self._record_pk = record_pk
        self._action_name = action_name
        self._params = params

    @property
    def qualified_name(self) -> str:
        """
        The address as one ``service/resource`` name, or the bare resource when it has no service.

        The form a query string names a resource by — ``_source`` carries it as a key — and what
        registration-time validation reads, which runs long before any request.
        """
        return f"{self._service}/{self._resource}" if self._service else self._resource


def build_resource_reference(
    name: str,
    *,
    record_pk: PkType | None = None,
    action_name: str | None = None,
    params: dict[str, str] | None = None,
) -> ResourceReference:
    """
    Compose an address from a name that may carry its service, which is how an author writes one.

    The one place a ``service/resource`` string is taken apart: the address itself keeps the halves
    apart, the way the wire carries them.

    Args:
        name (str): Resource name, bare (``'teacher'``) or prefixed (``'school/teacher'``).
        record_pk (PkType, optional): Record to narrow to. Defaults to None.
        action_name (str, optional): Action whose own schema is addressed. Defaults to None.
        params (dict[str, str], optional): Query string of the addressed request. Defaults to None.

    Returns:
        ResourceReference: The composed address.
    """
    assert isinstance(name, str), (
        f"{name!r} stands in place of an address, not inside one. Pass it as the reference itself, "
        "or write the address out."
    )

    service, _, resource = name.rpartition("/")
    return ResourceReference(
        resource,
        service=service or None,
        record_pk=record_pk,
        action_name=action_name,
        params=params,
    )


def build_endpoint_reference(
    resource: str | None,
    action_name: str | None = None,
    record_pk: PkType | None = None,
) -> ResourceReference | None:
    """
    Compose what an endpoint addresses from the flat parts a generator holds.

    Args:
        resource (str, optional): Resource the endpoint is on.
        action_name (str, optional): Action it calls. Defaults to None.
        record_pk (PkType, optional): Record it acts on. Defaults to None.

    Returns:
        ResourceReference: The address, or None when there is nothing to address — which the client
        reads as the resource the schema was generated for.

    Raises:
        AssertionError: When an action or a record is given without a resource to attach it to.
            Those parts live inside the address, so dropping them would leave the action calling a
            different endpoint than the one that was declared.
    """
    if resource is None:
        assert action_name is None and record_pk is None, (
            "An endpoint's action_name and record_pk belong inside its reference, so they need a "
            "resource. Pass the resource the action is on."
        )
        return None
    return build_resource_reference(resource, action_name=action_name, record_pk=record_pk)


def generate_resource_reference(
    reference: ResourceReference | str | ContextResourceReference | None,
) -> ResourceReference | ContextResourceReference | None:
    """
    Normalize what an admin author wrote into something that addresses a resource.

    Args:
        reference (ResourceReference | str | ContextResourceReference, optional): A reference, a resource name,
            ``CURRENT`` or ``LIST``.

    Returns:
        ResourceReference | ContextResourceReference: The reference, the sentinel as it was given, or
        None when there was nothing to normalize.
    """
    if reference is None or isinstance(reference, (ResourceReference, ContextResourceReference)):
        return reference
    return build_resource_reference(reference)
