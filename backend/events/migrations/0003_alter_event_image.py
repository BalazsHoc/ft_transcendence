from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ("events", "0002_event_image_alter_event_max_slots"),
    ]

    operations = [
        migrations.AlterField(
            model_name="event",
            name="image",
            field=models.FileField(
                blank=True,
                null=True,
                upload_to="event-images/",
                validators=[
                    django.core.validators.FileExtensionValidator(
                        ["jpg", "jpeg", "png", "gif", "webp"]
                    )
                ],
            ),
        ),
    ]
