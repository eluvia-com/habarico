from __future__ import annotations

from typing import TYPE_CHECKING

from django.core.exceptions import ObjectDoesNotExist
from django.db import models
from django.db.models import Model
from django.utils.translation import gettext_lazy as _
from eluvia_base.integrations.fieldset import RFS
from eluvia_base_django.rest_framework.serializers import ListSerializer as BaseListSerializer
from eluvia_base_django.rest_framework.serializers import ModelListSerializer as BaseModelListSerializer
from eluvia_base_django.rest_framework.serializers import ModelSerializer as BaseModelSerializer
from habarico.models import MoneyField
from habarico.schema.fields import Field
from habarico.serializers.fields import (
    AdminCharField,
    AdminChoiceField,
    AdminDecimalField,
    AdminFileSerializer,
    AdminFloatField,
    AdminFormatFieldMixin,
    AdminImageFileSerializer,
    AdminIntegerField,
    AdminPrimaryKeyRelatedField,
    AdminRelatedField,
    RichTextField,
    TextField,
    TreePrimaryKeyRelatedField,
)
from habarico.settings import admin_api_settings
from habarico.utils import get_reference_from_model, resolve_fieldset_defaults
from rest_framework import serializers
from rest_framework.utils import model_meta

try:
    from habarico.models import PhoneNumberField
    from habarico.serializers.fields import AdminPhoneNumberField
except ImportError:
    PhoneNumberField = AdminPhoneNumberField = None

if TYPE_CHECKING:
    from habarico.schema import Fields


def _file_field_mixin_classes() -> tuple[type, ...]:
    """
    The contributed file-field mixin as an ``isinstance``/``issubclass`` argument.

    Empty when ``DEFAULT_FILE_FIELD_MIXIN_CLASS`` is unset, which makes every check against it
    False on a free-only install.
    """
    mixin = admin_api_settings.DEFAULT_FILE_FIELD_MIXIN_CLASS
    return (mixin,) if mixin is not None else ()


__all__ = (
    "AdminModelSerializer",
    "ModelSerializer",
    "model_serializer_factory",
    "TextField",
    "ListSerializer",
    "RichTextField",
    "AdminFileSerializer",
    "AdminImageFileSerializer",
    "AdminPrimaryKeyRelatedField",
    "AdminChoiceField",
    "TreePrimaryKeyRelatedField",
    "AdminRelatedField",
    "AdminCharField",
    "AdminDecimalField",
)


class ListSerializer(BaseListSerializer):

    initial = None

    def __init__(self, *args, **kwargs):
        self.initial = kwargs.pop("initial", self.initial)
        super().__init__(*args, **kwargs)


class ModelListSerializer(BaseModelListSerializer):

    def create_update_or_delete_object(self, validated_data, relation, objects_to_delete=None):
        pk_field = self.child.Meta.model._meta.pk.name

        existing_objects = {obj.pk: obj for obj in relation.all() if obj.pk}
        existing_pks = set(existing_objects.keys())
        for validated_obj_data in validated_data:
            pk = validated_obj_data.get(pk_field)
            if pk and pk in existing_pks:
                existing_pks.remove(pk)
                rel_instance = existing_objects.get(pk)
            else:
                rel_instance = None
            self.child.create_update_or_delete_object(
                validated_obj_data,
                rel_instance,
                objects_to_delete,
            )
        if objects_to_delete is not None:
            objects_to_delete += list(relation.filter(pk__in=existing_pks))


