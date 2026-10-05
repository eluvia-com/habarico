from __future__ import annotations

import inspect
import json
import re
from collections.abc import Callable
from copy import deepcopy
from dataclasses import dataclass
from string import Formatter
from typing import TYPE_CHECKING, Any
from urllib.parse import parse_qsl, urlparse

from django.core.exceptions import ImproperlyConfigured
from django.db.models import Model
from django.http import HttpRequest
from eluvia_base.integrations.fieldset import ALL_FIELDS, DEFAULT_FIELDS, RF, RFS
from rest_framework.exceptions import APIException
from rest_framework.fields import Field, empty
from rest_framework.request import Request, clone_request
from rest_framework.reverse import reverse
from rest_framework.utils.encoders import JSONEncoder

from .config import NAMESPACE
from .fast_resolve import fast_resolve

if TYPE_CHECKING:
    from django.db.models import Field as DjangoField
    from habarico.admin import ModelAdmin
    from rest_framework.views import APIView


DEFAULT_PK = "0"

_FIELDSET_WILDCARDS = (ALL_FIELDS, DEFAULT_FIELDS)


def resolve_fieldset_defaults(requested: RFS | None, default: RFS | None) -> RFS | None:
    """Recursively replace ALL_FIELDS / DEFAULT_FIELDS placeholders in ``requested``
    with fields from ``default``.

    ALL_FIELDS / DEFAULT_FIELDS at any level expand to all fields from the
    corresponding ``default`` sub-tree at that level. Explicit fields alongside
    a wildcard override the matching default field entirely (no merging, just
    replacement). Explicit sub-fieldsets are resolved recursively against the
    corresponding default sub-fieldset of the same field name.

    Args:
        requested: Fieldset to resolve. May contain ALL_FIELDS / DEFAULT_FIELDS
            wildcards at any level. Returns ``None`` when ``None`` is passed so
            the caller can fall back to the full default.
        default: Fieldset used as the expansion source for wildcards. Can be
            ``None`` when no default exists for a given level, in which case
            wildcards at that level expand to nothing.

    Returns:
        Resolved fieldset with all wildcards replaced, or ``None`` if
        ``requested`` is ``None``.
    """
    if requested is None:
        return None

    has_wildcard = any(name in requested for name in _FIELDSET_WILDCARDS)

    result_map: dict[str, RF] = {}

    # Seed result with all default fields when a wildcard is present.
    if has_wildcard and default:
        for rf in default:
            result_map[rf.name] = deepcopy(rf)

    # Apply / override with explicitly requested fields.
    for rf in requested:
        if rf.name in _FIELDSET_WILDCARDS:
            continue

        # Look up the matching default sub-tree for this field.
        default_rf = result_map.get(rf.name) or (default.get(rf.name) if default else None)
        default_sub = default_rf.fieldset if default_rf else None

        if rf.fieldset:
            result_map[rf.name] = RF(rf.name, resolve_fieldset_defaults(rf.fieldset, default_sub))
        else:
            result_map[rf.name] = deepcopy(rf)

    return RFS(*result_map.values()) if result_map else None


DEFAULT_OPERATOR_ORDER = ["icontains", "contains", "exact", None]
CLONE_REQUEST_QUERY_PARAMS = ["_target", "_source"]


def dump_query_json(value: Any) -> str:
    """
    One query-string value as JSON, written the way the frontend writes the same one.

    ``JSON.stringify`` puts no space after the separators and leaves non-ASCII alone, so a parameter
    the backend composes and one the client composes for the same fact are the same string — which is
    what keeps the client from caching one request twice. Values the API serializes specially, a UUID
    key above all, go through DRF's encoder rather than raising.

    Args:
        value (Any): The value to write.

    Returns:
        str: The JSON text of the value.
    """
    return json.dumps(value, cls=JSONEncoder, separators=(",", ":"), ensure_ascii=False)


def reverse_action(namespace: str, reference: str, url_name: str, args: Any = None, kwargs: Any = None) -> str:
    """
    Reverse the action for the given `url_name` returns the URL path of the REST view.

    Args:
        namespace (str): The namespace of the view.
        reference (str): The reference of the model in the admin site.
        url_name (str): The name of the action.
        args (Any): The positional arguments.
        kwargs (Any): The keyword arguments.

    Returns:
        str: The URL path of the REST view.
    """
    url_name = f"{reference}-{url_name}"
    url_name = namespace + ":" + url_name
    return reverse(url_name, args=args, kwargs=kwargs)


