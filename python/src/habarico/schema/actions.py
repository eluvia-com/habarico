from __future__ import annotations

from django.utils.translation import gettext_lazy as _

from .base import BaseSchema, schema_getter
from .menu import ActionViewChoice, LinkActionParameters, ViewActionEndpointParameters, ViewActionParameters
from .types import (
    ActionStateType,
    ActionType,
    AfterSaveType,
    ColorType,
    DialogWidthType,
    LinkTargetType,
    PkType,
    ViewModeType,
)


class GlobalResourceActionSchema(BaseSchema):

    def __init__(
        self,
        *,
        name: str,
        type: ActionType,
        is_detail: bool = False,
        show_in_detail: bool = False,
        show_in_list: bool = False,
    ):
        """
        Object represents schema of the global resource action, returned by the service schema
        endpoint (`/admin/schema`).

        Args:
            name (str): Name of the action.
            type (ActionType): Type of the action.
            is_detail (bool, optional): Detail flag. Defaults to False.
            show_in_detail (bool, optional): Show in detail flag. Defaults to False.
            show_in_list (bool, optional): Show in list flag. Defaults to False.
        """
        self._name = name
        self._type = type
        self._is_detail = is_detail
        self._show_in_detail = show_in_detail
        self._show_in_list = show_in_list


class ConfirmDialogProperties(BaseSchema):

    def __init__(self, *, title: str, message: str):
        """
        Object represents schema of the confirm dialog properties.

        Args:
            title (str): Title of the dialog.
            message (str): Message of the dialog.
        """
        self._title = title
        self._message = message


class ResourceActionEndpointParameters(BaseSchema):

    def __init__(
        self,
        *,
        method: str,
        path: str | None = None,
        reference: str | None = None,
        action_name: str | None = None,
        record_pk: PkType | None = None,
    ):
        """
        Object represents schema of the endpoint parameters.

        Args:
            method (str): Method of the endpoint.
            path (str, optional): Path of the endpoint. Defaults to None.
            reference (str, optional): Reference of the endpoint. Defaults to None.
            action_name (str, optional): Action name of the endpoint. Defaults to None.
            record_pk (PkType, optional): Primary key of the object. Defaults to None.
        """
        self._path = path
        self._method = method
        self._reference = reference
        self._action_name = action_name
        self._record_pk = record_pk


class ResourceActionParameters(BaseSchema):

    def __init__(
        self,
        *,
        data: dict | None = None,
        is_background: bool,
        endpoint: ResourceActionEndpointParameters | None = None,
    ):
        """
        Object represents schema of the resource action parameters.

        The resource reference lives on ``endpoint`` - it identifies the endpoint the action calls,
        which is where the contract and the frontend both read it from.

        Args:
            endpoint (ResourceEndpointParameters, optional): Endpoint parameters of the resource. Defaults to None.
            data (dict): Data of the resource.
            is_background (bool): Background flag.
        """
        self._endpoint = endpoint
        self._data = data
        self._is_background = is_background


class SaveActionParameters(BaseSchema):

    def __init__(
        self,
        *,
        data: dict | None = None,
        after_save: AfterSaveType | None = None,
    ):
        """
        Object represents schema of the save action parameters.

        Args:
            data (dict): Data that will be added to the object before saving.
            after_save (AfterSaveType, optional): Behaviour after a successful save.
                Possible values: ``stay``, ``prev``, ``show``, ``list``.
                When not set, the frontend uses its default behaviour. Defaults to None.
        """
        self._data = data
        self._after_save = after_save


class UploadImagesActionParameters(BaseSchema):

    def __init__(
        self,
        *,
        reference: str | None = None,
        target: str | None = None,
        accept: list[str] | None = None,
        data: dict | None = None,
        image_field: str | None = None,
    ):
        """
        Object represents schema of the upload images action parameters.

        Args:
            reference (str, optional): Resource where images will be created. Defaults to None.
            target (str, optional): Field name on the image model linking to the parent record. Defaults to None.
            accept (list[str], optional): List of accepted file types (e.g. [".png", ".jpg"]).
                When not set, the frontend uses its own default. Defaults to None.
            data (dict, optional): Additional data that will be added to each uploaded image record.
                Defaults to None.
            image_field (str, optional): Field name on the image model that holds the uploaded image file.
                When not set, the frontend uses its own default. Defaults to None.
        """
        if reference:
            self._reference = reference
        if target:
            self._target = target
        if accept:
            self._accept = accept
        if data:
            self._data = data
        if image_field:
            self._image_field = image_field


