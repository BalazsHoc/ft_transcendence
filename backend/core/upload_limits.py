"""Shared upload limits for user-facing image uploads."""

MAX_IMAGE_SIZE_MB = 10
MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024


def image_size_error(upload):
    """Return a validation message when an image exceeds the MVP limit."""

    if upload is not None and getattr(upload, "size", 0) > MAX_IMAGE_SIZE_BYTES:
        return f"Image must be {MAX_IMAGE_SIZE_MB} MB or smaller."
    return None
