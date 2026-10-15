"""Integration tests for the /admin/{resource}/export endpoint."""

import io

import pytest
from app.admin import ExportArticleAdmin
from app.models import Article
from habarico.export.views import EXPORT_ROW_LIMIT, ExportAdminModelViewSet, build_fieldset_string
from rest_framework import status

CSV_CONTENT_TYPE = "text/csv; charset=utf-8"
XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

# UTF-8 byte order mark the CSV renderer writes so spreadsheet applications detect the encoding.
BOM = "\ufeff"


@pytest.fixture
def articles(db, author, category):
    """Three articles - one draft and two published, with an ascending view count."""
    return [
        Article.objects.create(
            title=f"T{i}",
            slug=f"t{i}",
            content="c",
            summary="s",
            status=Article.Status.DRAFT if i == 0 else Article.Status.PUBLISHED,
            author=author,
            category=category,
            view_count=i,
            rating=4.0,
            priority=1.0,
        )
        for i in range(3)
    ]


def read_csv(response) -> list[list[str]]:
    """Decode a CSV export response into rows of cells."""
    text = response.content.decode("utf-8")
    assert text.startswith(BOM), "The CSV export has to start with the UTF-8 byte order mark."
    return [line.split(",") for line in text[len(BOM) :].strip().split("\r\n")]


def read_xlsx(response) -> list[list]:
    """Decode an XLSX export response into rows of cell values."""
    from openpyxl import load_workbook

    workbook = load_workbook(io.BytesIO(response.content))
    return [list(row) for row in workbook.active.values]


class TestExportEndpoint:
    """The export endpoint serves the list data as a document."""

    def test_returns_csv_document(self, api_client, articles):
        response = api_client.get("/admin/export_article/export/?format=csv")
        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == CSV_CONTENT_TYPE
        assert read_csv(response)[0] == ["Title", "Status", "View count", "Author"]

    def test_offers_the_document_as_a_download(self, api_client, articles):
        response = api_client.get("/admin/export_article/export/?format=csv")
        assert response["Content-Disposition"] == 'attachment; filename="export_article.csv"'

    def test_falls_back_to_the_first_offered_format(self, api_client, articles):
        response = api_client.get("/admin/export_article/export/")
        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == CSV_CONTENT_TYPE

    def test_returns_xlsx_document(self, api_client, articles):
        response = api_client.get("/admin/export_article/export/?format=xlsx")
        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == XLSX_CONTENT_TYPE
        assert response["Content-Disposition"] == 'attachment; filename="export_article.xlsx"'

        rows = read_xlsx(response)
        assert rows[0] == ["Title", "Status", "View count", "Author"]
        # The XLSX renderer keeps numbers native instead of stringifying them.
        assert rows[1][2] == 2

    def test_exports_every_row_of_the_queryset(self, api_client, articles):
        response = api_client.get("/admin/export_article/export/?format=csv")
        assert len(read_csv(response)) == len(articles) + 1

    def test_empty_queryset_exports_the_header_only(self, api_client, db):
        response = api_client.get("/admin/export_article/export/?format=csv")
        assert response.status_code == status.HTTP_200_OK
        assert read_csv(response) == [["Title", "Status", "View count", "Author"]]


