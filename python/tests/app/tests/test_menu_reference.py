"""
Tests for the address a menu item carries.

A record lives inside the address, and an address is either omitted or complete, so a menu item
opening one record names the admin it is on; an item opening a view of the collection stays omitted.
"""

from habarico import site
from habarico.schema.generators import MenuSchemaGenerator


def menu_of(generator, request):
    return generator.bind(admin=site.get_admin("article")).to_dict(request=request)


class TestMenuReference:

    def test_an_item_opening_a_record_names_its_own_resource(self, db, mock_request, article):
        menu = menu_of(MenuSchemaGenerator(view_name="show", record_pk=article.pk), mock_request)

        assert menu["view"]["reference"] == {"resource": "article", "record_pk": article.pk}

    def test_an_item_opening_a_collection_view_leaves_the_address_out(self, db, mock_request):
        menu = menu_of(MenuSchemaGenerator(), mock_request)

        assert "reference" not in menu["view"]