class ExportActionParameters(BaseSchema):

    def __init__(
        self,
        *,
        format: str | None = None,
        fields: list[str] | None = None,
    ):
        """
        Object represents schema of the export action parameters.

        Args:
            format (str, optional): Export format (e.g. "csv", "xlsx"). When not set, the frontend
                uses the backend default. Defaults to None.
            fields (list[str], optional): List of field names to export. When not set, the backend
                exports its default set of fields. Defaults to None.
        """
        if format:
            self._format = format
        if fields:
            self._fields = fields


class ResourceActionSchema(GlobalResourceActionSchema):

    def __init__(
        self,
        *,
        name: str,
        type: ActionType,
        is_detail: bool = False,
        show_in_detail: bool = False,
        show_in_list: bool = False,
        label: str | None = None,
        icon: str | None = None,
        color: ColorType | None = None,
        confirm_dialog_title: str | None = None,
        confirm_dialog_message: str | None = None,
        view_name: str | None = None,
        view_choices: list[ActionViewChoice] | None = None,
        view_parameters: dict[str, str] | None = None,
        view_mode: ViewModeType | None = None,
        view_dialog_width: DialogWidthType | str | None = None,
        reference: str | None = None,
        action_name: str | None = None,
        record_pk: PkType | None = None,
        link_url: str | None = None,
        link_target: LinkTargetType = LinkTargetType.BLANK,
        resource_path: str | None = None,
        resource_method: str | None = None,
        resource_data: dict | None = None,
        resource_is_background: bool = False,
    ):
        """
        Object represents schema of the action.

        Args:
            name (str): Name of the action.
            type (ActionType): Type of the action
            label (str, optional): Label of the action. Defaults to None.
            is_detail (bool, optional): Detail flag. Defaults to False.
            show_in_detail (bool, optional): Show in detail flag. Defaults to False.
            show_in_list (bool, optional): Show in list flag. Defaults to False.
            icon (str, optional): Icon of the action. Defaults to None.
            color (ColorType, optional): Color of the action. Defaults to None.
            confirm_dialog_title (str, optional): Confirm dialog title. Defaults to None.
            confirm_dialog_message (str, optional): Confirm dialog message. Defaults to None.
            view_name (str, optional): View name. Defaults to None.
            view_choices (list[ActionViewChoice], optional): View choices. Defaults to None.
            view_parameters (dict[str, str], optional): View parameters. Defaults to None.
            view_mode (ViewModeType, optional): View mode. Defaults to None.
            view_dialog_width (DialogWidthType | str, optional): Width of the dialog. Accepts MUI breakpoints
                (xs/sm/md/lg/xl) or a pixel value string (e.g. ``"800px"``). Only used when view_mode is DIALOG.
                Defaults to None.
            reference (str, optional): Reference. Defaults to None.
            action_name (str, optional): Action name for the view. Defaults to None.
            record_pk (PkType, optional): Primary key of the object. Defaults to None.
            link_url (str, optional): URL of the link. Defaults to None.
            link_target (LinkTargetType, optional): Target of the link. Defaults to LinkTargetType.BLANK.
            resource_path (str, optional): Resource path. Defaults to None.
            resource_method (str, optional): Resource method. Defaults to None.
            resource_data (dict, optional): Resource data. Defaults to None.
            resource_is_background (bool, optional): Resource is background flag. Defaults to False.
        """
        super().__init__(
            name=name,
            type=type,
            is_detail=is_detail,
            show_in_detail=show_in_detail,
            show_in_list=show_in_list,
        )
        self._icon = icon
        self._color = color
        self._label = label

        if confirm_dialog_title or confirm_dialog_message:
            self._confirm_dialog = ConfirmDialogProperties(
                title=confirm_dialog_title,
                message=confirm_dialog_message,
            )

        if type == ActionType.VIEW:
            self._view = ViewActionParameters(
                name=view_name,
                endpoint=ViewActionEndpointParameters(
                    reference=reference,
                    action_name=action_name,
                    record_pk=record_pk,
                ),
                choices=view_choices,
                mode=view_mode,
                parameters=view_parameters,
                dialog_width=view_dialog_width,
            )
        elif type == ActionType.LINK:
            self._link = LinkActionParameters(
                url=link_url,
                target=link_target,
            )
        else:
            self._resource = ResourceActionParameters(
                endpoint=ResourceActionEndpointParameters(
                    method=resource_method,
                    action_name=action_name,
                    reference=reference,
                    record_pk=record_pk,
                    path=resource_path,
                ),
                data=resource_data,
                is_background=resource_is_background,
            )


