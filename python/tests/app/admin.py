"""
Test admin definitions for habarico library testing.
"""

from app.models import Article, Author, Category, Product, Tag
from habarico import ModelAdmin
from habarico.export.views import ExportAdminModelViewSet
from habarico.schema.actions import Action, ExportActionDescriptor
from habarico.schema.generators import ListViewSchemaGenerator, ShowViewSchemaGenerator
from habarico.schema.types import ViewModeType
from habarico.views import AdminModelViewSet
from rest_framework.permissions import BasePermission, IsAuthenticated


class CategoryAdmin(ModelAdmin):
    """Admin for Category model."""

    model = Category
    search_fields = ["name", "description"]
    filter_fields = ["name", "created_at"]
    fields = ["name", "description", "created_at"]
    read_only_fields = ["created_at"]
    ordering_fields = ["name", "created_at"]
    can_create = True
    can_read = True
    can_update = True
    can_delete = True


class TagAdmin(ModelAdmin):
    """Admin for Tag model."""

    model = Tag
    search_fields = ["name"]
    filter_fields = ["name"]
    fields = ["name"]
    can_create = True
    can_read = True
    can_update = True
    can_delete = True


class AuthorAdmin(ModelAdmin):
    """Admin for Author model."""

    model = Author
    search_fields = ["name", "email"]
    filter_fields = ["name", "email", "is_active"]
    fields = ["name", "email", "bio", "is_active"]
    ordering_fields = ["name", "email"]
    can_create = True
    can_read = True
    can_update = True
    can_delete = True


class ArticleAdmin(ModelAdmin):
    """Admin for Article model with comprehensive configuration."""

    model = Article
    search_fields = ["title", "content", "summary"]
    filter_fields = ["title", "status", "author", "category", "view_count", "rating", "created_at", "published_at"]
    fields = [
        "title",
        "slug",
        "content",
        "summary",
        "status",
        "author",
        "category",
        "tags",
        "view_count",
        "rating",
        "priority",
        "created_at",
        "updated_at",
        "published_at",
    ]
    read_only_fields = ["created_at", "updated_at"]
    ordering_fields = ["title", "created_at", "view_count", "rating"]
    can_create = True
    can_read = True
    can_update = True
    can_delete = True


class ProductAdmin(ModelAdmin):
    """Admin for Product model with UUID primary key."""

    model = Product
    search_fields = ["name"]
    filter_fields = ["name", "price", "stock", "is_available"]
    fields = ["id", "name", "price", "stock", "is_available"]
    read_only_fields = ["id"]
    ordering_fields = ["name", "price", "stock"]
    can_create = True
    can_read = True
    can_update = True
    can_delete = True


class ReadOnlyArticleAdmin(ModelAdmin):
    """Admin with read-only permissions for testing."""

    model = Article
    name = "readonly_article"
    search_fields = ["title"]
    fields = ["title", "content", "status"]
    can_create = False
    can_read = True
    can_update = False
    can_delete = False


class NoReadArticleAdmin(ModelAdmin):
    """Admin the user may not read at all - the target of the HAB-905 reverse-filter tests.

    ``ReadOnlyArticleAdmin`` is read-only in the sense of "no writes"; this one denies reads too,
    which is the case a reverse-lookup filter must not be able to peek around.
    """

    model = Article
    name = "noread_article"
    fields = ["title", "author"]
    can_read = False


class AuthenticatedArticleAdmin(ModelAdmin):
    """Admin behind an authentication requirement.

    Used to prove that a view cloned by ``clone_view`` still carries the authenticated user, which
    is what the permission check added in HAB-905 depends on.
    """

    model = Article
    name = "authenticated_article"
    fields = ["title", "author"]
    can_read = True
    permission_classes = IsAuthenticated


class NoSearchArticleAdmin(ModelAdmin):
    """A third, distinct admin for the Article model (multiple-admins-per-model tests)."""

    model = Article
    name = "nosearch_article"
    search_fields = ["title"]
    fields = ["title", "content"]


class SidePanelArticleAdmin(ModelAdmin):
    """Admin enabling row single-click preview (show view) in a sidepanel."""

    model = Article
    name = "sidepanel_article"
    fields = ["title", "content", "status"]
    can_read = True

    @property
    def view_schema_generators(self):
        return [
            ShowViewSchemaGenerator(view_mode=ViewModeType.SIDEPANEL),
            ListViewSchemaGenerator(single_click_action=Action(name="show", view_mode=ViewModeType.SIDEPANEL)),
        ]


class NoShowSidePanelArticleAdmin(ModelAdmin):
    """Admin requesting single-click preview but exposing no show view (list only)."""

    model = Article
    name = "noshow_article"
    fields = ["title", "content", "status"]
    can_read = True

    @property
    def view_schema_generators(self):
        return [
            ListViewSchemaGenerator(single_click_action=Action(name="show", view_mode=ViewModeType.SIDEPANEL)),
        ]


