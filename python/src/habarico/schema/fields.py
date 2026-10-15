from __future__ import annotations

from typing import Any

from ..utils import build_validator_rule, merge_dicts, merge_field_schema_dicts, remove_empty
from .actions import Action, ActionSchema
from .base import BaseSchema, schema_getter
from .types import (
    ColorType,
    DialogWidthType,
    FieldFormatType,
    FieldType,
    LinkTargetType,
    SortDirectionType,
    TextAlignType,
    ValidatorRuleType,
    ViewModeType,
)


class EnumType(BaseSchema):

    def __init__(self, value: int | str, label: str, color: ColorType | None = None, icon: str | None = None):
        """
        Object represents schema of the enum type.

        Args:
            value (int | str): Value of the enum.
            label (str): Label of the enum.
            color (ColorType, optional): Color of the enum. Defaults to None.
            icon (str, optional): Icon of the enum. Defaults to None.
        """
        self._value = value
        self._label = label
        self._color = color
        self._icon = icon


class FieldSchema(BaseSchema):

    def __init__(
        self,
        *,
        name: str | None = None,
        label: str | None = None,
        short_label: str | None = None,
        help_text: str | None = None,
        type: FieldType,
        format: FieldFormatType | None = None,
        read_only: bool = False,
        write_only: bool = False,
        required: bool = False,
        sortable: bool = False,
        sort_by: str | None = None,
        nullable: bool = False,
        reference: str | None = None,
        enum: EnumType | None = None,
        default_value: Any | None = None,
        items: FieldSchema | None = None,
        properties: dict[str, FieldSchema] | None = None,
        options: dict | None = None,
        descriptor: FieldDescriptor | None = None,
    ):
        """
        Object represents schema of the resource field.

        Args:
            name (str, optional): Name of the field.
            label (str, optional): Label of the field. Defaults to None.
            short_label (str, optional): Shorter label used where space is tight, for example a list column
                                         header. Defaults to None.
            help_text (str, optional): Help text of the field. Defaults to None.
            type (FieldType): Type of the field.
            format (FieldFormatType, optional): Format of the field. Defaults to None.
            read_only (bool, optional): Read only flag. Defaults to False.
            write_only (bool, optional): Write only flag. Defaults to False.
            required (bool, optional): Required flag. Defaults to False.
            sortable (bool, optional): Sortable flag. Defaults to False.
            sort_by (str, optional): Sort by field. Defaults to None.
            nullable (bool, optional): Nullable flag. Defaults to False.
            reference (str, optional): Reference of the field. Defaults to None.
            enum (EnumType, optional): Enum of the field. Defaults to None.
            default_value (Any, optional): Default value of the field. Defaults to None.
            items (FieldSchema, optional): Subfield of th array field. Defaults to None.
            properties (dict[str, FieldSchema], optional): Subfields of the object field. Defaults to None.
            options (dict, optional): Options of the field. Defaults to None.
            descriptor (FieldDescriptor, optional): Field descriptor. Defaults to None.
        """
        self._name = name
        self._label = label
        self._short_label = short_label
        self._help_text = help_text
        self._type = type
        self._format = format
        self._read_only = read_only
        self._write_only = write_only
        self._required = required
        self._sortable = sortable
        self._sort_by = sort_by
        self._nullable = nullable
        self._reference = reference
        self._enum = enum
        self._default_value = default_value
        self._items = items
        self._properties = properties
        self._options = options
        self.__descriptor = descriptor

    def to_dict(self, **kwargs) -> dict:
        result = super().to_dict(**kwargs)

        if self.__descriptor:
            descriptor_dict = self.__descriptor.to_dict(**kwargs) or {}
            descriptor_dict.pop("type", None)
            return merge_field_schema_dicts(descriptor_dict, result)

        return result