class ActionSchema(BaseSchema):

    def __init__(
        self,
        *,
        type: ActionType,
        label: str | None = None,
        icon: str | None = None,
        color: ColorType | None = None,
        is_detail: bool = False,
        confirm_dialog_title: str | None = None,
        confirm_dialog_message: str | None = None,
        view_name: str | None = None,
        view_choices: list[ActionViewChoice] | None = None,
        view_mode: ViewModeType | None = None,
        view_dialog_width: DialogWidthType | str | None = None,
        view_action_name: str | None = None,
        view_parameters: dict | None = None,
        view_keep_linked_parent: bool | None = None,
        reference: str | None = None,
        record_pk: PkType | None = None,
        link_url: str | None = None,
        link_target: LinkTargetType = LinkTargetType.BLANK,
        resource_path: str | None = None,
        resource_method: str | None = None,
        resource_data: dict | None = None,
        resource_is_background: bool = False,
        save_data: dict | None = None,
        after_save: AfterSaveType | None = None,
        target: str | None = None,
        accept: list[str] | None = None,
        upload_data: dict | None = None,
        upload_image_field: str | None = None,
        export_format: str | None = None,
        export_fields: list[str] | None = None,
    ):
        """
        Object represents schema of the action.

        Args:
            type (ActionType): Type of the action
            label (str, optional): Label of the action. Defaults to None.
            icon (str, optional): Icon of the action. Defaults to None.
            color (ColorType, optional): Color of the action. Defaults to None.
            is_detail (bool, optional): Detail flag. Defaults to False.
            confirm_dialog_title (str, optional): Confirm dialog title. Defaults to None.
            confirm_dialog_message (str, optional): Confirm dialog message. Defaults to None.
            view_name (str, optional): View name. Defaults to None.
            view_choices (list[ActionViewChoice], optional): View choices. Defaults to None.
            view_mode (ViewModeType, optional): View mode. Defaults to None.
            view_dialog_width (DialogWidthType | str, optional): Width of the dialog. Accepts MUI breakpoints
                (xs/sm/md/lg/xl) or a pixel value string (e.g. ``"800px"``). Only used when view_mode is DIALOG.
                Defaults to None (frontend uses xl).
            view_parameters (dict, optional): View parameters. Defaults to None.
            view_keep_linked_parent (bool, optional): Keep linked parent in the URL when navigating to the linked
                resource. Only used when type is ActionType.VIEW. Defaults to None.
            reference (str, optional): Reference resource. For VIEW: the resource to navigate to.
                For RESOURCE: the resource to call the action on. For UPLOAD_IMAGES: the resource
                where images will be created. Defaults to None.
            record_pk (PkType, optional): Primary key of the object. Defaults to None.
            link_url (str, optional): URL of the link. Defaults to None.
            link_target (LinkTargetType, optional): Target of the link. Defaults to LinkTargetType.BLANK.
            resource_path (str, optional): Resource path. Defaults to None.
            resource_method (str, optional): Resource method. Defaults to None.
            resource_data (dict, optional): Resource data. Defaults to None.
            resource_is_background (bool, optional): Resource is background flag. Defaults to False.
            save_data (dict, optional): Data that will be added to the object before saving. Defaults to None.
            after_save (AfterSaveType, optional): Behaviour after a successful save.
                Possible values: ``stay``, ``prev``, ``show``, ``list``.
                Only used when type is ActionType.SAVE. Defaults to None.
            target (str, optional): Field name on the child model linking to the parent record.
                Used for UPLOAD_IMAGES to link created images to the current record. Defaults to None.
            accept (list[str], optional): List of accepted file types (e.g. [".png", ".jpg"]).
                Used for UPLOAD_IMAGES. When not set, the frontend uses its own default. Defaults to None.
            upload_data (dict, optional): Additional data that will be added to each uploaded image record.
                Used for UPLOAD_IMAGES. Defaults to None.
            upload_image_field (str, optional): Field name on the image model that holds the uploaded image file.
                Used for UPLOAD_IMAGES. When not set, the frontend uses its own default. Defaults to None.
            export_format (str, optional): Export format (e.g. "csv", "xlsx"). Used for EXPORT.
                When not set, the backend default format is used. Defaults to None.
            export_fields (list[str], optional): List of field names to export. Used for EXPORT.
                When not set, the backend exports its default set of fields. Defaults to None.
        """
        self._type = type
        self._is_detail = is_detail
        self._icon = icon
        self._color = color
        self._label = label

        if confirm_dialog_title or confirm_dialog_message:
            self._confirm_dialog = ConfirmDialogProperties(
                title=confirm_dialog_title,
                message=confirm_dialog_message,
            )

        if type == ActionType.VIEW:
            self._view = ViewActionParameters(
                name=view_name,
                endpoint=ViewActionEndpointParameters(
                    reference=reference,
                    record_pk=record_pk,
                    action_name=view_action_name,
                ),
                choices=view_choices,
                mode=view_mode,
                parameters=view_parameters,
                dialog_width=view_dialog_width,
                keep_linked_parent=view_keep_linked_parent,
            )
        elif type == ActionType.LINK:
            self._link = LinkActionParameters(
                url=link_url,
                target=link_target,
            )
        elif type == ActionType.SAVE:
            self._save = SaveActionParameters(
                data=save_data,
                after_save=after_save,
            )
        elif type == ActionType.UPLOAD_IMAGES:
            if reference or target or accept or upload_data or upload_image_field:
                self._upload_images = UploadImagesActionParameters(
                    reference=reference,
                    target=target,
                    accept=accept,
                    data=upload_data,
                    image_field=upload_image_field,
                )
        elif type == ActionType.EXPORT:
            if export_format or export_fields:
                self._export = ExportActionParameters(
                    format=export_format,
                    fields=export_fields,
                )
        else:
            self._resource = ResourceActionParameters(
                endpoint=ResourceActionEndpointParameters(
                    method=resource_method,
                    reference=reference,
                    record_pk=record_pk,
                    path=resource_path,
                ),
                data=resource_data,
                is_background=resource_is_background,
            )