def get_reference_from_model(model: Model) -> str:
    """
    Get the reference of the model in the admin site. It can be used to generate reference for the related fields.

    Args:
        model (Model): The model to get the reference for.

    Returns:
        str: The reference of the model in the admin site.
    """
    from habarico.site import site

    reference = model.__name__.lower()
    if reference and site.exists_admin(reference):
        return reference
    return None


def get_admin_view(name: str) -> APIView | None:
    """
    Get the viewset for the admin by name.

    Args:
        name (str): The name of the admin.

    Returns:
        APIView | None: The viewset for the admin.
    """
    from habarico.site import site

    if not site.exists_admin(name):
        return None

    return site.get_admin(name).viewset


def clone_django_request(request: HttpRequest, path: str = None, method: str = None, query: dict = None) -> HttpRequest:
    """
    Clone a Django request with the given parameters.

    Args:
        request (HttpRequest): The original Django request.
        path (str): The URL path.
        method (str): The HTTP method.
        query (dict): The GET parameters.

    Returns:
        HttpRequest: A cloned Django request with the specified parameters.
    """

    cloned_request = HttpRequest()
    # Uppercase by Django convention. It is not cosmetic: the CSRF check exempts safe methods by
    # comparing against ("GET", "HEAD", "OPTIONS", "TRACE"), so a lowercase "get" would be treated
    # as unsafe and make SessionAuthentication fail the clone on a missing CSRF cookie.
    cloned_request.method = (method or request.method).upper()
    cloned_request.path = path or request.path
    cloned_request.META = request.META.copy()  # HTTP headers, env
    cloned_request.GET = query or request.GET.copy()
    cloned_request.POST = request.POST.copy()
    cloned_request.COOKIES = request.COOKIES.copy()

    # Carry the caller's identity over. ``SessionAuthentication`` reads the user straight off this
    # object, so a clone without it authenticates as anonymous - which would make the permission
    # check that guards a cloned view reject perfectly legitimate requests. Read them from the
    # underlying Django request rather than through DRF's proxy, so that nothing here triggers
    # authentication as a side effect.
    source = getattr(request, "_request", request)
    for attribute in ("user", "session"):
        if hasattr(source, attribute):
            setattr(cloned_request, attribute, getattr(source, attribute))

    return cloned_request


def clone_drf_request(request: Request, path: str = None, method: str = None, query: dict = None) -> Request:
    """
    Clone a DRF request with the given parameters.

    Args:
        request (Request): The original DRF request.
        path (str): The URL path.
        method (str): The HTTP method.
        query (dict): The query string.

    Returns:
        Request: A cloned DRF request with the specified parameters.
    """
    method = method.upper() if method else None
    cloned_request = clone_request(
        request,
        method=method,
    )
    cloned_request._request = clone_django_request(request, method=method, path=path, query=query)
    return cloned_request


def get_admin_permission_method_name(flag: str) -> str:
    """
    Return the name of the ``ModelAdmin`` method answering whether ``flag`` allows an action.

    The always-callable form of a declaration that may be a bool or a method taking the request
    (HAB-948): ``can_read`` is answered by ``has_read_permission(request)``. Derived from the flag
    rather than listed beside ``PERMISSION_FLAG_PER_ACTION``, so a declaration cannot be added to
    one half of the pair and forgotten in the other.

    Args:
        flag (str): The name of the declaration, e.g. ``"can_read"``.

    Returns:
        str: The name of the method to ask on the admin, e.g. ``"has_read_permission"``.
    """
    return f"has_{flag.removeprefix('can_')}_permission"