class FilterSchema(BaseSchema):

    def __init__(
        self,
        *,
        name: str | None = None,
        label: str | None = None,
        help_text: str | None = None,
        type: FieldType,
        format: FieldFormatType | None = None,
        reference: str | None = None,
        enum: EnumType | None = None,
        default_value: Any | None = None,
        items: FieldSchema | None = None,
        properties: dict[str, FilterSchema] | None = None,
        options: dict | None = None,
        is_always_on: bool = False,
        descriptor: FilterDescriptor | None = None,
    ):
        """
        Object represents schema of the filter field.

        Args:
            name (str, optional): Name of the field.
            label (str, optional): Label of the field. Defaults to None.
            help_text (str, optional): Help text of the filter. Defaults to None.
            type (FieldType): Type of the field.
            format (FieldFormatType, optional): Format of the field. Defaults to None.
            reference (str, optional): Reference of the field. Defaults to None.
            enum (EnumType, optional): Enum of the field. Defaults to None.
            default_value (Any, optional): Default value of the field. Defaults to None.
            items (FieldSchema, optional): Subfield of th array field. Defaults to None.
            properties (dict[str, FieldSchema], optional): Subfields of the object field. Defaults to None.
            options (dict, optional): Options of the field. Defaults to None.
            is_always_on (bool, optional): If True, the filter is always displayed;
                if False, it is hidden among the background filters. Defaults to False.
            descriptor (FilterDescriptor, optional): Filter descriptor. Defaults to None.
        """
        self._name = name
        self._label = label
        self._help_text = help_text
        self._type = type
        self._format = format
        self._reference = reference
        self._enum = enum
        self._default_value = default_value
        self._items = items
        self._properties = properties
        self._options = options
        self._is_always_on = is_always_on
        self.__descriptor = descriptor

    def to_dict(self, **kwargs) -> dict:
        result = super().to_dict(**kwargs)

        if self.__descriptor:
            return merge_dicts(self.__descriptor.to_dict(**kwargs), result)

        return result

    def get_name(self):
        return self._name


class FieldWrapperProperties(BaseSchema):

    def __init__(self, *, fields: Fields, divider: str | None = None):
        """
        Object represents schema of the field wrapper properties.

        Args:
            fields (Fields): Fields of the wrapper.
            divider (str, optional): Divider of the wrapper. Defaults to None.
        """

        self._fields = generate_fieldset_descriptor(fields)
        self._divider = divider


class FieldDescriptor(BaseSchema):

    def __init__(
        self,
        *,
        name: str,
        label: str | None = None,
        short_label: str | None = None,
        help_text: str | None = None,
        sortable: bool | None = None,
        sort_by: str | None = None,
        read_only: bool | None = None,
        write_only: bool | None = None,
        default_value: Any | None = None,
        action: Action | str | ActionSchema | None = None,
        wrapper: FieldWrapperProperties | None = None,
        show_query: str | None = None,
        required_query: str | None = None,
        text_align: TextAlignType | None = None,
        prefix: str | None = None,
        postfix: str | None = None,
        relation: RelationFieldOptions | None = None,
        validators: list[ValidatorRule] | None = None,
    ):
        """
        Object represents schema of the field descriptor.

        Args:
            name (str): Name of the field.
            label (str, optional): Label of the field. Defaults to None.
            short_label (str, optional): Short label of the field. Defaults to None.
            help_text (str, optional): Help text of the field. Defaults to None.
            sortable (bool, optional): Sortable flag. Defaults to None.
            sort_by (str, optional): Sort by field. Defaults to None.
            read_only (bool, optional): Read only flag. Defaults to False.
            write_only (bool, optional): Write only flag. Defaults to False.
            default_value (Any, optional): Default value of the field. Defaults to None.
            action (Action | str | ResourceActionSchema, optional): Action of the field. Defaults to None.
            wrapper (FieldWrapperProperties, optional): Wrapper properties of the field. Defaults to None.
            show_query (str, optional): Show query. Defaults to None.
            required_query (str, optional): Required query. Defaults to None.
            text_align (TextAlignType, optional): Text alignment. Defaults to None.
            prefix (str, optional): Prefix of the field. Defaults to None.
            postfix (str, optional): Postfix of the field. Defaults to None.
            relation (RelationFieldOptions, optional): Relation options of the field. Defaults to None.
            validators (list[ValidatorRule], optional): Frontend validation rules. Values defined
                here override rules auto-extracted from the serializer field, per rule type.
                Defaults to None.
        """
        self._type = "field"
        self._name = name
        self._label = label
        self._short_label = short_label
        self._help_text = help_text
        self._sortable = sortable
        self._sort_by = sort_by
        self._read_only = read_only
        self._write_only = write_only
        self._default_value = default_value
        self._action = generate_action_descriptor_or_schema(action)
        self._wrapper = wrapper
        self.__options_kwargs = dict(
            show_query=show_query,
            required_query=required_query,
            text_align=text_align,
            prefix=prefix,
            postfix=postfix,
            relation=relation,
            validators=validators,
        )

    def _get_options_kwargs(self) -> dict:
        """Constructor kwargs for the field options. Override to make them context-dependent."""
        return self.__options_kwargs

    @schema_getter
    def get_options(self) -> FieldOptions | None:
        kwargs = self._get_options_kwargs()
        if not any(kwargs.values()):
            return None
        return FieldOptions(**kwargs)

    def get_name(self):
        return self._name

    def get_serializer_extra_kwargs(self):
        return remove_empty(
            {
                "label": self._label,
                "read_only": self._read_only,
                "write_only": self._write_only,
                "default": self._default_value,
                "help_text": self._help_text,
            }
        )

    @property
    def is_serializer_field(self):
        """
        Check if the field is a serializer field.

        Returns:
            bool: True if the field is a serializer field, False otherwise.
        """
        return self._action is None


