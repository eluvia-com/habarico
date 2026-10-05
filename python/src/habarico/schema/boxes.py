from __future__ import annotations

from typing import Literal

from habarico.schema.actions import (
    ActionDescriptor,
    Actions,
    DefaultActions,
    generate_action_descriptor,
    generate_actions_descriptor,
)
from habarico.schema.base import BaseSchema, SchemaContext, schema_getter
from habarico.schema.fields import (
    Field,
    Fieldset,
    Filters,
    SortingOrStr,
    generate_filters_descriptor,
    generate_sorting_descriptor,
)
from habarico.schema.reference import ResourceReference, build_resource_reference
from habarico.schema.types import ActionScopeType, BoxType
from habarico.utils import dump_query_json
from rest_framework.fields import empty


def build_box_reference(
    reference: ResourceReference | str,
    schema_params: dict[str, str] | None,
) -> ResourceReference:
    """
    Compose the address a list or gallery box points at.

    The resource and the parameters of its schema request are one address, so the flat keyword
    arguments the box DSL takes are folded into a single object here.

    Args:
        reference (ResourceReference | str): Resource the box points at.
        schema_params (dict[str, str], optional): Query of its schema request.

    Returns:
        ResourceReference: The composed address.
    """
    if isinstance(reference, ResourceReference):
        return reference
    return build_resource_reference(reference, params=schema_params)


def build_parent_link_params(target: str | None, context: SchemaContext) -> dict[str, str] | None:
    """
    The query that ties a box's resource to the record the surrounding view renders.

    The two say the same id in two languages. ``_target`` is the child's: the foreign key column on
    the listed resource that points back, which is what filters the list and what prefills a record
    created from it. ``_source`` is the parent's: its resource identity, service-prefixed the way the
    client composes one, which is why it can carry a slash where a column name never can.

    Both are what the frontend already sends with the box's own schema request, which is why a box's
    ``list`` slots need neither.

    Args:
        target (str, optional): Foreign key column the box filters by.
        context (SchemaContext): The box's context, which holds the record and the parent's address.

    Returns:
        dict[str, str]: The link, or None when there is no record to link to — which is every
        collection schema.
    """
    obj = context.obj if context else None
    source = context.schema_source if context else None
    if obj is None or source is None:
        return None

    params = {"_source": dump_query_json({source.qualified_name: obj.pk})}
    if target:
        params["_target"] = dump_query_json({target: obj.pk})
    return params


def build_list_source(
    reference: ResourceReference | str,
    schema_params: dict[str, str] | None,
    target: str | None,
    context: SchemaContext,
) -> ResourceReference:
    """
    The address a ``LIST`` reference inside a box resolves to.

    The collection the box lists — never one record, so a pk inherited from the page the box sits on
    is dropped — carrying the query the box's own schema request carries: its ``schema_params`` and
    the link to the record the view renders. A descriptor in the box header is rendered in the
    parent's context, so an address leaving that context has to bring the link with it; inside the
    box's own ``list`` parameters nothing needs it, because those slots are read in the schema the box
    already requested with the same query.

    Args:
        reference (ResourceReference | str): Resource the box points at.
        schema_params (dict[str, str], optional): Query of the box's schema request.
        target (str, optional): Foreign key column the box filters by.
        context (SchemaContext): The box's context, which holds the record the view renders.

    Returns:
        ResourceReference: The composed address.
    """
    address = build_box_reference(reference, None)
    params = {**(schema_params or {}), **(build_parent_link_params(target, context) or {})}
    return build_resource_reference(address.qualified_name, params=params or None)


def generate_boxes_descriptor(boxes: list | None) -> list:
    """
    Generate boxes descriptor from a mixed list of boxes and fields.

    Args:
        boxes (BoxesContent): List of BaseBox instances, field name strings, or Field descriptors.

    Returns:
        BoxesDescriptor: Processed list with strings converted to Field descriptors.
    """
    if boxes is None:
        return []
    result = []
    for item in boxes:
        if isinstance(item, BaseBox):
            result.append(item)
        elif isinstance(item, Field):
            result.append(item)
        elif isinstance(item, str):
            result.append(Field(name=item))
    return result


