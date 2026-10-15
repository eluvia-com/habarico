---
title: Action View Schema Generator
sidebar_position: 4
---

You can use `ActionViewSchemaGenerator` and `ViewLinkActionSchemaGenerator` to generate schema for custom action views:

```python
from rest_framework import serializers
from rest_framework.decorators import action
from habarico.schema import ActionSchema, ActionType
from habarico.response import ActionResponse, ActionStateType
from habarico.views import AdminModelViewSet

from .models import Product


class PublishProductSerializer(serializers.Serializer):
    """Serializer for the publish action."""
    published_at = serializers.DateField(
        label="Publication date",
        required=True,
    )


class ProductAdminView(AdminModelViewSet):
    """Custom viewset with publish action."""

    @action(detail=True, methods=["post"], url_path="publish", serializer_class=PublishProductSerializer)
    def publish(self, request, pk=None):
        """Action to publish an product."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product = self.get_object()
        product.status = "published"
        product.published_at = serializer.validated_data["published_at"]
        product.save()

        return ActionResponse(
            message="Product has been published.",
            state=ActionStateType.SUCCESS,
            action=ActionSchema(
                type=ActionType.VIEW,
                is_detail=True,
                confirm_dialog_title="View product",
                confirm_dialog_message="Do you want to view the published product?",
                view_name="show",
                record_pk=product.pk,
            ),
        )
```

Then configure the admin to use the action:

```python
from habarico import ModelAdmin
from habarico.schema.generators import (
    CreateViewSchemaGenerator,
    EditViewSchemaGenerator,
    ListViewSchemaGenerator,
    ShowViewSchemaGenerator,
    CreateActionSchemaGenerator,
    EditActionSchemaGenerator,
    ShowActionSchemaGenerator,
    ActionViewSchemaGenerator,
    ViewLinkActionSchemaGenerator,
    RequestMethodType,
)

from .models import Product


class ProductAdmin(ModelAdmin):
    model = Product
    base_viewset = ProductAdminView
    view_schema_generators = [
        CreateViewSchemaGenerator(),
        EditViewSchemaGenerator(),
        ShowViewSchemaGenerator(),
        ListViewSchemaGenerator(),
        # Add the action view schema generator
        ActionViewSchemaGenerator(
            name="publish",
            action_name="publish",
            is_detail=True,
            method=RequestMethodType.POST,
        ),
    ]
    action_schema_generators = [
        CreateActionSchemaGenerator(),
        EditActionSchemaGenerator(),
        ShowActionSchemaGenerator(),
        # Add link action schema generator
        ViewLinkActionSchemaGenerator(
            name="publish",
            label="Publish Product",
            view_name="publish",
            view_mode="dialog",  # The dialog will be used for the action view
            show_in_detail=True,
            is_detail=True,
        ),
    ]
```

The action will be generated as a form with the `published_at` field and a submit button.

## See also

- [Actions and dialogs](/concepts/guides/actions-and-dialogs) — the three shapes an action can take
