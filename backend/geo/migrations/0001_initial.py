from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="GeocodeCache",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("cache_key", models.CharField(max_length=255, unique=True)),
                ("provider", models.CharField(max_length=32)),
                ("lookup_type", models.CharField(choices=[("search", "Search"), ("reverse", "Reverse")], max_length=16)),
                ("query", models.CharField(max_length=512)),
                ("query_normalized", models.CharField(max_length=512)),
                ("language", models.CharField(blank=True, default="", max_length=32)),
                ("latitude", models.FloatField(blank=True, null=True)),
                ("longitude", models.FloatField(blank=True, null=True)),
                ("response_json", models.JSONField(default=dict)),
                ("hit_count", models.PositiveIntegerField(default=0)),
                ("last_used_at", models.DateTimeField(blank=True, null=True)),
                ("expires_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["-updated_at"],
            },
        ),
        migrations.AddIndex(
            model_name="geocodecache",
            index=models.Index(fields=["provider", "lookup_type"], name="geo_geocod_provider_b9ebfb_idx"),
        ),
        migrations.AddIndex(
            model_name="geocodecache",
            index=models.Index(fields=["query_normalized"], name="geo_geocod_query_n_8c0b6f_idx"),
        ),
        migrations.AddIndex(
            model_name="geocodecache",
            index=models.Index(fields=["expires_at"], name="geo_geocod_expires__31f9e8_idx"),
        ),
    ]