class ReadonlyBoxWrapper(BaseSchema):
    """
    Box wrapper that makes all the inner boxes read-only.
    """

    def __init__(self, box: BaseBox):
        """
        Args:
            box (BaseBox): Box that will be wrapped.
        """
        self._box = box

    def to_dict(self, **kwargs) -> dict:
        kwargs["read_only"] = True
        return self._box.to_dict(**kwargs)


class ConditionalBoxWrapper(BaseSchema):
    """
    Box wrapper that can be used to implement dynamic box rendering based on conditions.
    """

    def _get_box(self) -> BaseBox:
        """
        Override this method to return the box that will be wrapped.
        """
        raise NotImplementedError("This method should be overridden in subclasses.")

    def _serialize(self) -> dict:
        return self._get_box().to_dict(context=self.context)


class BaseBox(BaseSchema):

    def __init__(
        self,
        *,
        type: BoxType,
        name: str | None = None,
        label: str | None = None,
        card: bool | None = None,
        collapsible: Literal["open", "closed"] | None = None,
        boxes: list[BaseBox | str | Field] | None = None,
        read_only: bool = False,
        show_query: str | None = None,
        required_query: str | None = None,
        toolbar_actions: Actions | None = None,
        bottom_actions: Actions | None = None,
    ):
        """
        Base schema for all box types.

        Args:
            type (BoxType): Type of the box.
            name (str, optional): Name of the box. Defaults to None.
            label (str, optional): Label of the box. Defaults to None.
            card (bool, optional): Whether the box is displayed as a card. ``True`` always renders the card,
                ``False`` never does - not even for a box with a label or toolbar actions, whose label then
                becomes a plain section heading. Defaults to None, which leaves the decision to the frontend:
                a box takes the card when it has a label, toolbar actions or is collapsible, and when it is
                the view's first box on a page (inside a dialog or side panel the overlay is already the card).
            collapsible (str, optional): Makes the box collapsible. Value sets the default state:
                ``'open'`` (expanded) or ``'closed'`` (collapsed). Defaults to None (not collapsible).
            boxes (list, optional): Unified list of child boxes and fields. Items can be BaseBox instances,
                field name strings, Field descriptors, or lists of fields (inline rows). Defaults to None.
            read_only (bool, optional): Flag that indicates if the box is read-only. Defaults to False.
            toolbar_actions (Actions, optional): Actions rendered in this box's local toolbar. On a plain box the
                toolbar is always visible; on a step container (tab/wizard) the actions appear on the last step.
                Defaults to None (no local toolbar).
            bottom_actions (Actions, optional): Actions rendered at the bottom of the box, similar to form submit
                buttons. Defaults to None (no bottom actions).
        """
        self._type = type
        self._name = name
        self._label = label
        self._card = card
        self._collapsible = collapsible
        self._boxes = generate_boxes_descriptor(boxes)
        self._read_only = read_only
        self._toolbar_actions = generate_actions_descriptor(toolbar_actions)
        self._bottom_actions = generate_actions_descriptor(bottom_actions)
        if show_query or required_query:
            self._options = {
                "dynamic_render": {
                    "show_query": show_query,
                    "required_query": required_query,
                }
            }

    def _get_list_source(self) -> ResourceReference | None:
        """The address a ``LIST`` reference resolves to inside this box. Only a box that lists one has it."""
        return None

    def setup(self, **kwargs) -> BaseSchema:
        """Stamp the listed resource for this box's subtree, which is what ``LIST`` resolves against."""
        super().setup(**kwargs)
        source = self._get_list_source()
        if source is not None:
            self.context = self.context.update(list_source=source)
        return self

    def get_name(self) -> str | None:
        if self._name:
            return self._name

        index = self.context.index
        if index is None:
            index = 0

        return str(index)

    def get_read_only(self) -> bool:
        return self.context.read_only or self._read_only