class FieldWrapperDescriptor(FieldDescriptor):
    def __init__(
        self,
        *,
        name: str,
        label: str | None = None,
        short_label: str | None = None,
        fields: Fields,
        divider: str | None = None,
        show_query: str | None = None,
        text_align: TextAlignType | None = None,
    ):
        """
        Object represents schema of the field wrapper descriptor.

        Args:
            name (str): Name of the field.
            label (str, optional): Label of the field. Defaults to None.
            short_label (str, optional): Short label of the field. Defaults to None.
            fields (Fields): Fields of the wrapper.
            divider (str, optional): Divider of the wrapper. Defaults to None.
            show_query (str, optional): Show query. Defaults to None.
            text_align (TextAlignType, optional): Text alignment. Defaults to None.
        """
        super().__init__(
            name=name,
            label=label,
            short_label=short_label,
            wrapper=FieldWrapperProperties(fields=fields, divider=divider),
            show_query=show_query,
            text_align=text_align,
        )


class FieldActionDescriptor(FieldDescriptor):

    def __init__(
        self,
        *,
        name: str,
        label: str | None = None,
        short_label: str | None = None,
        action: Action | str | ActionSchema | str | None = None,
        show_query: str | None = None,
        text_align: TextAlignType | None = None,
    ):
        """
        Object represents schema of the field action descriptor.

        Args:
            name (str): Name of the field.
            label (str, optional): Label of the field. Defaults to None.
            short_label (str, optional): Short label of the field. Defaults to None.
            action (Action | str | ActionSchema | None): Action of the field.
            show_query (str, optional): Show query. Defaults to None.
            text_align (TextAlignType, optional): Text alignment. Defaults to None.
        """
        super().__init__(
            name=name,
            label=label,
            short_label=short_label,
            action=action or name,
            show_query=show_query,
            text_align=text_align,
        )


class KeyValue(BaseSchema):

    def __init__(self, *, key: str, value: str):
        """
        Object represents schema of the key value type.

        Args:
            key (str): Key of the key value type. Defaults to None.
            value (str): Value of the key value type. Defaults to None.
        """
        self._key = key
        self._value = value


