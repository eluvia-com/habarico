"""
Tests for the schema source the root generator stamps on the context.

``CURRENT`` on a descriptor resolves against this stamp, not against ``context.resource``: a nested
generator overwrites that, so a descriptor inside a list box would otherwise resolve to the box's
reference instead of the page it was authored in. The stamp is the contract between
``LocalResourceSchemaGenerator`` and ``ResourceReference``, which is why it is asserted directly.
"""

from habarico import site
from habarico.schema.generators import LocalResourceSchemaGenerator


def stamp(obj=None, **kwargs):
    """The address the generator stamps for the article resource."""
    admin = site.get_admin("article")
    generator = LocalResourceSchemaGenerator(admin.viewset())
    generator.setup(obj=obj, **kwargs)
    return generator.context.schema_source


def stamped(obj=None, **kwargs):
    """The address the generator stamps, as it would reach the client."""
    return stamp(obj=obj, **kwargs).to_dict()


def request_with(request_factory, query):
    """A DRF request carrying a query string, which is where the stamp reads its params from."""
    from rest_framework.request import Request

    wsgi_request = request_factory.get("/admin/article/schema/", query)
    wsgi_request.user = None
    return Request(wsgi_request)


class TestSchemaSourceStamp:

    def test_detail_schema_stamps_the_resource_and_the_record(self, db, mock_request, article):
        assert stamped(obj=article, request=mock_request) == {"resource": "article", "record_pk": article.pk}

    def test_collection_schema_stamps_no_record(self, db, mock_request):
        """``schema_list`` generates without an object, so there is no record to narrow to."""
        assert stamped(request=mock_request) == {"resource": "article"}

    def test_the_service_is_left_out(self, db, mock_request, article):
        """A backend cannot name its own service, so a local address omits it."""
        assert "service" not in stamped(obj=article, request=mock_request)

    def test_a_nested_context_still_sees_the_stamp(self, db, mock_request, article):
        """
        What a descriptor inside a list box resolves against: the child context overwrites the
        resource, and the stamp has to survive that.
        """
        admin = site.get_admin("article")
        generator = LocalResourceSchemaGenerator(admin.viewset())
        generator.setup(obj=article, request=mock_request)

        nested = generator.context.update(get_resource_callback=lambda: "order_item")

        assert nested.schema_source.to_dict()["resource"] == "article"


class TestStampedAction:
    """
    An action route is where that action is, so the stamp names it — which is what lets a descriptor
    inside such a schema point at ``CURRENT`` and still mean the action it was rendered in.
    """

    def test_a_plain_route_names_no_action(self, db, mock_request):
        assert "action_name" not in stamped(request=mock_request, action_url_name="list")

    def test_an_action_route_names_its_segment(self, db, mock_request, article):
        source = stamped(obj=article, request=mock_request, action_url_name="publish-detail")

        assert source["action_name"] == "publish"

    def test_a_dashed_action_keeps_its_dashes(self, db, mock_request):
        """``AdminRouter`` only appends the surface, so the action may carry dashes of its own."""
        source = stamped(request=mock_request, action_url_name="send-invoice-list")

        assert source["action_name"] == "send-invoice"


class TestStampedParams:
    """
    The stamp carries the parameters that travel with a request — the link to the record the schema
    was asked for — because an action addressed as ``CURRENT`` runs in the same context.
    """

    def test_the_parent_link_is_carried(self, db, request_factory):
        request = request_with(request_factory, {"_source": '{"article": 7}', "_target": '{"article": 7}'})

        assert stamped(request=request)["params"] == {
            "_source": '{"article": 7}',
            "_target": '{"article": 7}',
        }

    def test_the_rest_of_the_query_is_not_an_address(self, db, request_factory):
        """Paging, filters and ordering describe one list response, not where a resource is."""
        request = request_with(request_factory, {"page": "2", "order_by": "name", "_target": '{"article": 7}'})

        assert stamped(request=request)["params"] == {"_target": '{"article": 7}'}

    def test_a_query_of_its_own_is_no_query(self, db, mock_request):
        assert "params" not in stamped(request=mock_request)
