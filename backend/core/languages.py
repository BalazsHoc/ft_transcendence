LANGUAGE_CODES = ("en", "de", "ua")

LANGUAGE_CHOICES = tuple(
    (code, label)
    for code, label in (
        ("en", "English"),
        ("de", "German"),
        ("ua", "Ukrainian"),
    )
)