class ViewActionDescriptorParameters(BaseSchema):

    def __init__(
        self,
        *,
        mode: ViewModeType | None = None,
        choices: list[ActionViewChoice] | None = None,
        dialog_width: DialogWidthType | str | None = None,
        parameters: dict[str, str] | None = None,
        keep_linked_parent: bool | None = None,
    ):
        """| None = None
        Object represents schema of the view action descriptor parameters.

        Args:
            mode (ViewModeType, optional): Mode of the view.
            choices (list[ActionViewChoice], optional): Choices of the view. Defaults to None.
            dialog_width (DialogWidthType | str, optional): Width of the dialog, used only when mode is
                ``dialog``. Defaults to None.
            parameters (dict[str, str], optional): Additional parameters for the view. Defaults to None.
            keep_linked_parent (bool, optional): Keep linked parent in the URL when navigating to the linked
                resource. Defaults to None.
        """
        self._mode = mode
        self._choices = choices
        self._dialog_width = dialog_width
        self._parameters = parameters
        self._keep_linked_parent = keep_linked_parent


class ActionDescriptor(BaseSchema):

    def __init__(
        self,
        *,
        name: str,
        label: str | None = None,
        icon: str | None = None,
        color: ColorType | None = None,
        action: ActionSchema | None = None,
        menu_items: list[ActionDescriptor] | list[str] | None = None,
        view_mode: ViewModeType | None = None,
        view_dialog_width: DialogWidthType | str | None = None,
        view_parameters: dict[str, str] | None = None,
        view_choices: list[ActionViewChoice] | None = None,
        view_keep_linked_parent: bool | None = None,
    ):
        """
        Object represents schema of the action descriptor.

        Args:
            name (str): Name of the action.
            label (str, optional): Label of the action. Defaults to None.
            icon (str, optional): Icon of the action. Defaults to None.
            color (ColorType, optional): Color of the action. Defaults to None.
            action (ActionSchema, optional): Action of the action. Defaults to None.
            menu_items (list[ActionDescriptor] | list[str], optional): Menu items of the action. Defaults to None.
            view_mode (ViewModeType, optional): View mode. Defaults to None.
            view_dialog_width (DialogWidthType | str, optional): Width of the dialog, used only when
                ``view_mode`` is ``dialog``. Defaults to None.
            view_choices (list[ActionViewChoice], optional): View choices. Defaults
            view_parameters (dict[str, str], optional): View parameters. Defaults to None.
            view_keep_linked_parent (bool, optional): Keep linked parent in the URL when navigating to the linked
                resource. Defaults to None.
        """
        self._name = name
        self._label = label
        self._icon = icon
        self._color = color
        self._action = action
        self._menu_items = generate_actions_descriptor(menu_items)
        self.__view_kwargs = dict(
            mode=view_mode,
            choices=view_choices,
            dialog_width=view_dialog_width,
            parameters=view_parameters,
            keep_linked_parent=view_keep_linked_parent,
        )

    def _get_view_kwargs(self) -> dict:
        """Constructor kwargs for the descriptor view params. Override to make them context-dependent."""
        return self.__view_kwargs

    @schema_getter
    def get_view(self) -> ViewActionDescriptorParameters | None:
        kwargs = self._get_view_kwargs()
        if all(v is None for v in kwargs.values()):
            return None
        return ViewActionDescriptorParameters(**kwargs)


