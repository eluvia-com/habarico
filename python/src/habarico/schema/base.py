from __future__ import annotations

from copy import copy
from typing import TYPE_CHECKING, Any

from django.db.models import Model
from django.utils.functional import Promise
from eluvia_base.integrations.fieldset import RFS
from habarico.utils import LazyFString, remove_empty, remove_empty_schema
from rest_framework.request import Request

if TYPE_CHECKING:
    # `reference` imports this module, so the address type is available to annotations only.
    from habarico.schema.reference import ResourceReference

EMPTY = object()


def schema_getter(fn):
    """
    Mark a ``get_<field>`` method as a serialized field that has no backing ``self._<field>``
    attribute. The serializer discovers such methods and calls them during ``to_dict()``, so the
    value can be built lazily with access to ``self.context`` (request / object / render mode).

    Discovery is MRO-aware: a subclass may override the getter without re-applying this decorator
    and the field stays registered.
    """
    fn._is_schema_getter = True
    return fn


class SchemaContext:
    """
    Context for schema generation. The context is used to pass additional information to the schema generator.

    Args:
        request (Request, optional): The request to pass to the schema generator.
        obj (Model, optional): The object to pass to the schema generator.
        render_base_schema (bool, optional): Render base schema.
        render_object_schema (bool, optional): Render object schema.
        prefix (str, optional): The prefix to use for the schema.
        index (int, optional): The index to use for the schema.
        read_only (bool, optional): Whether the schema is readonly.
        action_url_name (str, optional): The action URL name to use for the schema.
        get_resource_callback (callable, optional): A callback to get the resource.
            It will be called when the resource is accessed for the first time.
        get_serializer_callback (callable, optional): A callback to get the serializer.
            It will be called when the serializer is accessed for the first time.
        get_view_schema_callback (callable, optional): A callback to get the view schema.
            It will be called when the view schema is accessed for the first time.
        get_target_obj_callback (callable, optional): A callback to get the target object.
            It will be called when the target object is accessed for the first time.
        schema_source (ResourceReference, optional): Address of the schema being generated, stamped
            once by the root generator. ``CURRENT`` resolves against it. Deliberately not derived
            from ``resource``: a nested generator overwrites that, so a descriptor inside a list box
            would resolve to the box instead of the page it was authored in.
        list_source (ResourceReference, optional): Address of the resource the surrounding box lists,
            stamped by that box for its own subtree. ``LIST`` resolves against it.
        context (SchemaContext, optional): The parent context to use for the schema.
            If not provided, the context will be created from the provided arguments.
        requested_fieldset (RFS, optional): The requested fieldset to use for the schema.
    """

    def __init__(
        self,
        *,
        request: Request = EMPTY,
        obj: Model = EMPTY,
        render_base_schema: bool = EMPTY,
        render_object_schema: bool = EMPTY,
        prefix: str = EMPTY,
        index: int = EMPTY,
        read_only: bool = EMPTY,
        action_url_name: str = EMPTY,
        get_resource_callback: callable = EMPTY,
        get_serializer_callback: callable = EMPTY,
        get_view_schema_callback: callable = EMPTY,
        get_target_obj_callback: callable = EMPTY,
        requested_fieldset: RFS = EMPTY,
        schema_source: ResourceReference = EMPTY,
        list_source: ResourceReference = EMPTY,
        context: SchemaContext = None,
    ):
        self._request = request
        self._obj = obj
        self._render_base_schema = render_base_schema
        self._render_object_schema = render_object_schema
        self._prefix = prefix
        self._read_only = read_only
        self._action_url_name = action_url_name
        self._index = index
        self._resource = EMPTY
        self._serializer = EMPTY
        self._view_schema = EMPTY
        self._get_resource_callback = get_resource_callback
        self._get_serializer_callback = get_serializer_callback
        self._get_view_schema_callback = get_view_schema_callback
        self._get_target_obj_callback = get_target_obj_callback
        self._target_obj = EMPTY
        self._requested_fieldset = requested_fieldset
        self._schema_source = schema_source
        self._list_source = list_source
        self._context = context

    PROPERTIES = [
        "request",
        "obj",
        "render_base_schema",
        "render_object_schema",
        "prefix",
        "read_only",
        "action_url_name",
        "index",
        "requested_fieldset",
        "schema_source",
        "list_source",
    ]

    CACHED_PROPERTIES = [
        "target_obj",
        "resource",
        "serializer",
        "view_schema",
    ]

    def __getattr__(self, name):
        if name in self.PROPERTIES:
            if getattr(self, f"_{name}") is not EMPTY:
                return getattr(self, f"_{name}")
            if self._context:
                return getattr(self._context, name)
            return None
        elif name in self.CACHED_PROPERTIES:
            if getattr(self, f"_{name}") is not EMPTY:
                return getattr(self, f"_{name}")
            if getattr(self, f"_get_{name}_callback") is not EMPTY:
                value = getattr(self, f"_get_{name}_callback")()
                setattr(self, f"_{name}", value)
                return value
            if self._context:
                return getattr(self._context, name)
            return None
        else:
            raise AttributeError(f"{self.__class__.__name__} object has no attribute {name}")

    def update(self, **kwargs):
        if not kwargs:
            return self
        return self.__class__(**kwargs, context=self)

    def get_format_kwargs(self):
        return {
            "request": self.request,
            "obj": self.obj,
            "target_obj": self.target_obj,
            "read_only": self.read_only,
        }