class ModelSerializer(BaseModelSerializer):
    """
    Base serializer for models. It overrides the default serializer field mapping to use extended admin fields.
    """

    serializer_field_mapping = BaseModelSerializer.serializer_field_mapping.copy()
    serializer_field_mapping[models.FileField] = AdminFileSerializer
    serializer_field_mapping[models.ImageField] = AdminImageFileSerializer
    serializer_field_mapping[models.TextField] = TextField
    serializer_field_mapping[models.DecimalField] = AdminDecimalField
    serializer_field_mapping[models.IntegerField] = AdminIntegerField
    serializer_field_mapping[models.FloatField] = AdminFloatField
    serializer_field_mapping[models.CharField] = AdminCharField
    if PhoneNumberField and AdminPhoneNumberField:
        serializer_field_mapping[PhoneNumberField] = AdminPhoneNumberField

    def _get_relations(self):
        """
        Get forward and reverse relations from the serializer fields.
        """
        ModelClass = self.Meta.model
        field_info = model_meta.get_field_info(ModelClass)
        forward_relations_fields = {
            key: field
            for key, field in self.fields.items()
            if (
                isinstance(field, ModelSerializer)
                and field.source in field_info.forward_relations
                and not field_info.forward_relations[field.source].to_many
            )
        }
        reverse_relations_fields = {
            key: field
            for key, field in self.fields.items()
            if isinstance(field, (ModelSerializer, ModelListSerializer))
            and field.source in field_info.reverse_relations
        }
        return forward_relations_fields, reverse_relations_fields

    def _extract_relations_validated_data(self, validated_data):
        """
        Extract forward and reverse relations from the validated data.
        """
        forward_relations_fields, reverse_relations_fields = self._get_relations()

        forward_relations_validated_data = {}
        reverse_relations_validated_data = {}

        for field_name in forward_relations_fields.keys():
            if field_name in validated_data:
                forward_relations_validated_data[field_name] = validated_data.pop(field_name)

        for field_name in reverse_relations_fields.keys():
            if field_name in validated_data:
                reverse_relations_validated_data[field_name] = validated_data.pop(field_name)

        return forward_relations_validated_data, reverse_relations_validated_data

    def build_standard_field(self, field_name, model_field):
        """
        Override the standard field builder to use the custom primary key related field
        and adds computed reference from the related model class.
        """
        field_class, field_kwargs = super().build_standard_field(field_name, model_field)
        if field_class == serializers.PrimaryKeyRelatedField:
            field_class = AdminPrimaryKeyRelatedField
            field_kwargs["reference"] = get_reference_from_model(model_field.related_model)

        if isinstance(model_field, MoneyField):
            field_kwargs["currency"] = model_field.currency

        if PhoneNumberField and isinstance(model_field, PhoneNumberField):
            field_kwargs["allowed_regions"] = model_field.allowed_regions
            field_kwargs["region"] = model_field.region

        if hasattr(model_field, "format") and model_field.format and issubclass(field_class, AdminFormatFieldMixin):
            field_kwargs["format"] = model_field.format

        if issubclass(field_class, _file_field_mixin_classes()) and getattr(model_field, "storage", None) is not None:
            field_kwargs["upload_storage"] = model_field.storage
            field_kwargs["model_backed"] = True

        return field_class, field_kwargs

    def build_relational_field(self, field_name, relation_info):
        """
        Override the standard field builder to use the custom primary key related field
        and adds computed reference from the related model class.
        """
        reference = get_reference_from_model(relation_info.related_model)
        field_class, field_kwargs = super().build_relational_field(field_name, relation_info)
        if field_class == serializers.PrimaryKeyRelatedField:
            field_class = AdminPrimaryKeyRelatedField
            field_kwargs["reference"] = reference
        return field_class, field_kwargs

    def _pop_upload_references(self, validated_data):
        """
        Remove pending chunked-upload references from ``validated_data``.

        Chunked uploads are finalized only once the model instance has been saved (see
        :meth:`_finalize_uploads`), so the pending-upload placeholders must not reach the
        underlying model save. Returns ``{field: <placeholder>}`` for the popped fields.

        Whether a value is such a placeholder is the field's own business: an upload field mixin
        contributed via ``DEFAULT_FILE_FIELD_MIXIN_CLASS`` answers through
        ``is_pending_upload(value)``. Core therefore needs no knowledge of the placeholder type.
        """
        upload_refs = {}
        for field in self.fields.values():
            if isinstance(field, _file_field_mixin_classes()):
                value = validated_data.get(field.source)
                if field.is_pending_upload(value):
                    upload_refs[field] = validated_data.pop(field.source)
        return upload_refs

    def _finalize_uploads(self, instance, upload_refs):
        """
        Move each pending upload into place and persist the resulting paths on ``instance``.

        Runs after the instance has been saved, so ``instance`` carries its real primary key and
        field values; an ``upload_to`` callable may therefore safely depend on them. The resolved
        paths are written back with a targeted ``save(update_fields=...)``.
        """
        update_fields = []
        for field, upload_reference in upload_refs.items():
            setattr(instance, field.source, field.finalize_upload(upload_reference, instance))
            update_fields.append(field.source)
        if update_fields:
            instance.save(update_fields=update_fields)

    def create(self, validated_data):
        """
        Override the create method to handle related fields correctly.
        """
        relations, reverse_relations = self._extract_relations_validated_data(validated_data)
        self._update_or_create_direct_relations(relations)
        # Add the created related objects data back into validated_data.
        validated_data.update(relations)
        upload_refs = self._pop_upload_references(validated_data)
        instance = super().create(validated_data)
        self._finalize_uploads(instance, upload_refs)
        self._update_or_create_reverse_relations(reverse_relations, instance)
        return instance

    def update(self, instance, validated_data):
        """
        Override the update method to handle related fields correctly.
        """
        objects_to_delete = []
        relations, reverse_relations = self._extract_relations_validated_data(validated_data)
        self._update_or_create_direct_relations(relations, instance, objects_to_delete)
        # Add the created/updated related objects data back into validated_data.
        validated_data.update(relations)
        upload_refs = self._pop_upload_references(validated_data)
        instance = super().update(instance, validated_data)
        self._finalize_uploads(instance, upload_refs)
        self._update_or_create_reverse_relations(reverse_relations, instance, objects_to_delete)
        self._delete_relations(objects_to_delete)
        return instance

    def _delete_relations(self, objects_to_delete):
        """
        Delete the objects that are marked for deletion.
        """
        for obj in objects_to_delete:
            obj.delete()

    def _update_or_create_direct_relations(self, validated_data, instance=None, objects_to_delete=None):
        """
        Update or create direct relations for the instance of the nested serializers.
        """
        for field_name, data in validated_data.items():
            validated_data[field_name] = self.fields[field_name].create_update_or_delete_object(
                data,
                getattr(instance, field_name) if instance else None,
                objects_to_delete,
            )

    def _update_or_create_reverse_relations(self, validated_data, instance, objects_to_delete=None):
        """
        Update or create reverse relations for the instance of the nested serializers.
        """
        ModelClass = self.Meta.model

        for field_name, data in validated_data.items():
            field = self.fields[field_name]
            reverse_name = ModelClass._meta.get_field(field.source).field.name

            try:
                rel_instance = getattr(instance, field.source)
            except ObjectDoesNotExist:
                rel_instance = None

            is_many = isinstance(field, ModelListSerializer)
            if data:
                if is_many:
                    for item in data:
                        item[reverse_name] = instance
                else:
                    data[reverse_name] = instance

            self.fields[field_name].create_update_or_delete_object(data, rel_instance, objects_to_delete)

    def create_update_or_delete_object(self, validated_data, instance=None, objects_to_delete=None):
        """
        Create, update or delete the object based on the validated data.
        """
        if validated_data is None:  # Delete
            if instance and objects_to_delete is not None:
                objects_to_delete.append(instance)
            return None
        elif instance is None:  # Create
            return self.create(validated_data)
        else:  # Update
            return self.update(instance, validated_data)

    class Meta(BaseModelSerializer.Meta):
        list_serializer_class = ModelListSerializer


