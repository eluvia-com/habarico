from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Any, Optional, Tuple

from django.urls import Resolver404, get_resolver, get_urlconf


@dataclass(frozen=True)
class Resolved:
    func: Any
    args: Tuple[Any, ...]
    kwargs: dict
    #: Application namespaces the matched URL belongs to, outermost first. Carried over from
    #: ``ResolverMatch.app_names`` so callers can tell whose URL they resolved. The *application*
    #: namespace is used rather than the instance one because a project may mount the admin under
    #: a namespace of its choosing (``include(site.urls, namespace="custom")``) while the
    #: application namespace stays whatever ``AdminSite.urls`` declares.
    app_names: Tuple[str, ...]


@lru_cache(maxsize=4096)
def _resolve_cached(urlconf: Optional[str], path: str) -> Resolved:
    """
    Low-level cached resolver.
    Cache key includes urlconf (important if you use set_urlconf / request.urlconf).
    """
    match = get_resolver(urlconf).resolve(path)
    return Resolved(func=match.func, args=match.args, kwargs=match.kwargs, app_names=tuple(match.app_names))


def fast_resolve(path: str, *, urlconf: Optional[str] = None) -> Optional[Resolved]:
    """
    Fast resolve with LRU cache.
    Returns None if no match.
    """
    if urlconf is None:
        urlconf = get_urlconf()  # respects thread-local / request.urlconf if set

    try:
        return _resolve_cached(urlconf, path)
    except Resolver404:
        return None


def clear_fast_resolve_cache() -> None:
    """
    Call this after URLConf changes (e.g. in tests) if needed.
    """
    _resolve_cached.cache_clear()
