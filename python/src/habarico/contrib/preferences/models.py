import uuid

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class UserPreference(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="habarico_preferences",
        verbose_name=_("user"),
    )
    key = models.CharField(max_length=255, verbose_name=_("key"))
    value = models.JSONField(verbose_name=_("value"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("updated at"))

    class Meta:
        app_label = "habarico_preferences"
        verbose_name = _("user preference")
        verbose_name_plural = _("user preferences")
        unique_together = [("user", "key")]

    def __str__(self) -> str:
        return f"{self.user_id}:{self.key}"