Boxes = list[BaseBox | str | Field]


class Box(BaseBox):

    def __init__(
        self,
        *,
        label: str | None = None,
        boxes: list[BaseBox | str | Field] | None = None,
        read_only: bool = False,
        **kwargs,
    ):
        """
        Simple box that contains fields or other boxes.

        Args:
            label (str, optional): Label of the box. Defaults to None.
            boxes (list, optional): Unified list of child boxes and fields. Defaults to None.
            read_only (bool, optional): Flag that indicates if the box is read-only. Defaults to False.
        """
        super().__init__(type=BoxType.SIMPLE, label=label, boxes=boxes, read_only=read_only, **kwargs)

    def get_read_only(self) -> bool:
        if super().get_read_only():
            return True
        inner_boxes = [f for f in (self._boxes or []) if isinstance(f, BaseBox)]
        plain_fields = [f for f in (self._boxes or []) if not isinstance(f, BaseBox)]
        return not plain_fields and (
            not inner_boxes or all(b.get_read_only() or not b.can_render() for b in inner_boxes)
        )


class TabBoxParameters(BaseSchema):

    def __init__(self, *, show_toolbar_navigation: bool = False):
        """
        Tab box parameters.

        Args:
            show_toolbar_navigation (bool, optional): Show previous/next navigation buttons in the box toolbar.
                Defaults to False.
        """
        self._show_toolbar_navigation = show_toolbar_navigation


class TabBox(BaseBox):

    def __init__(
        self,
        *,
        label: str | None = None,
        boxes: list[BaseBox | str | Field] | None = None,
        read_only: bool = False,
        show_toolbar_navigation: bool = False,
        **kwargs,
    ):
        """
        Tab box that contains multiple boxes. Each child box will be displayed as a separate tab.

        Args:
            label (str, optional): Label of the box. Defaults to None.
            boxes (list, optional): Unified list of child boxes and fields. Defaults to None.
            read_only (bool, optional): Flag that indicates if the box is read-only. Defaults to False.
            show_toolbar_navigation (bool, optional): Show previous/next navigation buttons in the box toolbar.
                Defaults to False.
        """
        super().__init__(type=BoxType.TAB, label=label, boxes=boxes, read_only=read_only, **kwargs)
        self.__tab_kwargs = dict(show_toolbar_navigation=show_toolbar_navigation)

    def _get_tab_kwargs(self) -> dict:
        """Constructor kwargs for the tab params. Override to make them context-dependent."""
        return self.__tab_kwargs

    @schema_getter
    def get_tab(self) -> TabBoxParameters:
        return TabBoxParameters(**self._get_tab_kwargs())


class WizardBoxParameters(BaseSchema):

    def __init__(self, *, show_toolbar_navigation: bool = True, validate_steps: bool = True):
        """
        Wizard box parameters.

        Args:
            show_toolbar_navigation (bool, optional): Show previous/next navigation buttons in the box toolbar.
                Defaults to True.
            validate_steps (bool, optional): Validate the current step before moving to the next one.
                Defaults to True.
        """
        self._show_toolbar_navigation = show_toolbar_navigation
        self._validate_steps = validate_steps