class AdminModelSerializer(ModelSerializer):
    """
    Base serializer for admin models. It overrides the default serializer field mapping to use extended admin fields.
    """

    meta = serializers.SerializerMethodField()

    def get_repr(self, obj: Model) -> str:
        return str(obj)

    def get_meta(self, obj: Model) -> dict:
        """Return the meta information for the object to save to the server.

        Args:
            obj: Model instance for which the meta is generated.

        Returns:
            Dict with the representation, schema, tags and trigger action
            of the object.
        """
        trigger_action_schema = self.context["view"].get_trigger_action_schema(obj) if obj else None

        fieldset = self._get_requested_fieldset()
        meta_fieldset = fieldset.get("meta").fieldset if fieldset and fieldset.get("meta") else None

        # Full default fieldset for the meta object. The schema sub-fieldset mirrors
        # ObjectResourceSchema so that callers can use __default__ inside schema(...)
        # to get all schema fields while still overriding specific ones.
        default_meta_fieldset = RFS.create_from_string(
            "repr," "schema(name,label,pk_field_name,actions)," "tags," "trigger_action"
        )

        meta_fieldset = resolve_fieldset_defaults(meta_fieldset, default_meta_fieldset) or default_meta_fieldset

        meta = {}
        if "repr" in meta_fieldset:
            meta["repr"] = self.context["view"].get_obj_repr(obj)
        if "schema" in meta_fieldset:
            meta["schema"] = self.get_schema(obj, requested_fieldset=meta_fieldset["schema"])
        if "tags" in meta_fieldset:
            meta["tags"] = self.get_tags(obj)
        if "trigger_action" in meta_fieldset:
            meta["trigger_action"] = trigger_action_schema.to_dict() if trigger_action_schema else None

        view = self.context.get("view")
        if view is not None and obj is not None:
            # Optional keys contributed by a pro/enterprise viewset mixin (e.g. ``highlights``);
            # empty on a free-only install - see ``AdminModelViewSet.get_extra_meta()``.
            meta.update(view.get_extra_meta(obj))

        return meta

    def get_schema(self, obj: Model | None, requested_fieldset: RFS | None = None) -> dict:
        """
        Get the schema of the resource.

        Args:
            obj: model instance.
            requested_fieldset: requested fieldset for the schema.

        Return:
            dict with the schema of the resource.
        """
        return self.context["view"].get_resource_schema(obj, requested_fieldset)

    def get_tags(self, obj: Model | None) -> list[str]:
        """
        Get the list of tags.

        Args:
            obj: model instance.

        Return:
            list of tags.
        """
        return []

    def build_standard_field(self, field_name, model_field):
        """
        Override the standard field builder to use the custom primary key related field
        and adds computed reference from the related model class.
        """
        field_class, field_kwargs = super().build_standard_field(field_name, model_field)
        if field_class == serializers.PrimaryKeyRelatedField:
            field_class = AdminPrimaryKeyRelatedField
            field_kwargs["reference"] = get_reference_from_model(model_field.related_model)

        if isinstance(model_field, MoneyField):
            field_kwargs["currency"] = model_field.currency

        if PhoneNumberField and isinstance(model_field, PhoneNumberField):
            field_kwargs["allowed_regions"] = model_field.allowed_regions
            field_kwargs["region"] = model_field.region

        if hasattr(model_field, "format") and model_field.format and issubclass(field_class, AdminFormatFieldMixin):
            field_kwargs["format"] = model_field.format

        if issubclass(field_class, _file_field_mixin_classes()) and getattr(model_field, "storage", None) is not None:
            field_kwargs["upload_storage"] = model_field.storage
            field_kwargs["model_backed"] = True

        return field_class, field_kwargs

    def build_relational_field(self, field_name, relation_info):
        """
        Override the standard field builder to use the custom primary key related field
        and adds computed reference from the related model class.
        """
        reference = get_reference_from_model(relation_info.related_model)
        field_class, field_kwargs = super().build_relational_field(field_name, relation_info)
        if field_class == serializers.PrimaryKeyRelatedField:
            field_class = AdminPrimaryKeyRelatedField
            field_kwargs["reference"] = reference
        return field_class, field_kwargs


