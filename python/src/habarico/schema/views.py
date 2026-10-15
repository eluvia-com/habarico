from __future__ import annotations

from .actions import ActionDescriptor, Actions, generate_action_descriptor, generate_actions_descriptor
from .base import BaseSchema
from .boxes import BaseBox, Boxes, generate_boxes_descriptor
from .fields import Filters, SortingOrStr, generate_filters_descriptor, generate_sorting_descriptor
from .menu import MenuSchema
from .types import ViewModeType, ViewType


class ViewEndpointParameters(BaseSchema):

    def __init__(self, *, method: str, reference: str | None = None, action_name: str | None, path: str | None = None):
        """
        Object represents schema of the endpoint parameters.

        Args:
            method (str): Method of the endpoint.
            reference (str, optional): Reference of the endpoint. Defaults to None.
            action_name (str, optional): Action name of the endpoint. Defaults to None.
            path (str, optional): Path of the endpoint. Defaults to None.
        """
        self._method = method
        self._reference = reference
        self._action_name = action_name
        self._path = path


class GlobalViewSchema(BaseSchema):

    def __init__(
        self,
        *,
        name: str,
        type: ViewType,
        is_detail: bool,
        endpoint: ViewEndpointParameters,
        mode: ViewModeType | None = None,
    ):
        """
        Object represents schema of the global view, returned by the service schema endpoint (`/admin/schema`).

        Args:
            name (str): Name of the view.
            type (ViewType): Type of the view.
            is_detail (bool): Is view on object detail.
            endpoint (ViewEndpointParameters, optional): Endpoint parameters. Defaults to None.
            mode (ViewModeType, optional): Default presentation mode when a trigger opens this view without its own
                mode. When unset, the frontend falls back to redirect. Defaults to None.
        """
        self._name = name
        self._type = type
        self._is_detail = is_detail
        self._endpoint = endpoint
        self._mode = mode

    def get_name(self) -> str:
        """
        Get name of the view.

        Returns:
            str: Name of the view.
        """
        return self._name


class ListViewParameters(BaseSchema):

    def __init__(
        self,
        *,
        boxes: Boxes | None = None,
        filters: Filters | None = None,
        row_actions: Actions | None = None,
        toolbar_actions: Actions | None = None,
        list_actions: Actions | None = None,
        default_sorting: SortingOrStr | None = None,
        extra_filters: dict[str, str | int | bool | None] | None = None,
        sortable_field_name: str | None = None,
        sortable_sort_for_filters: dict[str, str | int | bool | None] | None = None,
        double_click_action: ActionDescriptor | str | None = None,
        single_click_action: ActionDescriptor | str | None = None,
    ):
        """
        Object represents schema of the list view parameters.

        Args:
            boxes (Boxes, optional): Fields and boxes to display as columns. Defaults to None.
            filters (list[FilterDescriptor], optional): Filters of the view. Defaults to None.
            row_actions (list[ActionDescriptor], optional): Row actions of the view. Defaults to None.
            toolbar_actions (list[ActionDescriptor], optional): Toolbar actions of the view. Defaults to None.
            list_actions (list[ActionDescriptor], optional): Utility actions of the table (export, print, ...)
                rendered next to the filters, separate from toolbar and row actions. Defaults to None.
            default_sorting (SortingOrStr, optional): Default ordering of the view. Defaults to None.
            extra_filters (dict[str, str | int | bool | None], optional): Extra filters of the view. Defaults to None.
            sortable_field_name (str, optional): Sortable field name. Defaults to None.
            sortable_sort_for_filters (dict[str, str | int | bool | None], optional): Sortable soft for filters.
                                                                                      Defaults to None.
            double_click_action (ActionDescriptor | str, optional): Action to activate on row double-click. Accepts a
                                                 full action descriptor (carrying its own ``view_mode``) or a plain
                                                 action name (e.g. "show", "edit", "create-invoice") normalized into a
                                                 descriptor. Defaults to None (auto: show -> edit -> nothing).
            single_click_action (ActionDescriptor | str, optional): Action to activate on a single row click. Accepts
                                                 a full action descriptor (carrying its own ``view_mode``, e.g.
                                                 ``SIDEPANEL`` to open a record preview beside the table) or a plain
                                                 action name that is normalized into a descriptor. Defaults to None
                                                 (single click does nothing).
        """
        self._boxes = generate_boxes_descriptor(boxes)
        self._row_actions = generate_actions_descriptor(row_actions)
        self._toolbar_actions = generate_actions_descriptor(toolbar_actions)
        self._list_actions = generate_actions_descriptor(list_actions)
        self._default_sorting = generate_sorting_descriptor(default_sorting)
        self._extra_filters = extra_filters
        self._filters = generate_filters_descriptor(filters)
        if sortable_field_name:
            self._sortable = {"field_name": sortable_field_name, "sort_for_filters": sortable_sort_for_filters}
        self._double_click_action = generate_action_descriptor(double_click_action)
        self._single_click_action = generate_action_descriptor(single_click_action)


class DetailViewParameters(BaseSchema):

    def __init__(
        self,
        *,
        box: BaseBox,
        toolbar_actions: Actions | None = None,
        bottom_actions: Actions | None = None,
    ):
        """
        Object represents schema of the detail view parameters.

        Args:
            box (BaseBox): Box of the view.
            toolbar_actions (list[ActionDescriptor], optional): Toolbar actions of the view. Defaults to None.
            bottom_actions (list[ActionDescriptor], optional): Bottom actions of the view. Defaults to None.
        """
        self._box = box
        self._toolbar_actions = generate_actions_descriptor(toolbar_actions)
        self._bottom_actions = generate_actions_descriptor(bottom_actions)


class ViewSchema(GlobalViewSchema):

    def __init__(
        self,
        *,
        name: str,
        type: ViewType,
        label: str | None = None,
        list: ListViewParameters | None = None,
        detail: DetailViewParameters | None = None,
        is_detail: bool,
        endpoint: ViewEndpointParameters | None = None,
        breadcrumbs: list[MenuSchema] | None = None,
        mode: ViewModeType | None = None,
    ):
        """
        Object represents schema of the view.

        Args:
            name (str): Name of the view.
            type (ViewType): Type of the view.
            is_detail (bool): Is view on object detail.
            list (ListViewParameters, optional): List view parameters. Defaults to None.
            detail (DetailViewParameters, optional): Detail view parameters. Defaults to None.
            endpoint (ViewEndpointParameters, optional): Endpoint parameters. Defaults to None.
            breadcrumbs (list[MenuSchema], optional): Breadcrumbs of the view. Defaults to None.
            mode (ViewModeType, optional): Default presentation mode when a trigger opens this view without its own
                mode. When unset, the frontend falls back to redirect. Defaults to None.
        """

        super().__init__(name=name, type=type, is_detail=is_detail, endpoint=endpoint, mode=mode)
        assert type != ViewType.LIST or list is not None, "List view parameters are required for list view"
        assert type == ViewType.LIST or detail is not None, "Detail view parameters are required for detail view"
        self._label = label
        if type == ViewType.LIST:
            self._list = list
        else:
            self._detail = detail
        self._breadcrumbs = breadcrumbs