class WizardBox(BaseBox):

    def __init__(
        self,
        *,
        label: str | None = None,
        boxes: list[BaseBox | str | Field] | None = None,
        read_only: bool = False,
        show_toolbar_navigation: bool = True,
        validate_steps: bool = True,
        **kwargs,
    ):
        """
        Wizard box that contains multiple boxes. Each child box will be displayed as a separate step.

        Args:
            label (str, optional): Label of the box. Defaults to None.
            boxes (list, optional): Unified list of child boxes and fields. Defaults to None.
            read_only (bool, optional): Flag that indicates if the box is read-only. Defaults to False.
            show_toolbar_navigation (bool, optional): Show previous/next navigation buttons in the box toolbar.
                Defaults to True.
            validate_steps (bool, optional): Validate the current step before moving to the next one.
                Defaults to True.
        """
        super().__init__(type=BoxType.WIZARD, label=label, boxes=boxes, read_only=read_only, **kwargs)
        self.__wizard_kwargs = dict(show_toolbar_navigation=show_toolbar_navigation, validate_steps=validate_steps)

    def _get_wizard_kwargs(self) -> dict:
        """Constructor kwargs for the wizard params. Override to make them context-dependent."""
        return self.__wizard_kwargs

    @schema_getter
    def get_wizard(self) -> WizardBoxParameters:
        return WizardBoxParameters(**self._get_wizard_kwargs())


class GridBox(BaseBox):

    def __init__(
        self,
        *,
        label: str | None = None,
        boxes: list[BaseBox | str | Field] | None = None,
        read_only: bool = False,
        **kwargs,
    ):
        """
        Grid box that contains multiple boxes. Each child box will be displayed as a grid item.

        Args:
            label (str, optional): Label of the box. Defaults to None.
            boxes (list, optional): Unified list of child boxes and fields. Defaults to None.
            read_only (bool, optional): Flag that indicates if the box is read-only. Defaults to False.
        """
        super().__init__(type=BoxType.GRID, label=label, boxes=boxes, read_only=read_only, **kwargs)


class TabItemBox(BaseBox):

    def __init__(
        self,
        *,
        label: str,
        boxes: list[BaseBox | str | Field] | None = None,
        read_only: bool = False,
        **kwargs,
    ):
        """
        Tab item box that represents a single tab/step inside a tab or wizard box.

        Args:
            label (str): Label of the tab item. Required.
            boxes (list, optional): Unified list of child boxes and fields. Defaults to None.
            read_only (bool, optional): Flag that indicates if the box is read-only. Defaults to False.
        """
        super().__init__(type=BoxType.TAB_ITEM, label=label, boxes=boxes, read_only=read_only, **kwargs)


class GridItemBoxParameters(BaseSchema):

    def __init__(
        self,
        *,
        xs: int | None = None,
        sm: int | None = None,
        md: int | None = None,
        lg: int | None = None,
        xl: int | None = None,
    ):
        """
        Grid item box parameters.

        Args:
            xs (int, optional): Number of columns for extra small screens. Defaults to None.
            sm (int, optional): Number of columns for small screens. Defaults to None.
            md (int, optional): Number of columns for medium screens. Defaults to None.
            lg (int, optional): Number of columns for large screens. Defaults to None.
            xl (int, optional): Number of columns for extra large screens. Defaults to None.
        """
        self._xs = xs
        self._sm = sm
        self._md = md
        self._lg = lg
        self._xl = xl


class GridItemBox(BaseBox):

    def __init__(
        self,
        *,
        xs: int | None = None,
        sm: int | None = None,
        md: int | None = None,
        lg: int | None = None,
        xl: int | None = None,
        **kwargs,
    ):
        """
        Grid item box that represents a grid item.

        Args:
            label (str, optional): Label of the box. Defaults to None.
            boxes (list[BaseBox], optional): List of child boxes. Defaults to None.
            fields (Fieldset, optional): List of fields that will be displayed in the box. Defaults to None.
            read_only (bool, optional): Flag that indicates if the box is read-only. Defaults to False.
            xs (int, optional): Number of columns for extra small screens. Defaults to None.
            sm (int, optional): Number of columns for small screens. Defaults to None.
            md (int, optional): Number of columns for medium screens. Defaults to None.
            lg (int, optional): Number of columns for large screens. Defaults to None.
            xl (int, optional): Number of columns for extra large screens. Defaults to None.
        """
        super().__init__(type=BoxType.GRID_ITEM, **kwargs)
        self.__grid_item_kwargs = dict(xs=xs, sm=sm, md=md, lg=lg, xl=xl)

    def _get_grid_item_kwargs(self) -> dict:
        """Constructor kwargs for the grid item params. Override to make them context-dependent."""
        return self.__grid_item_kwargs

    @schema_getter
    def get_grid_item(self) -> GridItemBoxParameters:
        return GridItemBoxParameters(**self._get_grid_item_kwargs())


