from rest_framework import serializers


class UserPreferenceItemSerializer(serializers.Serializer):
    key = serializers.CharField()
    value = serializers.JSONField()
    updated_at = serializers.DateTimeField(allow_null=True)
