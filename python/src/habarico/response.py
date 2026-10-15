from rest_framework.response import Response

from .schema.actions import ActionSchema
from .schema.types import ActionStateType
from .utils import remove_empty


class ActionResponse(Response):

    def __init__(
        self,
        *,
        message: str = None,
        state: ActionStateType | None = None,
        action: ActionSchema | None = None,
        data: dict | None = None,
    ):
        """
        A DRF response for an action.

        Args:
            message (str): The message to display.
            state (ActionStateType): The state of the action.
            action (ActionSchema): The action to perform after the current action.
            data (dict): Additional data to include in the response.
        """

        meta = {
            "message": message,
            "state": state,
            "trigger_action": action.to_dict() if action else None,
        }
        super().__init__(
            {
                "meta": remove_empty(meta),
                **(data if data else {}),
            }
        )