class ListBoxParameters(BaseSchema):

    def __init__(
        self,
        *,
        target: str,
        reference: ResourceReference | str,
        row_actions: Actions | None = empty,
        list_actions: Actions | None = empty,
        default_sorting: SortingOrStr | None = None,
        filters: Filters | None = None,
        extra_filters: dict[str, str | int | bool | None] | None = None,
        sortable_field_name: str | None = None,
        sortable_sort_for_filters: dict[str, str | int | bool | None] | None = None,
        schema_params: dict[str, str] | None = None,
        double_click_action: ActionDescriptor | str | None = None,
        single_click_action: ActionDescriptor | str | None = None,
    ):
        """
        List view parameters, required if type is `list`.

        Args:
            target (str): Target field that will be used to filter the resource items.
            reference (str): Reference to the resource that will be displayed in the table.
            filters (Filters, optional): List of filters that will be applied to the items in the table.
                                          Defaults to None.
            row_actions (list[ActionDescriptor], optional): Buttons on each row. Left out, the box
                publishes the listed resource's own record actions; ``None`` or ``[]`` renders none.
            list_actions (Actions, optional): Buttons above the table. Left out, the box publishes the
                listed resource's own collection actions; ``None`` or ``[]`` renders none.
            default_sorting (sortingDescriptor, optional): Default sorting of the items in the table.
                                                           Defaults to None.
            extra_filters (dict[str, str | int | bool | None], optional): Additional filters that will be applied to
                                                                          the items in the table. Defaults to None.
            sortable_field_name (str, optional): Field that will be used to store the order of the items.
                                                 Defaults to None.
            sortable_sort_for_filters (dict[str, str | int | bool | None], optional): Additional filters that will be
                                                                                      applied to the items in the table.
                                                                                      Defaults to None.
            schema_params (dict[str, str | int | bool | None], optional): Additional parameters that will be sent with
                                                                          get schema request.
            double_click_action (ActionDescriptor | str, optional): Action to activate on row double-click. Accepts a
                                                 full action descriptor (carrying its own ``view_mode``) or a plain
                                                 action name (e.g. "show", "edit", "create-invoice") normalized into a
                                                 descriptor. Defaults to None (auto: show -> edit -> nothing).
            single_click_action (ActionDescriptor | str, optional): Action to activate on a single row click. Accepts
                                                 a full action descriptor (carrying its own ``view_mode``, e.g.
                                                 ``SIDEPANEL`` to preview a record) or a plain action name that is
                                                 normalized into a descriptor. Defaults to None (single click does
                                                 nothing).
        """
        self._target = target
        self._reference = build_box_reference(reference, schema_params)
        self._filters = generate_filters_descriptor(filters)
        self._row_actions = row_actions if row_actions is empty else generate_actions_descriptor(row_actions)
        self._list_actions = list_actions if list_actions is empty else generate_actions_descriptor(list_actions)
        self._default_sorting = generate_sorting_descriptor(default_sorting)

        self._extra_filters = extra_filters
        if sortable_field_name:
            self._sortable = {"field_name": sortable_field_name, "sort_for_filters": sortable_sort_for_filters}
        self._double_click_action = generate_action_descriptor(double_click_action)
        self._single_click_action = generate_action_descriptor(single_click_action)

    def get_row_actions(self) -> list[ActionDescriptor] | None:
        """
        Row buttons act on one record of the listed resource, whose id the row supplies — hence the
        ``detail`` scope on an entry that names no resource: these slots are rendered in the schema of
        the resource the box points at, which is what an absent address means.

        Only a slot nothing was said about gets the default; ``None`` and ``[]`` both render nothing.
        """
        if self._row_actions is empty:
            return [DefaultActions(scope=ActionScopeType.DETAIL)]
        return self._row_actions

    def get_list_actions(self) -> list[ActionDescriptor] | None:
        """The collection's own buttons, above the table — same slot, the other scope."""
        if self._list_actions is empty:
            return [DefaultActions(scope=ActionScopeType.LIST)]
        return self._list_actions


