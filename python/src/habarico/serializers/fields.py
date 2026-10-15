from collections.abc import Callable
from urllib.parse import quote_plus

from eluvia_base_django.rest_framework.serializers import Base64FileSerializer, Base64ImageFileSerializer
from habarico.settings import admin_api_settings
from habarico.utils import LOOKUP_SEP
from rest_framework import serializers

# Extra bases for the file field classes below, from DEFAULT_FILE_FIELD_MIXIN_CLASS
# (habarico.settings) - empty unless an extension contributes one. Read at import time because it
# goes into a class definition; a project therefore sets it in settings.py, not at runtime.
_file_field_mixin = admin_api_settings.DEFAULT_FILE_FIELD_MIXIN_CLASS
_file_field_bases = (_file_field_mixin,) if _file_field_mixin is not None else ()


class AdminOptionsFieldMixin:
    """
    Mixin to add options field to the serializer field. It is used to generate field options in the schema.
    """

    def __init__(
        self, options: dict | None = None, show_query: str | None = None, required_query: str | None = None, **kwargs
    ):
        super().__init__(**kwargs)
        self.options = options or {}
        if show_query or required_query:
            self.options["dynamic_render"] = {"show_query": show_query, "required_query": required_query}

    def get_options(self) -> dict:
        return self.options


class AdminRelatedFieldMixin(AdminOptionsFieldMixin):
    """
    Mixin to add reference field to the serializer field. It is used to generate the reference for the related fields.

    :param filters: dictionary with filters that will be used to filter the related field.

    """

    def __init__(
        self,
        *args,
        reference: str = None,
        options: dict | None = None,
        filters: dict | Callable | None = None,
        **kwargs,
    ):
        self.options = options or {}
        self._filters = filters
        super().__init__(*args, options=options, **kwargs)
        self.reference = reference

    def get_options(self) -> dict:
        options = dict(self.options)
        relation_options = options["relation"] = self.options.get("relation", {})
        request = self.context.get("request")
        if "filters" not in relation_options:
            if self._filters:
                filters = self._filters
                if callable(filters):
                    filters = filters(request)
                if filters:
                    relation_options["filters"] = [dict(name=name, value=value) for name, value in filters.items()]
        return options

    def set_filters(self, filters: dict):
        """
        Add a filter to the options.
        """
        relation_options = self.options.get("relation", {})
        self.options["relation"] = relation_options
        relation_options["filters"] = []
        for k, v in filters.items():
            self.add_filter(k, v)

    def add_filter(self, name: str, value: str):
        """
        Add a filter to the options.
        """
        relation_options = self.options.get("relation", {})
        self.options["relation"] = relation_options
        if "filters" not in relation_options:
            relation_options["filters"] = []
        relation_options["filters"].append(dict(name=name, value=value))


class AdminFormatFieldMixin:
    """
    Mixin to add format field to the serializer field. It is used to generate field format in the schema.
    """

    def __init__(self, *args, format: str | None = None, **kwargs):
        super().__init__(*args, **kwargs)
        self.format = format


class AdminUUIDRelatedField(AdminRelatedFieldMixin, serializers.UUIDField):
    """
    Custom UUID related field for admin. It can be used to create a reference to admin of another service.
    """


class AdminRelatedField(AdminRelatedFieldMixin, serializers.CharField):
    """
    Custom related field for admin. It is used to generate the related field in the react admin.
    """


