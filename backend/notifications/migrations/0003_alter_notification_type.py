from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("notifications", "0002_alter_notification_type"),
    ]

    operations = [
        migrations.AlterField(
            model_name="notification",
            name="type",
            field=models.CharField(
                choices=[
                    ("friend_request", "Friend request"),
                    ("friend_accepted", "Friend request accepted"),
                    ("direct_message", "Direct message"),
                    ("group_message", "Group message"),
                ],
                max_length=32,
            ),
        ),
    ]