class ChoicesFieldOptions(BaseSchema):

    def __init__(self, *, icons_key: str | None = None):
        """
        Object represents schema of the choices-specific field options.

        Args:
            icons_key (str, optional): Icons key for choices icons set. Defaults to None.
        """
        self._icons_key = icons_key


class ImageFieldOptions(BaseSchema):

    def __init__(self, *, resize_width: int | None = None, crop_aspect_ratio: str | None = None):
        """
        Object represents schema of the image-specific field options.

        Args:
            resize_width (int, optional): Resize width in pixels. Defaults to None.
            crop_aspect_ratio (str, optional): Crop aspect ratio (e.g. "16:9"). Defaults to None.
        """
        self._resize_width = resize_width
        self._crop_aspect_ratio = crop_aspect_ratio


class AiFieldOptions(BaseSchema):

    def __init__(self, *, source_fields: list[str] | None = None):
        """
        Object represents schema of the AI-specific field options.

        Args:
            source_fields (list[str], optional): Fields used as context for AI prediction. Defaults to None.
        """
        self._source_fields = source_fields


class ValidatorRule(BaseSchema):
    """
    Base class for a single frontend validation rule enforced before submit.

    Serializes to a `ValidatorRule` object — a `{type, value, message}` triple (see
    `ValidatorRuleType`). `message` is optional and, when omitted, the frontend falls back to a
    generic default message; a rule whose `value` is None is dropped entirely, so a message given
    without a value never produces a dangling rule.

    Validators are passed as a list to `Field`/`FieldOptions`, e.g.
    `validators=[MaxLengthValidatorRule(100), RegexValidatorRule(r"^[A-Z]+$")]`. The rules defined
    here take precedence, per rule `type`, over rules auto-extracted from the serializer field, but
    they do not replace backend validation — the same rules are still enforced server-side.

    Subclass this (or instantiate it directly with an explicit `type`) to add a custom validator.
    A custom `type` is only enforced on the frontend once the frontend knows how to map it to a
    validator; unknown types are ignored client-side and left to backend validation.
    """

    #: Wire identifier of the rule, set by each subclass (see `ValidatorRuleType`).
    type: ValidatorRuleType | str | None = None

    def __init__(self, value: Any, message: str | None = None, *, type: ValidatorRuleType | str | None = None):
        """
        Args:
            value (Any): The constraint the rule enforces (e.g. a max length or a regex pattern).
                         A None value drops the rule entirely.
            message (str, optional): Error message shown when the rule is violated. Defaults to None.
            type (ValidatorRuleType | str, optional): Overrides the class-level rule `type` to build
                                                      an ad-hoc custom rule without declaring a
                                                      subclass. Defaults to None.
        """
        rule_type = type if type is not None else self.type
        if rule_type is None:
            raise ValueError(f"{self.__class__.__name__} has no rule `type`; set it on a subclass or pass `type=`.")
        self._type = rule_type
        self._value = value
        self._message = message

    def to_dict(self, **kwargs) -> dict | None:
        self.setup(**kwargs)
        return build_validator_rule(self._type, self._value, self._message)


class MaxLengthValidatorRule(ValidatorRule):
    """Maximum length of the value (`max_length`)."""

    type = ValidatorRuleType.MAX_LENGTH


class MinLengthValidatorRule(ValidatorRule):
    """Minimum length of the value (`min_length`)."""

    type = ValidatorRuleType.MIN_LENGTH


class MaxValueValidatorRule(ValidatorRule):
    """Maximum numeric value (`max_value`)."""

    type = ValidatorRuleType.MAX_VALUE


class MinValueValidatorRule(ValidatorRule):
    """Minimum numeric value (`min_value`)."""

    type = ValidatorRuleType.MIN_VALUE


class RegexValidatorRule(ValidatorRule):
    """JavaScript-compatible regular expression the value must match (`regex`)."""

    type = ValidatorRuleType.REGEX


