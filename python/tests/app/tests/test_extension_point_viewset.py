"""
Tests for extension point 2 (HAB-811): swappable default viewset base class.

Unlike the ModelAdmin/AdminSite singletons, ``DEFAULT_VIEWSET_CLASS`` is read fresh
on every ``model_viewset_factory()`` call (viewsets are built per admin registration),
so a settings override is picked up without needing to re-import anything.
"""

from habarico import site
from habarico.views import AdminModelViewSet, model_viewset_factory
from rest_framework.decorators import action
from rest_framework.response import Response


class _DemoExtraActionViewSet(AdminModelViewSet):
    @action(detail=False, methods=["get"], url_path="demo-extension-point")
    def demo_extension_point(self, request, *args, **kwargs):
        return Response({"ok": True})


class TestDefaultViewsetWiring:
    def test_default_base_viewset_is_core_class(self, db):
        admin = site.get_admin("category")

        viewset_class = model_viewset_factory(admin.model, admin, None, None)

        assert issubclass(viewset_class, AdminModelViewSet)
        assert not hasattr(viewset_class, "demo_extension_point")

    def test_overridden_default_viewset_is_used(self, db, settings):
        settings.ADMIN_REST_FRAMEWORK = {
            "DEFAULT_VIEWSET_CLASS": "app.tests.test_extension_point_viewset._DemoExtraActionViewSet"
        }
        admin = site.get_admin("category")

        viewset_class = model_viewset_factory(admin.model, admin, None, None)

        assert issubclass(viewset_class, _DemoExtraActionViewSet)
        assert hasattr(viewset_class, "demo_extension_point")


class TestExtraMetaExtensionPoint:
    """
    ``AdminModelViewSet.get_extra_meta()`` is how a pro/enterprise viewset mixin adds optional
    keys to a serialized object's ``meta`` block (e.g. ``highlights``). Core contributes nothing,
    so ``meta`` holds only the keys ``AdminModelSerializer.get_meta()`` builds itself.
    """

    def _rows(self, response):
        payload = response.json()
        return payload["objects"] if isinstance(payload, dict) else payload

    def test_core_contributes_nothing(self, db):
        admin = site.get_admin("category")

        assert AdminModelViewSet.get_extra_meta(admin.viewset(), object()) == {}

    def test_core_list_meta_has_no_extra_keys(self, api_client, article):
        response = api_client.get("/admin/article/")

        assert response.status_code == 200
        assert set(self._rows(response)[0]["meta"]) == {"repr", "schema", "tags", "trigger_action"}

    def test_contributed_keys_land_in_meta(self, api_client, article, monkeypatch):
        monkeypatch.setattr(AdminModelViewSet, "get_extra_meta", lambda self, obj: {"demo": obj.pk})

        response = api_client.get("/admin/article/")

        assert response.status_code == 200
        row = self._rows(response)[0]
        assert row["meta"]["demo"] == article.pk