class ListBox(BaseBox):

    def __init__(
        self,
        *,
        label: str | None = None,
        boxes: Fieldset | None = None,
        filters: Filters | None = None,
        target: str | None = None,
        reference: str,
        row_actions: Actions | None = empty,
        toolbar_actions: Actions | None = None,
        list_actions: Actions | None = empty,
        default_sorting: SortingOrStr | None = None,
        extra_filters: dict[str, str | int | bool | None] | None = None,
        sortable_field_name: str | None = None,
        sortable_sort_for_filters: dict[str, str | int | bool | None] | None = None,
        schema_params: dict[str, str] | None = None,
        double_click_action: ActionDescriptor | str | None = None,
        single_click_action: ActionDescriptor | str | None = None,
        **kwargs,
    ):
        """
        Special type of box that shows a table of another resource.

        Args:
            label (str, optional): Label of the box. Defaults to None.
            boxes (Fieldset, optional): List of fields that will be displayed as columns. Defaults to None.
            filters (Filters, optional): List of filters that will be applied to the items in the table.
                                         Defaults to None.
            target (str): Target field that will be used to filter the resource items.
            reference (str): Reference to the resource that will be displayed in the table.
            row_actions (list[ActionDescriptor], optional): Buttons on each row. Left out, the box
                publishes the listed resource's own record actions; ``None`` or ``[]`` renders none.
            toolbar_actions (Actions, optional): Actions rendered in the box's own toolbar (box header /
                card header area), relative to the box root. Defaults to None.
            list_actions (Actions, optional): Buttons above the table. Left out, the box publishes the
                listed resource's own collection actions; ``None`` or ``[]`` renders none.
            default_sorting (OrderingDescriptor, optional): Default sorting of the items in the table. Defaults to None.
            extra_filters (dict[str, str | int | bool | None], optional): Additional filters that will be applied to
                                                                          the items in the table. Defaults to None.
            sortable_field_name (str, optional): Field that will be used to store the order of the items.
                                                 Defaults to None.
            sortable_sort_for_filters (dict[str, str | int | bool | None], optional): Additional filters that will be
                                                                                      applied to the items in the table.
                                                                                      Defaults to None.
            schema_params (dict[str, str | int | bool | None], optional): Additional parameters that will be sent with
                                                                          get schema request.
            double_click_action (ActionDescriptor | str, optional): Action to activate on row double-click. Accepts a
                                                 full action descriptor (carrying its own ``view_mode``) or a plain
                                                 action name (e.g. "show", "edit", "create-invoice") normalized into a
                                                 descriptor. Defaults to None (auto: show -> edit -> nothing).
            single_click_action (ActionDescriptor | str, optional): Action to activate on a single row click. Accepts
                                                 a full action descriptor (carrying its own ``view_mode``, e.g.
                                                 ``SIDEPANEL`` to preview a record) or a plain action name that is
                                                 normalized into a descriptor. Defaults to None (single click does
                                                 nothing).
        """
        super().__init__(
            type=BoxType.LIST, label=label, boxes=boxes, read_only=True, toolbar_actions=toolbar_actions, **kwargs
        )
        self.__list_kwargs = dict(
            target=target,
            reference=reference,
            row_actions=row_actions,
            list_actions=list_actions,
            default_sorting=default_sorting,
            filters=filters,
            extra_filters=extra_filters,
            sortable_field_name=sortable_field_name,
            sortable_sort_for_filters=sortable_sort_for_filters,
            schema_params=schema_params,
            double_click_action=double_click_action,
            single_click_action=single_click_action,
        )

    def _get_list_kwargs(self) -> dict:
        """Constructor kwargs for the list params. Override to make them context-dependent."""
        return self.__list_kwargs

    def _get_list_source(self) -> ResourceReference:
        kwargs = self._get_list_kwargs()
        return build_list_source(kwargs["reference"], kwargs.get("schema_params"), kwargs.get("target"), self.context)

    @schema_getter
    def get_list(self) -> ListBoxParameters:
        return ListBoxParameters(**self._get_list_kwargs())