class RelationFieldOptions(BaseSchema):

    def __init__(
        self,
        *,
        filters: list[KeyValue] | None = None,
        sort: SortDescriptor | None = None,
        show_link: bool | None = None,
        link_mode: ViewModeType | None = None,
        dialog_width: DialogWidthType | str | None = None,
        keep_linked_parent: bool | None = None,
        show_edit_button: bool | None = None,
        show_create_button: bool | None = None,
        preserve_order: bool | None = None,
        parent: str | None = None,
    ):
        """
        Object represents schema of the relation options.

        Args:
            filters (list[KeyValue], optional): Filters of the relation. Defaults to None.
            sort (SortDescriptor, optional): Sorting of the relation. Defaults to None.
            show_link (bool, optional): Show link flag. Defaults to None.
            link_mode (ViewModeType, optional): Link mode of the relation. Defaults to None.
            dialog_width (DialogWidthType, optional): Width of the dialog, used only when ``link_mode`` is
                                                      ``dialog``. Defaults to None.
            keep_linked_parent (bool, optional): Keep linked parent flag. Defaults to None.
            show_edit_button (bool, optional): Show edit button flag. Defaults to None.
            show_create_button (bool, optional): Show create button flag. Defaults to None.
            preserve_order (bool, optional):  Preserve order of the values in relation field according to the order of
                                              the values in the source field. Default value is `true` if sort is not
                                              set, otherwise default value is `false`.
            parent (str, optional): Parent field name for tree-relation fields. Defaults to None.
        """
        self._filters = filters
        self._sort = sort
        self._show_link = show_link
        self._link_mode = link_mode
        self._dialog_width = dialog_width
        self._keep_linked_parent = keep_linked_parent
        self._show_edit_button = show_edit_button
        self._show_create_button = show_create_button
        self._preserve_order = preserve_order if preserve_order is not None else (sort is None)
        self._parent = parent


class NumberFieldOptions(BaseSchema):

    def __init__(
        self,
        *,
        style: str | None = None,
        currency: str | None = None,
        unit: str | None = None,
        minimum_fraction_digits: int | None = None,
        maximum_fraction_digits: int | None = None,
    ):
        """
        ``Intl.NumberFormat`` options used for number formatting.

        Args:
            style (str, optional): Number format style, ``currency`` or ``unit``. Defaults to None.
            currency (str, optional): Currency code used for the currency style. Defaults to None.
            unit (str, optional): Unit code used for the unit style. Defaults to None.
            minimum_fraction_digits (int, optional): Minimum number of fraction digits. Defaults to None.
            maximum_fraction_digits (int, optional): Maximum number of fraction digits. Defaults to None.
        """
        self._style = style
        self._currency = currency
        self._unit = unit
        self._minimum_fraction_digits = minimum_fraction_digits
        self._maximum_fraction_digits = maximum_fraction_digits


class PhoneFieldOptions(BaseSchema):

    def __init__(self, *, default_region: str | None = None, allowed_regions: list[str] | None = None):
        """
        Options of a phone number field.

        Args:
            default_region (str, optional): Region assumed for numbers written without a prefix. Defaults to None.
            allowed_regions (list[str], optional): Regions the input offers. Defaults to None.
        """
        self._default_region = default_region
        self._allowed_regions = allowed_regions


class UploadFieldOptions(BaseSchema):

    def __init__(
        self,
        *,
        provider: str | None = None,
        threshold: int | None = None,
        chunk_size: int | None = None,
        min_chunk_size: int | None = None,
        initiate_url: str | None = None,
        endpoint: str | None = None,
    ):
        """
        Options of a chunk-uploaded file field.

        Args:
            provider (str, optional): Upload provider handling the transfer. Defaults to None.
            threshold (int, optional): File size from which chunked upload is used. Defaults to None.
            chunk_size (int, optional): Size of a single chunk. Defaults to None.
            min_chunk_size (int, optional): Smallest chunk the provider accepts. Defaults to None.
            initiate_url (str, optional): URL that starts the upload. Defaults to None.
            endpoint (str, optional): Endpoint the chunks are sent to. Defaults to None.
        """
        self._provider = provider
        self._threshold = threshold
        self._chunk_size = chunk_size
        self._min_chunk_size = min_chunk_size
        self._initiate_url = initiate_url
        self._endpoint = endpoint


