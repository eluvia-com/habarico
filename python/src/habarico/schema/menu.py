from __future__ import annotations

from uuid import uuid4

from habarico.config import MENU_GENERATOR_DEFAULT_PRIORITY
from habarico.schema.base import BaseSchema
from habarico.schema.types import ColorType, DialogWidthType, LinkTargetType, MenuType, PkType, ViewModeType


class MenuGroupSchema(BaseSchema):

    def __init__(
        self,
        *,
        name: str | None = None,
        label: str,
        icon: str | None = None,
        color: ColorType | None = None,
        priority: int = MENU_GENERATOR_DEFAULT_PRIORITY,
        parent: MenuGroupSchema | None = None,
    ):
        """
        Object represents schema of the service menu group. Groups with same name are merged.

        Args:
            name (str, optional): Name of the group. For None value unique name is generated. Defaults to None.
            label (str): Label of the group.
            icon (str, optional): Icon of the group. Defaults to None.
            color (ColorType, optional): Color of the icon. Defaults to None.
            priority (int, optional): Priority of the group. Defaults to MENU_GENERATOR_DEFAULT_PRIORITY.
            parent (MenuGroupSchema, optional): Parent group. Defaults to None.
        """
        self._name = name or uuid4()
        self._label = label
        self._icon = icon
        self._color = color
        self._priority = priority
        self._parent = parent


class ActionViewChoice(BaseSchema):

    def __init__(self, *, label: str, parameters: dict[str, str]):
        """
        Object represents schema of the view action choice.

        Args:
            label (str): Label of the choice.
            parameters (dict[str,str]): Parameters of the choice.
        """
        self._label = label
        self._parameters = parameters


class ViewActionEndpointParameters(BaseSchema):

    def __init__(self, *, reference: str | None = None, action_name: str | None, record_pk: PkType | None = None):
        """
        Object represents schema of the endpoint parameters.

        Args:
            reference (str, optional): Reference of the endpoint. Defaults to None.
            action_name (str, optional): Action name of the endpoint. Defaults to None.
        """
        self._reference = reference
        self._action_name = action_name
        self._record_pk = record_pk


class ViewActionParameters(BaseSchema):

    def __init__(
        self,
        *,
        name: str,
        endpoint: ViewActionEndpointParameters,
        choices: list[ActionViewChoice] | None = None,
        mode: ViewModeType = ViewModeType.REDIRECT,
        parameters: dict[str, str] | None = None,
        dialog_width: DialogWidthType | str | None = None,
        keep_linked_parent: bool | None = None,
    ):
        """
        Object represents schema of the view action parameters. Shared by the menu and by view actions.

        Args:
            name (str): Name of the view.
            endpoint (ViewActionEndpointParameters): Endpoint parameters of the view.
            choices (list[ActionViewChoice], optional): Choices of the view. Defaults to None.
            mode (ViewModeType): Mode of the view. Modal or redirect. Defaults to ViewModeType.REDIRECT.
            parameters (dict, optional): Additional parameters for the view. Defaults to None.
            dialog_width (DialogWidthType | str, optional): Width of the dialog. Accepts MUI breakpoints
                (xs/sm/md/lg/xl) or a pixel value string (e.g. ``"800px"``). Only used when mode is DIALOG.
                Defaults to None.
            keep_linked_parent (bool, optional): Keep linked parent in the URL when navigating to the linked
                resource. Defaults to None.
        """
        self._name = name
        self._endpoint = endpoint
        self._choices = choices
        self._mode = mode
        self._parameters = parameters
        self._dialog_width = dialog_width
        self._keep_linked_parent = keep_linked_parent


class LinkActionParameters(BaseSchema):

    def __init__(self, *, url: str, target: LinkTargetType = LinkTargetType.BLANK):
        """
        Object represents schema of the link action parameters. Shared by the menu and by link actions.

        Args:
            url (str): URL of the link.
            target (LinkTargetType, optional): Target of the link. Defaults to LinkTargetType.BLANK.
        """
        self._url = url
        self._target = target


class MenuSchema(MenuGroupSchema):

    def __init__(
        self,
        *,
        type: MenuType = MenuType.VIEW,
        view_name: str | None = None,
        view_reference: str | None = None,
        view_action_name: str | None = None,
        record_pk: PkType | None = None,
        link_url: str | None = None,
        link_target: LinkTargetType = LinkTargetType.BLANK,
        **kwargs,
    ):
        """
        Object represents schema of the service menu.

        Args:
            type (MenuType, optional): Type of the menu. Defaults to MenuType.VIEW.
            view_name (str, optional): Name of the view. Defaults to None.
            view_reference (str, optional): Reference of the view. Defaults to None.
            view_action_name (str, optional): Action name of the view. Defaults to None.
            record_pk (PkType, optional): Primary key of the object. Defaults to None.
            link_url (str, optional): URL of the link. Defaults to None.
            link_target (LinkTargetType, optional): Target of the link. Defaults to LinkTargetType.BLANK.
            name (str, optional): Name of the group. For None value unique name is generated. Defaults to None.
            label (str): Label of the group.
            icon (str, optional): Icon of the group. Defaults to None.
            priority (int, optional): Priority of the group. Defaults to MENU_GENERATOR_DEFAULT_PRIORITY.
            parent (MenuGroupSchema, optional): Parent group. Defaults to None.
        """
        super().__init__(**kwargs)
        self._type = type
        if type == MenuType.VIEW:
            self._view = ViewActionParameters(
                name=view_name,
                endpoint=ViewActionEndpointParameters(
                    reference=view_reference,
                    action_name=view_action_name,
                    record_pk=record_pk,
                ),
            )
        else:
            self._link = LinkActionParameters(url=link_url, target=link_target)


# Simplified schema for the service menu
MenuGroup = MenuGroupSchema
