from enum import Enum


class ColorType(str, Enum):
    PRIMARY = "primary"
    SECONDARY = "secondary"
    SUCCESS = "success"
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"
    INHERIT = "inherit"


class FieldType(str, Enum):
    STRING = "string"
    NUMBER = "number"
    INTEGER = "integer"
    BOOLEAN = "boolean"
    ARRAY = "array"
    OBJECT = "object"


class FieldFormatType(str, Enum):
    DATE = "date"
    DATETIME = "date-time"
    TIME = "time"
    TEXT = "text"
    RICH_TEXT = "rich-text"
    EMAIL = "email"
    URL = "url"
    PASSWORD = "password"
    IMAGE = "base64-image"
    FILE = "base64-file"
    UUID = "uuid"
    RELATION = "relation"
    CHOICES = "choices"
    SEARCH = "search"
    AI = "ai"
    AI_TEXT = "ai-text"
    DECIMAL = "decimal"
    RANGE = "range"


class BoxType(str, Enum):
    TAB = "tab"
    TAB_ITEM = "tab-item"
    WIZARD = "wizard"
    SIMPLE = "simple"
    LIST = "list"
    OBJECT = "object"
    ARRAY = "array"
    GRID = "grid"
    GRID_ITEM = "grid-item"
    GALLERY = "gallery"


class ActionStateType(str, Enum):
    RUNNING = "running"
    SUCCESS = "success"
    ERROR = "error"


class AfterSaveType(str, Enum):
    STAY = "stay"
    PREV = "prev"
    SHOW = "show"
    LIST = "list"


class RequestMethodType(str, Enum):
    GET = "get"
    POST = "post"
    PUT = "put"
    PATCH = "patch"
    DELETE = "delete"


class SortDirectionType(str, Enum):
    ASC = "asc"
    DESC = "desc"


class ViewType(str, Enum):
    CREATE = "create"
    EDIT = "edit"
    SHOW = "show"
    LIST = "list"
    ACTION = "action"


class ViewModeType(str, Enum):
    REDIRECT = "redirect"
    DIALOG = "dialog"
    SIDEPANEL = "sidepanel"


class DialogWidthType(str, Enum):
    XS = "xs"
    SM = "sm"
    MD = "md"
    LG = "lg"
    XL = "xl"


class ActionType(str, Enum):
    VIEW = "view"
    LINK = "link"
    RESOURCE = "resource"
    SAVE = "save"
    AI_ASSISTANT = "ai-assistant"
    UPLOAD_FILES = "upload-files"
    EXPORT = "export"


class MenuType(str, Enum):
    VIEW = "view"
    LINK = "link"
    TEXT = "text"


class TextAlignType(str, Enum):
    LEFT = "left"
    CENTER = "center"
    RIGHT = "right"


class LinkTargetType(str, Enum):
    SELF = "self"
    BLANK = "blank"


class ValidatorRuleType(str, Enum):
    MAX_LENGTH = "max_length"
    MIN_LENGTH = "min_length"
    MAX_VALUE = "max_value"
    MIN_VALUE = "min_value"
    REGEX = "regex"


PkType = str | int