class GalleryBoxParameters(BaseSchema):

    def __init__(
        self,
        *,
        reference: ResourceReference | str,
        image_field: str,
        target: str | None = None,
        filters: Filters | None = None,
        default_sorting: SortingOrStr | None = None,
        extra_filters: dict[str, str | int | bool | None] | None = None,
        schema_params: dict[str, str] | None = None,
    ):
        """
        Gallery box parameters, required if box type is `gallery`.

        Args:
            reference (str): Reference to the resource displayed in the gallery.
            image_field (str): Name of the field containing the image ({url, filename}).
            target (str, optional): Target field used to filter resource items. Defaults to None.
            filters (Filters, optional): List of filters. Defaults to None.
            default_sorting (SortingOrStr, optional): Default sorting. Defaults to None.
            extra_filters (dict, optional): Additional static filters. Defaults to None.
            schema_params (dict[str, str], optional): Additional parameters sent with get schema request.
        """
        self._reference = build_box_reference(reference, schema_params)
        self._image_field = image_field
        self._target = target
        self._filters = generate_filters_descriptor(filters)
        self._default_sorting = generate_sorting_descriptor(default_sorting)
        self._extra_filters = extra_filters


class GalleryBox(BaseBox):

    def __init__(
        self,
        *,
        label: str | None = None,
        reference: str,
        image_field: str,
        target: str | None = None,
        filters: Filters | None = None,
        default_sorting: SortingOrStr | None = None,
        extra_filters: dict[str, str | int | bool | None] | None = None,
        schema_params: dict[str, str] | None = None,
        **kwargs,
    ):
        """
        Special type of box that shows images from another resource as a gallery carousel.

        Args:
            label (str, optional): Label of the box. Defaults to None.
            reference (str): Reference to the resource displayed in the gallery.
            image_field (str): Name of the field containing the image ({url, filename}).
            target (str, optional): Target field used to filter resource items. Defaults to None.
            filters (Filters, optional): List of filters. Defaults to None.
            default_sorting (SortingOrStr, optional): Default sorting. Defaults to None.
            extra_filters (dict, optional): Additional static filters. Defaults to None.
            schema_params (dict[str, str], optional): Additional parameters sent with get schema request.
        """
        super().__init__(type=BoxType.GALLERY, label=label, read_only=True, **kwargs)
        self.__gallery_kwargs = dict(
            reference=reference,
            image_field=image_field,
            target=target,
            filters=filters,
            default_sorting=default_sorting,
            extra_filters=extra_filters,
            schema_params=schema_params,
        )

    def _get_gallery_kwargs(self) -> dict:
        """Constructor kwargs for the gallery params. Override to make them context-dependent."""
        return self.__gallery_kwargs

    def _get_list_source(self) -> ResourceReference:
        kwargs = self._get_gallery_kwargs()
        return build_list_source(kwargs["reference"], kwargs.get("schema_params"), kwargs.get("target"), self.context)

    @schema_getter
    def get_gallery(self) -> GalleryBoxParameters:
        return GalleryBoxParameters(**self._get_gallery_kwargs())


class ObjectBoxParameters(BaseSchema):

    def __init__(self, *, target: str):
        """
        Object box parameters, required if box type is `object` or `array`.

        Args:
            target (str): The nested serializer field name.
        """
        self._target = target


