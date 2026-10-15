from django.db.models import DecimalField


class MoneyField(DecimalField):

    def __init__(self, *args, currency: str | None = None, **kwargs):
        kwargs.setdefault("max_digits", 10)
        kwargs.setdefault("decimal_places", 2)
        self.currency = currency
        super().__init__(*args, **kwargs)


try:
    from phonenumber_field.modelfields import PhoneNumberField as BasePhoneNumberField

    class PhoneNumberField(BasePhoneNumberField):

        def __init__(self, *args, allowed_regions: list[str] | None = None, **kwargs):
            super().__init__(*args, **kwargs)
            self.allowed_regions = allowed_regions

except ImportError:
    pass