class AdminPrimaryKeyRelatedField(AdminRelatedFieldMixin, serializers.PrimaryKeyRelatedField):
    """
    Custom primary key related field for admin.
    You can set filter that react admin will use to filter the related field.
    _reverse_field filter will be added to the options if filters value is empty.
    It will filter objects according to method get_queryset of this field
    (django model limit_choices_to will be filtered as well).
    """

    def _get_full_field_name(self) -> str:
        parent = self.parent
        parent_field_names = []
        while parent is not None and parent.field_name is not None:
            parent_field_names.append(parent.field_name)
            parent = parent.parent

        field_names = list(reversed(parent_field_names))
        if self.field_name:
            field_names.append(self.field_name)
        return LOOKUP_SEP.join(field_names)

    def get_options(self) -> dict:
        options = dict(self.options)
        relation_options = options.get("relation", {})
        options["relation"] = relation_options

        request = self.context.get("request")
        if "filters" not in relation_options and request is not None and self.reference and "/" not in self.reference:
            relation_options["filters"] = [
                dict(
                    name="_reverse_field",
                    value=":".join(
                        (request.method.lower(), quote_plus(request.get_full_path()), self._get_full_field_name())
                    ),
                )
            ]
        return options


class TextField(AdminFormatFieldMixin, serializers.CharField):
    """
    Custom text field for admin. It is used to generate the text field in the react admin.
    The textarea will be used in the admin.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, format="text", **kwargs)


class RichTextField(AdminFormatFieldMixin, serializers.CharField):
    """
    Custom rich text field for admin. It is used to generate the rich text field (with wysiwyg editor)
    in the react admin.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, format="rich-text", **kwargs)


class AdminFileOptionsFieldMixin(AdminOptionsFieldMixin):
    """
    Adds ``max_size`` / ``accept`` to a file/image field's schema options, derived from its own
    declared validators (HAB-965 / HAB-966): ``max_size`` from
    :class:`habarico.validators.MaxFileSizeValidator`, ``accept`` from Django's
    ``validate_image_file_extension`` (-> ``image/*``) or a ``FileExtensionValidator`` (-> concrete
    types guessed from its allowed extensions). Neither key is emitted when it cannot be derived,
    and an explicitly passed ``options={"max_size": ...}`` always wins over the derived one.

    Backend validation is unchanged and unconditional either way - this only lets the frontend
    reject a file that would be refused on save before the request is even sent.
    """

    def get_options(self) -> dict:
        from habarico.validators import content_types_for_serializer_field, max_size_for_serializer_field

        options = dict(super().get_options())
        max_size = max_size_for_serializer_field(self)
        if max_size is not None:
            options.setdefault("max_size", max_size)
        content_types = content_types_for_serializer_field(self)
        if content_types:
            options.setdefault("accept", sorted(content_types))
        return options


class AdminImageFileSerializer(*_file_field_bases, AdminFileOptionsFieldMixin, Base64ImageFileSerializer):
    """
    Custom image file serializer for admin. It is used to generate the image field in the react admin.

    :param resize_width: resize the image to this width (in pixels) on the client side.
    :param crop_aspect_ratio: crop the image to this aspect ratio on the client side (e.g. 1.5 for 3:2).

    Ex. AdminImageFileSerializer(resize_width=100, crop_aspect_ratio=1.5)
    """

    def __init__(self, *args, resize_width: int | None = None, crop_aspect_ratio: float | None = None, **kwargs):
        super().__init__(*args, **kwargs)
        if resize_width is not None or crop_aspect_ratio is not None:
            image_opts = {}
            if resize_width is not None:
                image_opts["resize_width"] = resize_width
            if crop_aspect_ratio is not None:
                image_opts["crop_aspect_ratio"] = crop_aspect_ratio
            self.options["image"] = image_opts


class AdminFileSerializer(*_file_field_bases, AdminFileOptionsFieldMixin, Base64FileSerializer):
    """
    Custom file serializer for admin. It is used to generate the file field in the react admin.

    :param options: dictionary with options for the file field.
                    you can use value "target" to define where the file link will be opened.

                    Ex. AdminFileSerializer(options={"target": "blank"})
                    will open the file link in a new tab.
    """