class FieldOptions(BaseSchema):

    def __init__(
        self,
        *,
        choices: ChoicesFieldOptions | None = None,
        image: ImageFieldOptions | None = None,
        ai: AiFieldOptions | None = None,
        show_query: str | None = None,
        required_query: str | None = None,
        text_align: TextAlignType | None = None,
        prefix: str | None = None,
        postfix: str | None = None,
        relation: RelationFieldOptions | None = None,
        number: NumberFieldOptions | None = None,
        phone: PhoneFieldOptions | None = None,
        upload: UploadFieldOptions | None = None,
        target: LinkTargetType | str | None = None,
        validators: list[ValidatorRule] | None = None,
    ):
        """
        Object represents schema of the field descriptor options.

        Args:
            choices (ChoicesFieldOptions, optional): Choices-specific options. Defaults to None.
            image (ImageFieldOptions, optional): Image-specific options. Defaults to None.
            ai (AiFieldOptions, optional): AI-specific options. Defaults to None.
            show_query (str, optional): Show query. Defaults to None.
            required_query (str, optional): Required query. Defaults to None.
            text_align (TextAlignType, optional): Text alignment. Defaults to None.
            prefix (str, optional): Prefix of the field. Defaults to None.
            postfix (str, optional): Postfix of the field. Defaults to None.
            relation (RelationFieldOptions, optional): Relation options of the field. Defaults to None.
            number (NumberFieldOptions, optional): Number formatting options of the field. Defaults to None.
            phone (PhoneFieldOptions, optional): Phone number options of the field. Defaults to None.
            upload (UploadFieldOptions, optional): Chunked upload options of the field. Defaults to None.
            target (LinkTargetType, optional): Where the file link opens. The value is stored without the
                leading underscore (`blank`, not `_blank`); the client prepends it when rendering.
                Defaults to None.
            validators (list[ValidatorRule], optional): Frontend validation rules, serialized as a
                list of `ValidatorRule` objects. Defaults to None.
        """
        self._choices = choices
        self._image = image
        self._ai = ai
        self._relation = relation
        self._number = number
        self._phone = phone
        self._upload = upload
        self._text_align = text_align
        self._prefix = prefix
        self._postfix = postfix
        self._target = target
        self._validators = validators
        if show_query or required_query:
            self._dynamic_render = {"show_query": show_query, "required_query": required_query}

    def get_validators(self) -> list[dict] | None:
        # Serialize the validator list here so rules that drop to None (e.g. a message given
        # without a value) are pruned and an all-empty list never surfaces as `validators: []`.
        rules = [rule for validator in (self._validators or []) if (rule := validator.to_dict(context=self.context))]
        return rules or None


class FilterDescriptor(BaseSchema):

    def __init__(
        self,
        *,
        name: str,
        label: str | None = None,
        help_text: str | None = None,
        is_always_on: bool | None = None,
        default_value: Any | None = None,
        prefix: str | None = None,
        postfix: str | None = None,
        relation: RelationFieldOptions | None = None,
    ):
        """
        Object represents schema of the filter descriptor.

        Args:
            name (str): Name of the filter.
            label (str, optional): Label of the filter. Defaults to None.
            help_text (str, optional): Help text of the filter. Defaults to None.
            is_always_on (bool, optional): If True, the filter is always displayed;
                if False, it is hidden among the background filters. Defaults to None.
            default_value (Any, optional): Default value of the filter. Defaults to None.
            prefix (str, optional): Prefix of the filter. Defaults to None.
            postfix (str, optional): Postfix of the filter. Defaults to None.
            relation (RelationFieldOptions, optional): Relation options of the filter. Defaults to None.
        """
        self._name = name
        self._label = label
        self._help_text = help_text
        self._is_always_on = is_always_on
        self._default_value = default_value
        self.__options_kwargs = dict(prefix=prefix, postfix=postfix, relation=relation)

    def _get_options_kwargs(self) -> dict:
        """Constructor kwargs for the filter options. Override to make them context-dependent."""
        return self.__options_kwargs

    @schema_getter
    def get_options(self) -> FieldOptions | None:
        kwargs = self._get_options_kwargs()
        if not any(kwargs.values()):
            return None
        return FieldOptions(**kwargs)

    def get_name(self):
        return self._name