def model_serializer_factory(
    model: Model,
    serializer: AdminModelSerializer = None,
    fields: Fields = None,
    read_only_fields: list[str] = None,
    extra_kwargs: dict[str, dict] = None,
) -> AdminModelSerializer:
    """
    Factory to create a serializer for the model.

    Args:
        model (Model): The model class.
        serializer (AdminModelSerializer): The base serializer class.
        fields (list[str]): The list of fields to include in the serializer.
        read_only_fields (list[str]): The list of read-only fields.
        extra_kwargs (dict[str, dict]): Extra keyword arguments for the fields.
    """
    serializer = serializer or AdminModelSerializer

    descriptors = {field.get_name(): field for field in fields if isinstance(field, Field)}
    fields = [
        field.get_name() if isinstance(field, Field) else field
        for field in fields or []
        if not isinstance(field, Field) or field.is_serializer_field
    ]

    pk_name = model._meta.pk.name
    if pk_name not in fields:
        fields = [pk_name] + list(fields)

    # Get serializer extra kwargs to extend it with the extra kwargs
    meta_extra_kwargs = getattr(serializer.Meta, "extra_kwargs", {}).copy()
    return type(
        f"{model.__name__}Serializer",
        (serializer,),
        {
            "Meta": type(
                "Meta",
                (serializer.Meta,),
                {
                    "model": model,
                    "fields": (
                        fields
                        + [
                            "meta",
                        ]
                    ),
                    "read_only_fields": read_only_fields,
                    "extra_kwargs": {
                        **extra_kwargs,
                        **meta_extra_kwargs,
                    },
                    "descriptors": descriptors,
                },
            )
        },
    )


_("This field may not be null.")
