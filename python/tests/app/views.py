"""
Project views deliberately mounted outside the habarico namespace - see ``tests/urls.py``.

A project is free to expose its own DRF viewsets next to the admin. ``_reverse_field`` used to be
able to resolve and clone any of them, because ``clone_view`` resolved whatever path the client
sent. HAB-905 restricts resolution to the habarico application namespace, and these views are what
that restriction is tested against.
"""

from app.models import Article
from rest_framework import serializers, viewsets


class OutsideArticleSerializer(serializers.ModelSerializer):
    """Exposes ``author`` as a relation, so the serializer field has a ``get_queryset()`` and the
    reverse-lookup filter would happily consume it if it ever got this far."""

    class Meta:
        model = Article
        fields = ["id", "title", "author"]


class OutsideArticleViewSet(viewsets.ModelViewSet):
    """An ordinary project viewset that has nothing to do with the admin."""

    queryset = Article.objects.all()
    serializer_class = OutsideArticleSerializer