def schema_to_dict(value: Any, context: SchemaContext) -> Any:
    """
    Convert schema to dict. Other values are returned as is.
    """
    if isinstance(value, Promise):
        value = str(value)

    if isinstance(value, BaseSchema):
        return value.to_dict(index=0, context=context)
    elif isinstance(value, list):
        return remove_empty_schema(
            [
                v.to_dict(index=i, context=context) if isinstance(v, BaseSchema) else schema_to_dict(v, context)
                for i, v in enumerate(value)
            ]
        )
    elif isinstance(value, dict):
        return {k: schema_to_dict(v, context) for k, v in value.items()}
    elif isinstance(value, LazyFString):
        return value.format(**context.get_format_kwargs())
    return value


class BaseSchema:

    # Declared so it always exists: the binding to a context happens in `setup()`, when the schema is
    # serialized, never when an admin author declares the object. Never a constructor parameter for
    # the same reason.
    context: SchemaContext | None = None

    def _get_data_value(self, k):
        # Getter dispatch: if a ``get_<attr>`` method exists for the ``_<attr>`` key, use it to
        # compute the serialized value. This lets any schema object override its output based on
        # ``self.context`` (request / object / readonly / index / render mode) without having to
        # override ``to_dict``/``_get_dict_data``. The getter stays opt-in, so keys without one
        # serialize their raw stored value.
        if hasattr(self, f"get{k}"):
            return getattr(self, f"get{k}")()
        return getattr(self, k)

    @classmethod
    def _schema_getter_field_names(cls) -> set[str]:
        """Field names backed by a ``@schema_getter`` method anywhere in the MRO (cached per class)."""
        cache = cls.__dict__.get("_schema_getter_field_names_cache")
        if cache is not None:
            return cache
        names = {
            name[len("get_") :]
            for klass in cls.__mro__
            for name, fn in vars(klass).items()
            if name.startswith("get_") and getattr(fn, "_is_schema_getter", False)
        }
        cls._schema_getter_field_names_cache = names
        return names

    def _get_dict_data(self) -> dict:
        # Skip Python name-mangled attributes (``self.__x``) for every class in the MRO, so raw
        # constructor inputs stored privately never leak into the output - not even via a subclass.
        mangled_prefixes = tuple(f"_{klass.__name__}__" for klass in type(self).__mro__)
        # ``dict.fromkeys`` acts as an order-preserving set: it dedupes the getter-only synthetic keys
        # against the stored attributes while keeping attribute definition order stable in the output.
        keys = dict.fromkeys(k for k in self.__dict__ if k != "context" and not k.startswith(mangled_prefixes))
        # Getter-only fields have no backing attribute; add their synthetic ``_<field>`` key.
        keys.update(dict.fromkeys(f"_{name}" for name in self._schema_getter_field_names()))
        return {k.lstrip("_"): schema_to_dict(self._get_data_value(k), self.context) for k in keys}

    def setup(self, context=None, **kwargs) -> BaseSchema:
        """
        Setup the schema context. This method is called before converting the schema to a dict.
        """

        self.context = SchemaContext(**kwargs, context=context) if not context or kwargs else context
        return self

    def to_dict(self, **kwargs) -> dict | None:
        """
        The serialized schema, with the context bound to a copy of this object.

        A copy because a schema object is declared once — on an admin class, at import — and
        serialized per request: binding the context to the declared object would have two requests
        overwrite each other's, and a getter read the one that is not its own. Measured at ~1.4 µs
        per node, under 2% of building a schema.

        Args:
            **kwargs: What the context is built from, or ``context`` itself.

        Returns:
            dict: The schema, or None when there is nothing to render.
        """
        return copy(self).setup(**kwargs)._serialize()

    def _serialize(self) -> dict | None:
        """
        The serialized schema of an object already bound to its context.

        The hook a subclass overrides to serialize something other than its own stored fields;
        ``to_dict`` stays the entry point that binds the context.
        """
        if not self.can_render():
            return None

        data = remove_empty(self._get_dict_data())
        if not data:
            return None
        return data

    def can_render(self) -> bool:
        """
        Check if the schema can be rendered. This method should be overridden in subclasses.
        """
        return True