class FilterDescriptorOptions(BaseSchema):

    def __init__(
        self,
        *,
        prefix: str | None = None,
        postfix: str | None = None,
    ):
        """
        Object represents schema of the filter descriptor options.

        Args:
            prefix (str, optional): Prefix of the field. Defaults to None.
            postfix (str, optional): Postfix of the field. Defaults to None.
        """
        self._prefix = prefix
        self._postfix = postfix


class SortDescriptor(BaseSchema):

    def __init__(self, *, field_name: str, direction: SortDirectionType):
        """
        Object represents schema of the sorting descriptor.

        Args:
            field_name (str): Name of the field.
            direction (SortDirectionType): Direction of the sorting.
        """
        self._field_name = field_name
        self._direction = direction


# Simplified names of the classes for easier usage
Field = FieldDescriptor
Filter = FilterDescriptor
Sorting = SortDescriptor
FieldAction = FieldActionDescriptor
FieldWrapper = FieldWrapperDescriptor

FieldsetDescriptor = list[Field]
FiltersDescriptor = list[Filter]

Fieldset = list[str | Field]
Fields = list[str | Field]
Filters = list[str | Filter]
SortingOrStr = Sorting | str


def generate_fieldset_descriptor(fieldset: Fieldset | None) -> FieldsetDescriptor | None:
    """
    Generate fieldset descriptor from fieldset.

    Args:
        fieldset (Fieldset): Fieldset. Can be list of strings or list of Field or combination of both.

    Returns:
        FieldsetDescriptor: Fieldset descriptor.
    """

    if fieldset is None:
        return None

    fieldset_descriptor = []
    for field in fieldset:
        if isinstance(field, Field):
            fieldset_descriptor.append(field)
        elif isinstance(field, str):
            fieldset_descriptor.append(Field(name=field))
    return fieldset_descriptor


def generate_filters_descriptor(filters: Filters) -> FiltersDescriptor | None:
    """
    Generate filters descriptor from filters.

    Args:
        filters (Filters): Filters. Can be list of strings or list of Filter or combination of both.

    Returns:
        FiltersDescriptor: Filters descriptor
    """

    if filters is None:
        return None

    filters_descriptor = []
    for filter in filters:
        if isinstance(filter, Filter):
            filters_descriptor.append(filter)
        else:
            filters_descriptor.append(Filter(name=filter))
    return filters_descriptor


def generate_sorting_descriptor(sorting: Sorting | str) -> Sorting | None:
    """
    Generate sorting descriptor from sorting.

    Args:
        sorting (Sorting | str): Sorting. Can be Sorting or string.

    Returns:
        Sorting: Sorting descriptor.
    """

    if not sorting:
        return None

    if isinstance(sorting, Sorting):
        return sorting

    return Sorting(
        field_name=sorting[1:] if sorting.startswith("-") else sorting,
        direction=SortDirectionType.DESC if sorting.startswith("-") else SortDirectionType.ASC,
    )


def generate_action_descriptor_or_schema(
    action: Action | str | ActionSchema | None,
) -> Action | ActionSchema | None:
    """
    Generate actions descriptor from actions.

    Args:
        action (Action | str | ActionSchema | None): Actions. Can be strings,
         ActionDescriptor or ActionSchema.

    Returns:
        Action | ActionSchema | None: Action descriptor.
    """
    if action is None:
        return None

    if isinstance(action, (Action, ActionSchema)):
        return action
    else:
        return Action(name=action)