def get_admin_permission_method(admin: ModelAdmin, flag: str) -> Callable[[Request | None], bool]:
    """
    Return the bound ``ModelAdmin`` method answering whether ``flag`` allows an action.

    Args:
        admin (ModelAdmin): The admin whose declaration is being resolved.
        flag (str): The name of the declaration, e.g. ``"can_read"``.

    Returns:
        Callable: The method to call with the request being served.

    Raises:
        ImproperlyConfigured: When the admin has no method for this flag - a declaration named in
            ``PERMISSION_FLAG_PER_ACTION`` that nothing answers. Raised rather than answered with
            None so that no caller can read "nothing to ask" as "allowed": nobody was asked, so
            this is a broken declaration and not a user who lacks the permission, and refusing the
            action quietly would hide it instead of pointing at what is wrong.
    """
    method_name = get_admin_permission_method_name(flag)
    method = getattr(admin, method_name, None)
    if method is None:
        raise ImproperlyConfigured(f"{type(admin).__name__} declares {flag}, but has no {method_name}() to answer it.")
    return method


def check_view_permissions(view: APIView, request: Request, obj: Model | None = None) -> bool:
    """
    Check if the user has permission to access the view. According to DRF permissions.

    Args:
        view (APIView): The view to check permissions for.
        request (Request): The request to check permissions for.
        obj (Model, optional): The object to check permissions for.

    Returns:
        bool: True if the user has permission to access the view.
    """
    try:
        view.check_permissions(request)
        if obj:
            view.check_object_permissions(request, obj)
        return True
    except APIException:
        return False


def clone_view(method: str, request: Request, path: str) -> APIView:
    """
    Given a callback, return an actual view instance.

    Only paths inside the habarico application namespace resolve. The function already assumes a
    ViewSet routed by an admin router - it reads ``callback.actions`` to pick the action - and a
    project's own URLs have no business being reachable through an admin filter that takes the
    path from the client (HAB-905).

    The view is built the way ``as_view()`` would build it, but ``dispatch()`` never runs, so
    **no authentication, authorization or throttling has been applied to it**. A caller that lets
    user input decide which path to clone has to gate the result with ``check_view_permissions()``
    itself - see ``AdminFilterSet.filter__reverse_field``.

    Args:
        method (str): The HTTP method.
        request (Request): The DRF request.
        path (str): The URL path.

    Returns:
        APIView: The view instance, or None if the path does not resolve to a habarico view.
    """

    parsed = urlparse(path)
    resolved_view = fast_resolve(parsed.path)
    if not resolved_view or NAMESPACE not in resolved_view.app_names:
        return None
    callback = resolved_view.func
    args = resolved_view.args
    kwargs = resolved_view.kwargs

    query = dict(parse_qsl(parsed.query))
    for param in CLONE_REQUEST_QUERY_PARAMS:
        if param in request.GET:
            query[param] = request.GET.get(param)

    cloned_request = clone_drf_request(request, method=method, path=path, query=query if parsed.query else {})
    view = callback.cls(**getattr(callback, "initkwargs", {}))
    view.setup(cloned_request, *args, **kwargs)
    view.format_kwarg = None
    view.action_map = getattr(callback, "actions", None)

    actions = getattr(callback, "actions", None)

    if actions is not None:
        view.action = actions.get(method.lower())

    if not view.action:
        return None

    return view


def cap_first(text: str) -> str:
    """
    Capitalize only the first letter of the string.

    Args:
        text (str): The text to capitalize.

    Returns:
        str: The capitalized text.
    """
    if not text:
        return text
    return text[0].upper() + text[1:]


def remove_empty(obj: dict) -> dict:
    """
    Remove empty values from a dictionary.

    Args:
        obj (dict): The dictionary to remove empty values from.

    Returns:
        dict: The dictionary without empty values.
    """
    return {
        k: remove_empty(v) if isinstance(v, dict) else v for k, v in obj.items() if v is not None and v is not empty
    }


def build_validator_rule(type: str, value: Any, message: str | None = None) -> dict | None:
    """
    Build a `{type, value, message}` rule for a single frontend validation rule.

    `message` is optional and dropped when not provided. Returns None when `value` itself is
    not set, so a message given without a value never produces a dangling rule.

    Args:
        type (str): The kind of constraint the rule enforces (see `ValidatorRuleType`).
        value (Any): The constraint enforced by the rule (e.g. a max length or a regex pattern).
        message (str, optional): Error message shown when the rule is violated. Defaults to None.

    Returns:
        dict: `{"type": type, "value": value, "message": message}` with `message` dropped if
            None, or None if `value` is None.
    """
    if value is None:
        return None
    return remove_empty({"type": type, "value": value, "message": message})


