"""
Tests for the default actions a view publishes in its action slots.

A slot the admin author left alone carries a ``default_actions`` entry, which the client expands into
the resource's own actions; an empty slot renders nothing. The defaults are therefore in the schema,
readable, rather than reconstructed by the client.

A view's own slot names no resource — an absent address means the one the schema was generated for.
A box's slot does name one, because a box points elsewhere.

Two slots carry none: a list view's ``list_actions`` and a detail view's ``bottom_actions``. Those
hold the table's utility controls and the form's save/cancel, neither of which is an action of the
resource.
"""


def collection_schema(api_client, resource="article"):
    return api_client.get(f"/admin/{resource}/schema/").json()


def detail_schema(api_client, article):
    return api_client.get(f"/admin/article/{article.pk}/schema/").json()


def view(schema, name):
    return next(v for v in schema["views"] if v["name"] == name)


class TestListViewSlots:

    def test_row_actions_default_to_the_records_own(self, db, api_client):
        """Row buttons act on one record, whose id the row supplies — hence ``detail`` scope."""
        slot = view(collection_schema(api_client), "list")["list"]["row_actions"]

        assert slot == [{"type": "default_actions", "scope": "detail"}]

    def test_the_toolbar_defaults_to_everything_supported(self, db, api_client):
        slot = view(collection_schema(api_client), "list")["list"]["toolbar_actions"]

        assert slot == [{"type": "default_actions"}]

    def test_list_actions_stay_empty(self, db, api_client):
        """The client never inferred these, so there is nothing to put in the schema."""
        assert "list_actions" not in view(collection_schema(api_client), "list")["list"]

    def test_the_slot_names_no_resource(self, db, api_client):
        """
        A view's own slot does not name its resource: an absent address means the resource the schema
        was generated for, which is this one.
        """
        slot = view(collection_schema(api_client), "list")["list"]["row_actions"]

        assert "reference" not in slot[0]


class TestDetailViewSlots:

    def test_the_toolbar_defaults_to_everything_supported(self, db, api_client, article):
        slot = view(detail_schema(api_client, article), "edit")["detail"]["toolbar_actions"]

        assert slot == [{"type": "default_actions"}]

    def test_bottom_actions_get_no_marker(self, db, api_client, article):
        """
        The form's own controls are declared outright — ``save`` is a real action, not a default the
        client had to infer — so the slot holds ``action`` entries and needs no group.
        """
        slot = view(detail_schema(api_client, article), "edit")["detail"]["bottom_actions"]

        assert [entry["type"] for entry in slot] == ["action"]
        assert slot[0]["name"] == "save"

    def test_the_slot_names_no_resource(self, db, api_client, article):
        """Same on a detail view: the slot belongs to the resource the schema is for."""
        slot = view(detail_schema(api_client, article), "edit")["detail"]["toolbar_actions"]

        assert "reference" not in slot[0]


class TestDeclaredSlotsWin:

    def test_a_declared_slot_is_left_as_declared(self, db):
        """The default is a default: an author who named the actions gets exactly those."""
        from habarico.schema.actions import generate_actions_descriptor
        from habarico.schema.generators import ListViewSchemaGenerator

        slot = generate_actions_descriptor(ListViewSchemaGenerator(row_actions=["edit"]).get_row_actions())

        assert [descriptor.to_dict() for descriptor in slot] == [{"type": "action", "name": "edit"}]

    def test_an_explicitly_empty_slot_stays_empty(self, db):
        """``[]`` is a decision, not an omission, and survives as one."""
        from habarico.schema.generators import ListViewSchemaGenerator

        assert ListViewSchemaGenerator(row_actions=[]).get_row_actions() == []


class TestTurningADefaultOff:
    """
    ``None`` is the switch. Only a slot nothing was said about carries the default, which is why the
    unset state is a sentinel of its own rather than ``None`` — otherwise the one value an author
    would reach for to mean "no buttons" would be the one that produces them.
    """

    def test_none_turns_the_row_default_off(self, db):
        from habarico.schema.generators import ListViewSchemaGenerator

        assert ListViewSchemaGenerator(row_actions=None).get_row_actions() is None

    def test_none_turns_the_toolbar_default_off(self, db):
        from habarico.schema.generators import ListViewSchemaGenerator

        assert ListViewSchemaGenerator(toolbar_actions=None).get_toolbar_actions() is None

    def test_none_turns_a_detail_views_toolbar_off(self, db):
        from habarico.schema.generators import EditViewSchemaGenerator

        assert EditViewSchemaGenerator(toolbar_actions=None).get_toolbar_actions() is None

    def test_a_view_class_can_turn_it_off_for_good(self, db):
        """The class attribute is the same switch, which is how a view type opts out of the default."""
        from habarico.schema.generators import ListViewSchemaGenerator

        class QuietListView(ListViewSchemaGenerator):
            row_actions = None

        assert QuietListView().get_row_actions() is None

    def test_a_turned_off_slot_leaves_no_key_in_the_schema(self, db, api_client):
        """Both backends strip nulls, so the slot reaches the client absent rather than as null."""
        slot = view(collection_schema(api_client), "list")["list"]

        assert "list_actions" not in slot