class ExportArticleAdmin(ModelAdmin):
    """Admin exposing an export action in the list_actions slot of the list view (HAB-529)."""

    model = Article
    name = "export_article"
    fields = ["title", "content", "status", "author", "view_count"]
    filter_fields = ["status"]
    ordering_fields = ["title", "view_count"]
    can_read = True
    export_enabled = True
    export_fields = ["title", "status", "view_count", "author"]
    export_formats = ["csv", "xlsx"]

    @property
    def view_schema_generators(self):
        return [
            ListViewSchemaGenerator(
                list_actions=[ExportActionDescriptor(format="csv", fields=["title", "status"])],
            ),
        ]


class DisabledExportArticleAdmin(ModelAdmin):
    """Admin opting out of the export - neither the action nor the endpoint shows up."""

    model = Article
    name = "disabled_export_article"
    fields = ["title", "status"]
    can_read = True
    export_enabled = False
    export_fields = ["title", "status"]


class UnconfiguredExportArticleAdmin(ModelAdmin):
    """Admin not declaring ``export_enabled`` - the export is off by default."""

    model = Article
    name = "unconfigured_export_article"
    fields = ["title", "status"]
    can_read = True
    export_fields = ["title", "status"]


class RowLimitedExportViewSet(ExportAdminModelViewSet):
    """Viewset lowering the synchronous row limit - the hook the asynchronous export overrides."""

    def get_export_row_limit(self) -> int:
        return 1


class LimitedExportArticleAdmin(ModelAdmin):
    """Admin whose viewset lowers the row limit, exercising the refusal branch."""

    model = Article
    name = "limited_export_article"
    fields = ["title", "status"]
    can_read = True
    base_viewset = RowLimitedExportViewSet
    export_enabled = True


class DefaultFormatExportArticleAdmin(ModelAdmin):
    """Admin keeping the default export configuration - every registered format, all fields."""

    model = Article
    name = "default_export_article"
    fields = ["title", "status"]
    can_read = True
    export_enabled = True


class PublishedOnlyAdminModelViewSet(AdminModelViewSet):
    """Viewset of an application narrowing the resource down - the export must not drop it."""

    def get_queryset(self):
        return super().get_queryset().filter(status=Article.Status.PUBLISHED)


class ColumnCountListViewSchemaGenerator(ListViewSchemaGenerator):
    """List view generator of an application - the export must keep its behaviour."""

    def get_boxes(self):
        return list(super().get_boxes() or []) + ["view_count"]


class ConfiguredExportArticleAdmin(ModelAdmin):
    """Admin exporting with nothing but its export configuration (HAB-535).

    ``export_formats`` intentionally does not start with CSV - the action must advertise the first
    format the admin offers, not the first registered one.
    """

    model = Article
    name = "configured_export_article"
    fields = ["title", "content", "status", "author", "view_count"]
    filter_fields = ["status"]
    can_read = True
    export_enabled = True
    export_fields = ["title", "status", "view_count"]
    export_formats = ["xlsx", "csv"]


class CustomViewsetExportArticleAdmin(ModelAdmin):
    """Admin combining the export with a base viewset of its own."""

    model = Article
    name = "custom_viewset_export_article"
    fields = ["title", "status"]
    can_read = True
    base_viewset = PublishedOnlyAdminModelViewSet
    export_enabled = True
    export_fields = ["title", "status"]


class DeclaredListExportArticleAdmin(ModelAdmin):
    """Admin declaring its list view by hand - the export action lands in it too."""

    model = Article
    name = "declared_list_export_article"
    fields = ["title", "status", "view_count"]
    can_read = True
    export_enabled = True
    export_fields = ["title", "status"]
    view_schema_generators = [
        ShowViewSchemaGenerator(),
        ColumnCountListViewSchemaGenerator(boxes=["title", "status"], default_sorting="title"),
    ]


class StaffOnlyExportArticleAdmin(ModelAdmin):
    """Admin restricting the export per user - only staff members see and reach it (HAB-535)."""

    model = Article
    name = "staff_only_export_article"
    fields = ["title", "status"]
    can_read = True
    export_enabled = True
    export_fields = ["title", "status"]

    def can_export(self, request):
        user = getattr(request, "user", None)
        return super().can_export(request) and getattr(user, "is_staff", False)


class RefuseMarkedRequestsPermission(BasePermission):
    """Permission of an application - refuses requests carrying the ``X-Refuse`` header."""

    def has_permission(self, request, view):
        return "HTTP_X_REFUSE" not in request.META


class GuardedAdminModelViewSet(AdminModelViewSet):
    """Viewset of an application with a permission of its own - the export must not drop it."""

    permission_classes = AdminModelViewSet.permission_classes + [RefuseMarkedRequestsPermission]


class GuardedViewsetExportArticleAdmin(ModelAdmin):
    """Admin combining the export with a base viewset carrying a permission of its own."""

    model = Article
    name = "guarded_viewset_export_article"
    fields = ["title", "status"]
    can_read = True
    base_viewset = GuardedAdminModelViewSet
    export_enabled = True
    export_fields = ["title", "status"]