def merge_validator_rules(base: list[dict] | None, override: list[dict] | None) -> list[dict] | None:
    """
    Merge two lists of `{type, value, message}` validator rules.

    Rules in `override` replace rules of the same `type` in `base`; rules in `base` whose `type`
    is not present in `override` are kept as-is. Relative order of `base` is preserved, with any
    `override`-only rules appended at the end.

    Args:
        base (list[dict], optional): The lower-precedence rules (e.g. auto-extracted).
        override (list[dict], optional): The higher-precedence rules (e.g. explicitly configured).

    Returns:
        list[dict]: The merged rules, or whichever side is non-empty, or None if both are empty.
    """
    if not override:
        return base
    if not base:
        return override
    override_by_type = {rule["type"]: rule for rule in override}
    merged = [override_by_type.pop(rule["type"], rule) for rule in base]
    merged.extend(override_by_type.values())
    return merged


def merge_field_schema_dicts(source: dict, destination: dict) -> dict:
    """
    Merge a field descriptor's schema dict over an auto-generated field schema dict.

    Like `merge_dicts`, but treats `options.validators` (a list of validator rules) as a keyed
    collection merged by rule `type` (via `merge_validator_rules`) instead of `source`'s list
    wholesale replacing `destination`'s. This validator-aware behaviour is field-specific, hence
    the name; it is only used when merging a `Field` descriptor onto the generated field schema.

    Args:
        source (dict): The higher-precedence schema dict (e.g. a field descriptor's `to_dict()`).
        destination (dict): The lower-precedence schema dict (e.g. the auto-generated field schema).

    Returns:
        dict: The merged schema dict.
    """
    merged = merge_dicts(source, destination)
    validators = merge_validator_rules(
        (destination.get("options") or {}).get("validators"),
        (source.get("options") or {}).get("validators"),
    )
    if validators:
        merged.setdefault("options", {})["validators"] = validators
    return merged


def remove_empty_schema(obj: list) -> list:
    """
    Remove None values from a list.

    Args:
        obj (list): The list to remove None values from.

    Returns:
        list: The list without None values.
    """
    return list(filter(None, obj))


def merge_dicts(source: dict, destination: dict) -> dict:
    """
    run me with nosetests --with-doctest file.py

    >>> a = { 'first' : { 'all_rows' : { 'pass' : 'dog', 'number' : '1' } } }
    >>> b = { 'first' : { 'all_rows' : { 'fail' : 'cat', 'number' : '5' } } }
    >>> merge(b, a) == { 'first' : { 'all_rows' : { 'pass' : 'dog', 'fail' : 'cat', 'number' : '5' } } }
    True
    """
    result = destination.copy()
    for key, value in source.items():
        if isinstance(value, dict):
            # get node or create one
            node = result.setdefault(key, {})
            result[key] = merge_dicts(value, node)
        else:
            result[key] = value

    return result


# A placeholder is a root name followed by any number of ``.attribute`` / ``[key]`` hops. No
# segment may start with an underscore: ``str.format`` reaches globals only through dunder
# attributes (``{obj.__class__.__init__.__globals__[SECRET_KEY]}``), so refusing them closes that
# path. Underscores *inside* a name stay legal (``target_obj``, ``obj.first_name``). Index keys are
# looked up with ``__getitem__`` and never resolve an attribute, so they are left unrestricted.
_PLACEHOLDER_RE = re.compile(
    r"""
    [A-Za-z][A-Za-z0-9_]*                       # root name
    (?:
        \.[A-Za-z][A-Za-z0-9_]*                 # .attribute hop
        | \[[^\[\]{}]*\]                        # [key] hop
    )*
    """,
    re.VERBOSE,
)


def validate_lazy_fstring(template: str) -> None:
    """
    Raise ``ValueError`` unless every placeholder in ``template`` is a plain value reference.

    Placeholders are static, so a template is checked once - when it is built - and rendering is
    then a plain ``str.format_map``. Anything ``str.format`` would resolve beyond a name and its
    attribute/index hops (positional or automatic numbering, private or dunder attributes) is
    rejected; expressions and calls are not part of the grammar at all and fail the same check.
    """
    for _, field_name, format_spec, _ in Formatter().parse(template):
        if field_name is None:
            continue
        if not _PLACEHOLDER_RE.fullmatch(field_name):
            raise ValueError(
                f"Unsupported placeholder {{{field_name}}} in lazy f-string {template!r}. Only a "
                "name with optional .attribute / [key] access is allowed - no expressions, no "
                "calls and no leading underscores."
            )
        # A format spec may itself contain placeholders (``{value:>{width}}``) - hold them to the
        # same grammar.
        if format_spec:
            validate_lazy_fstring(format_spec)