class TestExportAvailability:
    """Only resources that opt in and are readable expose an export."""

    def test_resource_without_opt_in_returns_404(self, api_client, articles):
        response = api_client.get("/admin/disabled_export_article/export/?format=csv")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_resource_the_user_may_not_read_is_not_exported(self, api_client, articles, monkeypatch):
        monkeypatch.setattr(ExportArticleAdmin, "can_read", False)
        response = api_client.get("/admin/export_article/export/?format=csv")
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

    def test_resource_without_formats_offers_every_registered_format(self, api_client, articles):
        # default_export_article declares no export_formats, so it offers what the project registers.
        response = api_client.get("/admin/default_export_article/export/?format=xlsx")
        assert response.status_code == status.HTTP_200_OK

    def test_format_the_resource_does_not_offer_returns_404(self, api_client, articles, settings):
        settings.ADMIN_REST_FRAMEWORK = {
            **settings.ADMIN_REST_FRAMEWORK,
            "EXPORT_RENDERER_CLASSES": ["habarico.export.renderers.CsvRenderer"],
        }
        response = api_client.get("/admin/default_export_article/export/?format=xlsx")
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestExportColumns:
    """The exported columns come from the admin, narrowed down by the request."""

    def test_columns_follow_the_admin_export_fields(self, api_client, articles):
        response = api_client.get("/admin/export_article/export/?format=csv")
        # content is a serializer field but not an export field, so it must not be exported.
        assert read_csv(response)[0] == ["Title", "Status", "View count", "Author"]

    def test_headers_use_the_verbose_names_of_the_model(self, api_client, articles):
        response = api_client.get("/admin/export_article/export/?format=csv&fields=view_count")
        assert read_csv(response)[0] == ["View count"]

    def test_fields_query_param_selects_the_columns(self, api_client, articles):
        response = api_client.get("/admin/export_article/export/?format=csv&fields=title,view_count")
        rows = read_csv(response)
        assert rows[0] == ["Title", "View count"]
        assert rows[1] == ["T2", "2"]

    def test_fields_query_param_keeps_the_requested_order(self, api_client, articles):
        response = api_client.get("/admin/export_article/export/?format=csv&fields=view_count,title")
        assert read_csv(response)[0] == ["View count", "Title"]

    def test_field_outside_the_whitelist_is_rejected(self, api_client, articles):
        response = api_client.get("/admin/export_article/export/?format=csv&fields=title,content")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        error = response.json()["errors"][0]
        assert error["source"] == "fields"
        assert "content" in error["message"]

    def test_admin_without_export_fields_exports_its_serializer_fields(self, api_client, articles):
        response = api_client.get("/admin/default_export_article/export/?format=csv")
        assert read_csv(response)[0] == ["Title", "Status"]

    def test_relation_is_exported_as_its_primary_key(self, api_client, articles, author):
        response = api_client.get("/admin/export_article/export/?format=csv&fields=author")
        assert read_csv(response)[1] == [str(author.pk)]

    def test_meta_block_is_not_exported(self, api_client, articles):
        response = api_client.get("/admin/export_article/export/?format=csv")
        assert "meta" not in response.content.decode("utf-8")


class TestExportQueryset:
    """The export sees the same rows as the list view."""

    def test_ids_limit_the_export_to_the_selected_rows(self, api_client, articles):
        selected = [articles[0], articles[2]]
        ids = ",".join(str(article.pk) for article in selected)
        response = api_client.get(f"/admin/export_article/export/?format=csv&fields=title&ids={ids}")

        exported = [row[0] for row in read_csv(response)[1:]]
        assert sorted(exported) == sorted(article.title for article in selected)

    def test_invalid_ids_are_rejected(self, api_client, articles):
        response = api_client.get("/admin/export_article/export/?format=csv&ids=not-a-pk")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert response.json()["errors"][0]["source"] == "ids"

    def test_filters_apply_the_same_way_as_in_the_list_view(self, api_client, articles):
        response = api_client.get('/admin/export_article/export/?format=csv&fields=title&filter=status="published"')
        exported = [row[0] for row in read_csv(response)[1:]]
        assert sorted(exported) == ["T1", "T2"]

    def test_ordering_applies(self, api_client, articles):
        response = api_client.get("/admin/export_article/export/?format=csv&fields=title&order_by=view_count:asc")
        assert [row[0] for row in read_csv(response)[1:]] == ["T0", "T1", "T2"]


class TestExportRowLimit:
    """Exports too big to build synchronously are refused."""

    def test_lowered_row_limit_refuses_a_bigger_export(self, api_client, articles):
        # The viewset of limited_export_article lowers the row limit to a single row.
        response = api_client.get("/admin/limited_export_article/export/?format=csv")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert "3" in response.json()["errors"][0]["message"]

    def test_error_is_returned_as_json(self, api_client, articles):
        response = api_client.get("/admin/limited_export_article/export/?format=csv")
        assert response["Content-Type"] == "application/json"
        assert "Content-Disposition" not in response

    def test_export_within_the_threshold_is_served(self, api_client, db, author):
        Article.objects.create(
            title="Only one",
            slug="only-one",
            content="c",
            status=Article.Status.DRAFT,
            author=author,
            view_count=1,
            priority=1.0,
        )
        response = api_client.get("/admin/limited_export_article/export/?format=csv")
        assert response.status_code == status.HTTP_200_OK

    def test_row_limit_is_a_constant_of_the_library(self):
        """The free library fixes the limit - a bigger export is what the paid asynchronous one is for."""
        assert ExportAdminModelViewSet().get_export_row_limit() == EXPORT_ROW_LIMIT


class TestBuildFieldsetString:
    """Export column names translate into the fieldset the admin serializer understands."""

    def test_flat_names(self):
        assert build_fieldset_string(["code", "name"]) == "code,name"

    def test_nested_names_are_grouped(self):
        assert build_fieldset_string(["author__name", "author__email"]) == "author(name,email)"

    def test_flat_and_nested_names_are_mixed(self):
        assert build_fieldset_string(["code", "author__name"]) == "code,author(name)"

    def test_deeply_nested_names(self):
        assert build_fieldset_string(["author__address__city"]) == "author(address(city))"

    def test_no_names(self):
        assert build_fieldset_string([]) == ""