class ActionResult(BaseSchema):

    def __init__(self, *, message: str, state: ActionStateType | None = None, post_action: ActionSchema | None = None):
        """
        Object represents schema of the action result.

        Args:
            message (str): Message of the action.
            state (ActionStateType, optional): State of the action. Defaults to None.
        """
        self._message = message
        self._state = state
        self._post_action = post_action


# Simplified name for easy usage
Action = ActionDescriptor

Actions = list[ActionDescriptor | str]
ActionsDescriptor = list[ActionDescriptor]


def generate_actions_descriptor(actions: Actions | None) -> ActionsDescriptor | None:
    """
    Generate actions descriptor from actions.

    Args:
        actions (Actions): Actions. Can be list of strings or list of ActionDescriptor or combination of both.

    Returns:
        ActionsDescriptor: Actions descriptor.
    """
    if actions is None:
        return None

    actions_descriptor = []
    for action in actions:
        if isinstance(action, Action):
            actions_descriptor.append(action)
        else:
            actions_descriptor.append(Action(name=action))
    return actions_descriptor


def generate_action_descriptor(action: "ActionDescriptor | str | None") -> "ActionDescriptor | None":
    """
    Normalize a single action into an action descriptor.

    Args:
        action (ActionDescriptor | str | None): An action descriptor or a plain action name.

    Returns:
        ActionDescriptor | None: The action descriptor, or None when no action is given.
    """
    if action is None:
        return None
    if isinstance(action, Action):
        return action
    return Action(name=action)


def get_action_name(action: "ActionDescriptor | str") -> str | None:
    """
    Get the name of an entry of an actions slot.

    Args:
        action (ActionDescriptor | str): Entry of an actions slot (``list_actions``,
            ``toolbar_actions``, ...) - either a plain action name or a descriptor.

    Returns:
        str | None: Name of the action, or None when the descriptor does not carry one.
    """
    return action if isinstance(action, str) else getattr(action, "_name", None)


