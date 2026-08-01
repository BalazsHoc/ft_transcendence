SPORT_CODES = (
    "badminton",
    "basketball",
    "boxing",
    "chess",
    "climbing",
    "cycling",
    "dance",
    "football",
    "hiking",
    "martial_arts",
    "rowing",
    "running",
    "skiing",
    "snowboarding",
    "strength",
    "swimming",
    "table_tennis",
    "tennis",
    "volleyball",
    "yoga",
)

SPORT_CHOICES = tuple(
    (code, code.replace("_", " ").title()) for code in SPORT_CODES
)


def sport_catalog():
    return [{"code": code} for code in SPORT_CODES]