class LazyFString(str):
    """
    Lazy string template rendered later against a mapping of context values.

    The template is validated on construction (see ``validate_lazy_fstring``) and rendered with
    ``str.format_map``, so it can substitute values but never execute code.
    """

    def __new__(cls, template, *args, **kwargs):
        instance = super().__new__(cls, template, *args, **kwargs)
        validate_lazy_fstring(instance)
        return instance

    def __repr__(self):
        return f"F({self})"

    def format(self, **kwargs):
        # A placeholder that cannot be resolved raises (KeyError for an unknown name, AttributeError
        # for a missing attribute) rather than rendering as empty - a template referencing something
        # the context does not carry is a misconfiguration, not a blank.
        return str.format_map(self, kwargs)


f = LazyFString

LOOKUP_SEP = "__"


def walk_to_leaf_field(model: type[Model], path: str) -> DjangoField | None:
    """
    Walk a Django ORM field path (e.g. ``"author__name"``) starting from ``model`` and return
    the final ``Field`` instance, or ``None`` when any hop cannot be resolved (missing field or
    a non-relation intermediate hop).

    Intermediate hops must be relations - for each part except the last the field must have
    ``is_relation`` and a non-``None`` ``related_model``. The last part may be any field type.
    """
    from django.core.exceptions import FieldDoesNotExist

    current_model = model
    field = None
    parts = path.split(LOOKUP_SEP)
    for i, part in enumerate(parts):
        try:
            field = current_model._meta.get_field(part)
        except FieldDoesNotExist:
            return None
        if i < len(parts) - 1:
            if not (field.is_relation and field.related_model is not None):
                return None
            current_model = field.related_model
    return field


@dataclass
class Source:
    reference: str
    id: str | None

    @property
    def service_reference(self):
        return self.reference.split("/")[-1]

    @property
    def object(self):
        from habarico.site import site

        admin = site.get_admin(self.service_reference)
        if not admin:
            return None
        model = admin.model
        try:
            if self.id:
                return model.objects.get(pk=self.id)
        except model.DoesNotExist:
            return None
        return None


def get_request_source(request: Request | None) -> Source | None:
    if request and "_source" in request.GET:
        try:
            parsed_source = json.loads(request.GET.get("_source"))
            if isinstance(parsed_source, dict) and len(parsed_source) == 1:
                source_data = list(parsed_source.items())[0]
                return Source(
                    reference=source_data[0],
                    id=source_data[1],
                )
        except json.JSONDecodeError:
            return None
    return None


@dataclass
class Target:
    field_name: str
    id: str

    @property
    def service_reference(self):
        return self.reference.split("/")[-1]


def get_request_target(request: Request | None) -> Target | None:
    if request and "_target" in request.GET:
        try:
            parsed_target = json.loads(request.GET.get("_target"))
            if isinstance(parsed_target, dict) and len(parsed_target) == 1:
                target_data = list(parsed_target.items())[0]
                return Target(
                    field_name=target_data[0],
                    id=target_data[1],
                )
        except json.JSONDecodeError:
            return None
    return None


def get_model_name(model: Model | type[Model]) -> str:
    """
    Get the model name in lowercase.

    Args:
        model (Model): The model to get the name for.

    Returns:
        str: The model name in lowercase.
    """
    if not inspect.isclass(model):
        model = model.__class__

    return model.__name__.lower()


def get_and_bind_drf_field(
    field_cls: type[Field], field_name: str, parent: Field | None = None, child_kwargs: dict | None = None
) -> Field:
    """
    Get and bind a DRF field to the parent.

    Args:
        field_cls (type[Field]): The DRF field class.
        field_name (str): The name of the field.
        parent (Field|None): The parent field.

    Returns:
        Field: The bound DRF field.
    """
    field = field_cls(**child_kwargs if child_kwargs else {})
    field.bind(field_name, parent)
    return field