class SaveActionDescriptor(ActionDescriptor):

    name = "save"
    label = _("Save")
    color = ColorType.PRIMARY
    icon = "Check"
    data = None

    def __init__(
        self,
        *,
        name: str | None = None,
        label: str | None = None,
        icon: str | None = None,
        color: ColorType | None = None,
        data: dict | None = None,
        after_save: AfterSaveType | None = None,
    ):
        """
        Object represents schema of the save action descriptor.

        Args:
            name (str, optional): Name of the action. Defaults to 'save'.
            label (str, optional): Label of the action. Defaults to 'Save'.
            icon (str, optional): Icon of the action. Defaults to 'Check'
            data (dict, optional): Data that will be added to the object before saving. Defaults to None.
            after_save (AfterSaveType, optional): Behaviour after a successful save.
                Possible values: ``stay``, ``prev``, ``show``, ``list``.
                When not set, the frontend uses its default behaviour. Defaults to None.
        """
        super().__init__(
            name=name or self.name,
            label=label or self.label,
            color=color or self.color,
            icon=icon or self.icon,
            action=ActionSchema(
                type=ActionType.SAVE,
                save_data=data or self.data,
                after_save=after_save,
            ),
        )

    def can_render(self) -> bool:
        return not self.context.read_only


class UploadImagesActionDescriptor(ActionDescriptor):

    name = "upload-images"
    label = _("Upload images")
    icon = "AddPhotoAlternate"

    def __init__(
        self,
        *,
        name: str | None = None,
        label: str | None = None,
        icon: str | None = None,
        color: ColorType | None = None,
        reference: str | None = None,
        target: str | None = None,
        accept: list[str] | None = None,
        data: dict | None = None,
        image_field: str | None = None,
    ):
        """
        Object represents schema of the upload images action descriptor.

        Args:
            name (str, optional): Name of the action. Defaults to 'upload-images'.
            label (str, optional): Label of the action. Defaults to 'Upload images'.
            icon (str, optional): Icon of the action. Defaults to 'AddPhotoAlternate'.
            color (ColorType, optional): Color of the action. When not set, the button inherits
                its color from the toolbar context. Defaults to None.
            reference (str, optional): Resource where images will be created. When set, the button
                uploads to this resource instead of the current resource context. Defaults to None.
            target (str, optional): Field name on the image model linking to the parent record.
                When set together with reference, the current record's ID is used as the target value.
                Defaults to None.
            accept (list[str], optional): List of accepted file types (e.g. [".png", ".jpg"]).
                When not set, the frontend uses its own default (.png,.jpg,.jpeg,.bmp,.gif).
                Defaults to None.
            data (dict, optional): Additional data that will be added to each uploaded image record.
                Defaults to None.
            image_field (str, optional): Field name on the image model that holds the uploaded image file.
                When not set, the frontend uses its own default. Defaults to None.
        """
        super().__init__(
            name=name or self.name,
            label=label or self.label,
            color=color,
            icon=icon or self.icon,
            action=ActionSchema(
                type=ActionType.UPLOAD_IMAGES,
                reference=reference,
                target=target,
                accept=accept,
                upload_data=data,
                upload_image_field=image_field,
            ),
        )


class ExportActionDescriptor(ActionDescriptor):

    name = "export"
    label = _("Export")
    icon = "GetApp"

    def __init__(
        self,
        *,
        name: str | None = None,
        label: str | None = None,
        icon: str | None = None,
        color: ColorType | None = None,
        format: str | None = None,
        fields: list[str] | None = None,
    ):
        """
        Object represents schema of the export action descriptor.

        Args:
            name (str, optional): Name of the action. Defaults to 'export'.
            label (str, optional): Label of the action. Defaults to 'Export'.
            icon (str, optional): Icon of the action. Defaults to 'GetApp'.
            color (ColorType, optional): Color of the action. When not set, the button inherits
                its color from the surrounding context. Defaults to None.
            format (str, optional): Export format (e.g. "csv", "xlsx"). When not set, the backend
                default format is used. Defaults to None.
            fields (list[str], optional): List of field names to export. When not set, the backend
                exports its default set of fields. Defaults to None.
        """
        super().__init__(
            name=name or self.name,
            label=label or self.label,
            color=color,
            icon=icon or self.icon,
            action=ActionSchema(
                type=ActionType.EXPORT,
                export_format=format,
                export_fields=fields,
            ),
        )
