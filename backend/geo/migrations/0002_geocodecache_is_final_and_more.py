from django.db import migrations, models
class Migration(migrations.Migration):

    dependencies = [
        ("geo", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="geocodecache",
            name="is_final",
            field=models.BooleanField(default=False),
        ),
        migrations.AddIndex(
            model_name="geocodecache",
            index=models.Index(fields=["provider", "lookup_type", "is_final"], name="geo_geocod_provider_4d7309_idx"),
        ),
    ]
