import importlib.util

PHONENUMBER_FIELD_AVAILABLE = importlib.util.find_spec("phonenumber_field") is not None
