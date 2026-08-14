DISTRICTS = (
    ("1010", "Innere Stadt"),
    ("1020", "Leopoldstadt"),
    ("1030", "Landstraße"),
    ("1040", "Wieden"),
    ("1050", "Margareten"),
    ("1060", "Mariahilf"),
    ("1070", "Neubau"),
    ("1080", "Josefstadt"),
    ("1090", "Alsergrund"),
    ("1100", "Favoriten"),
    ("1110", "Simmering"),
    ("1120", "Meidling"),
    ("1130", "Hietzing"),
    ("1140", "Penzing"),
    ("1150", "Rudolfsheim-Fünfhaus"),
    ("1160", "Ottakring"),
    ("1170", "Hernals"),
    ("1180", "Währing"),
    ("1190", "Döbling"),
    ("1200", "Brigittenau"),
    ("1210", "Floridsdorf"),
    ("1220", "Donaustadt"),
    ("1230", "Liesing"),
)

DISTRICT_CODES = tuple(code for code, _ in DISTRICTS)
DISTRICT_CHOICES = tuple(
    (code, f"{code} — {name}") for code, name in DISTRICTS
)


def district_catalog():
    return [{"code": code, "name": name} for code, name in DISTRICTS]