class TreePrimaryKeyRelatedField(AdminFormatFieldMixin, AdminRelatedFieldMixin, serializers.PrimaryKeyRelatedField):
    """
    Custom primary key related field for admin.
    React admin will render field as a treeview (https://mui.com/x/react-tree-view/).

    :param reference: reference of the related model in the admin.
    :param parent_field: name of the parent field in the related model.
    :param sort_by: name of the field to order the related model.
    """

    def __init__(self, *args, reference: str, parent_field: str, sort_by: str, **kwargs):
        super().__init__(
            *args,
            format="tree-relation",
            options={
                "relation": {
                    "parent": parent_field,
                    "sort": {
                        "field_name": sort_by.lstrip("-"),
                        "direction": "DESC" if sort_by.startswith("-") else "ASC",
                    },
                }
            },
            reference=reference,
            **kwargs,
        )


class AdminChoiceField(AdminOptionsFieldMixin, serializers.ChoiceField):
    """
    Custom choice field for admin. It is used to generate the selectbox in the react admin.
    You can set the icons key to define which admin icons set will be used.
    """

    def __init__(self, *args, icons_key: str = None, choice_colors: dict = None, choice_icons: dict = None, **kwargs):
        options = {}
        if icons_key:
            options["choices"] = {"icons_key": icons_key}
        if choice_colors:
            self.choice_colors = choice_colors
        if choice_icons:
            self.choice_icons = choice_icons
        super().__init__(*args, options=options, **kwargs)


class AdminCharField(AdminFormatFieldMixin, AdminOptionsFieldMixin, serializers.CharField):
    """
    Standard char field for admin. It is used to add specific UX behavior in the react admin.
    """


class AdminBooleanField(AdminOptionsFieldMixin, serializers.BooleanField):
    """
    Standard boolean field for admin. It is used to add specific UX behavior in the react admin.
    """


class AdminDecimalField(AdminFormatFieldMixin, AdminOptionsFieldMixin, serializers.DecimalField):
    """
    Custom decimal field for admin. It is used to generate the decimal field in the react admin.
    """

    def __init__(self, *args, currency: str | None = None, unit: str | None = None, **kwargs):
        super().__init__(*args, format="decimal", **kwargs)

        style = None
        if currency:
            style = "currency"
        if unit:
            style = "unit"

        self.options["number"] = {
            "minimum_fraction_digits": self.decimal_places,
            "maximum_fraction_digits": self.decimal_places,
            "currency": currency,
            "unit": unit,
            "style": style,
        }


class AdminIntegerField(AdminOptionsFieldMixin, serializers.IntegerField):
    """
    Custom integer field for admin. It is used to generate the integer field in the react admin.
    """

    def __init__(self, *args, currency: str | None = None, unit: str | None = None, **kwargs):
        super().__init__(*args, **kwargs)

        style = None
        if currency:
            style = "currency"
        if unit:
            style = "unit"

        self.options["number"] = {
            "currency": currency,
            "unit": unit,
            "style": style,
        }


class AdminFloatField(AdminOptionsFieldMixin, serializers.FloatField):
    """
    Custom integer field for admin. It is used to generate the integer field in the react admin.
    """

    def __init__(
        self,
        *args,
        currency: str | None = None,
        unit: str | None = None,
        minimum_fraction_digits: int | None = None,
        maximum_fraction_digits: int | None = None,
        **kwargs,
    ):
        super().__init__(*args, **kwargs)

        style = None
        if currency:
            style = "currency"
        if unit:
            style = "unit"

        self.options["number"] = {
            "minimum_fraction_digits": minimum_fraction_digits,
            "maximum_fraction_digits": maximum_fraction_digits,
            "currency": currency,
            "unit": unit,
            "style": style,
        }


try:
    from phonenumber_field.serializerfields import PhoneNumberField

    class AdminPhoneNumberField(AdminFormatFieldMixin, AdminOptionsFieldMixin, PhoneNumberField):
        """
        Custom phone field for admin. It is used to generate the phone field in the react admin.
        """

        def __init__(self, *args, region: str | None = None, allowed_regions: list[str] | None = None, **kwargs):
            super().__init__(*args, format="phone", **kwargs)

            self.options["phone"] = {
                "default_region": region,
                "allowed_regions": allowed_regions,
            }

except ImportError:
    pass
