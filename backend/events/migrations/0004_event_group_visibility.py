from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("groups", "0001_initial"),
        ("events", "0003_alter_event_image"),
    ]

    operations = [
        migrations.AddField(
            model_name="event",
            name="group",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name="events",
                to="groups.group",
            ),
        ),
        migrations.AddField(
            model_name="event",
            name="visibility",
            field=models.CharField(
                choices=[("public", "Public"), ("private", "Private")],
                default="public",
                max_length=20,
            ),
        ),
        migrations.AddIndex(
            model_name="event",
            index=models.Index(fields=["group", "visibility"], name="events_even_group_i_0cae1b_idx"),
        ),
    ]
