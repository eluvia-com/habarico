"""
Tests for the address an action carries when it calls a viewset action of its own resource.

An action that names no resource acts on the resource the schema is generated for. The action name
lives inside the address, and an address is either omitted or complete, so one that carries an
action name names the resource; one without stays omitted.
"""

from habarico.site import site


def detail_schema(api_client, article):
    response = api_client.get(f"/admin/own_action_article/{article.pk}/schema/")
    assert response.status_code == 200
    return response.json()


def named(items, name):
    return next(item for item in items if item["name"] == name)


class TestViewLinkActionReference:

    def test_a_link_to_an_action_view_names_its_own_resource(self, db, api_client, article):
        publish = named(detail_schema(api_client, article)["actions"], "publish")

        assert publish["view"]["reference"] == {"resource": "own_action_article", "action_name": "publish"}

    def test_the_link_addresses_what_the_view_calls(self, db, api_client, article):
        admin = site.get_admin("own_action_article")
        view = next(generator for generator in admin.view_schema_generators if generator.get_name() == "publish")

        link = named(detail_schema(api_client, article)["actions"], "publish")["view"]["reference"]

        assert link == view.bind(admin=admin).get_endpoint_parameters().to_dict()["reference"]

    def test_a_link_to_a_plain_view_leaves_the_address_out(self, db, api_client, article):
        preview = named(detail_schema(api_client, article)["actions"], "preview")

        assert "reference" not in preview["view"]


class TestResourceActionReference:

    def test_an_action_of_its_own_viewset_names_its_own_resource(self, db, api_client, article):
        publish_now = named(detail_schema(api_client, article)["actions"], "publish-now")

        endpoint = publish_now["resource"]["endpoint"]
        assert endpoint["reference"] == {"resource": "own_action_article", "action_name": "publish"}
        assert endpoint["path"].endswith(f"/own_action_article/{article.pk}/publish/")