class ObjectBox(BaseBox):

    def __init__(
        self,
        *,
        label: str | None = None,
        boxes: Fieldset | None = None,
        read_only: bool = False,
        target: str,
        **kwargs,
    ):
        """
        Special type of box that represents an object.
        It can be used to display a nested object through the nested DRF serializer.

        Args:
            label (str, optional): Label of the box. Defaults to None.
            boxes (Fieldset, optional): List of fields that will be displayed in the box. Defaults to None.
            read_only (bool, optional): Flag that indicates if the box is read-only. Defaults to False.
            target (str): The nested serializer field name.
        """
        super().__init__(type=BoxType.OBJECT, label=label, boxes=boxes, read_only=read_only, **kwargs)
        self.__object_kwargs = dict(target=target)

    def _get_object_kwargs(self) -> dict:
        """Constructor kwargs for the object params. Override to make them context-dependent."""
        return self.__object_kwargs

    @schema_getter
    def get_object(self) -> ObjectBoxParameters:
        return ObjectBoxParameters(**self._get_object_kwargs())


class ArrayBoxParameters(BaseSchema):

    def __init__(
        self,
        *,
        target: str,
        listed_by_field_name: str | None = None,
        listed_by_other_values: list[str | int] | None = None,
        inline: bool = True,
    ):
        """
        Array box parameters, required if box type is `object` or `array`.

        Args:
            target (str): The nested serializer field name.
            listed_by_field_name (str, optional): The field that will be used to list the items. Defaults to None.
                                                  Field must be choice field.
            listed_by_other_values (list[str | int], optional): The values that will be used to list the items as
                                                                a checkbox option.  Defaults to None.
            inline (bool, optional): Flag that indicates if the array items should be displayed inline.
        """
        self._target = target
        self._inline = inline
        if listed_by_field_name:
            self._listed = {"field_name": listed_by_field_name, "other_values": listed_by_other_values}


class ArrayBox(BaseBox):

    def __init__(
        self,
        *,
        label: str | None = None,
        boxes: list[BaseBox | str | Field] | None = None,
        read_only: bool = False,
        target: str,
        listed_by_field_name: str | None = None,
        listed_by_other_values: list[str | int] | None = None,
        inline: bool | None = None,
        **kwargs,
    ):
        """
        Special type of box that represents an array of objects.
        It can be used to display a nested array of objects through inner serializer.

        Args:
            label (str, optional): Label of the box. Defaults to None.
            boxes (list, optional): Unified list of child boxes and fields. Defaults to None.
            read_only (bool, optional): Flag that indicates if the box is read-only. Defaults to False.
            target (str): The nested serializer field name.
            listed_by_field_name (str, optional): The field that will be used to list the items. Defaults to None.
                                                  Field must be choice field.
            listed_by_other_values (list[str | int], optional): The values that will be used to list the items as
                                                                a checkbox option.  Defaults to None.
            inline (bool, optional): Flag that indicates if the array items should be displayed inline.
                                     Ignored if boxes contain BaseBox instances.
        """
        super().__init__(type=BoxType.ARRAY, label=label, boxes=boxes, read_only=read_only, **kwargs)

        if inline is None:
            inline = not any(isinstance(f, BaseBox) for f in (boxes or []))

        self.__array_kwargs = dict(
            target=target,
            listed_by_field_name=listed_by_field_name,
            listed_by_other_values=listed_by_other_values,
            inline=inline,
        )

    def _get_array_kwargs(self) -> dict:
        """Constructor kwargs for the array params. Override to make them context-dependent."""
        return self.__array_kwargs

    @schema_getter
    def get_array(self) -> ArrayBoxParameters:
        return ArrayBoxParameters(**self._get_array_kwargs())


class GridFieldsBox(GridBox):

    def __init__(self, *fields, xs: int = None, sm: int = None, md: int = None, lg: int = None, xl: int = None):
        boxes = [Box(boxes=[field]) for field in fields]
        super().__init__(boxes=boxes)
