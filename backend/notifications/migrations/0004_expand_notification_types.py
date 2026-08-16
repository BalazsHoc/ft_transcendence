from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("notifications", "0003_alter_notification_type"),
    ]

    operations = [
        migrations.AlterField(
            model_name="notification",
            name="type",
            field=models.CharField(
                choices=[
                    ("friend_request", "Friend request"),
                    ("friend_accepted", "Friend request accepted"),
                    ("friend_rejected", "Friend request rejected"),
                    ("friend_removed", "Friend removed"),
                    ("direct_message", "Direct message"),
                    ("group_message", "Group message"),
                    ("group_updated", "Group updated"),
                    ("group_deleted", "Group deleted"),
                    ("group_event_created", "Group event created"),
                    ("group_event_updated", "Group event updated"),
                    ("group_event_deleted", "Group event deleted"),
                    ("group_join_request", "Group join request"),
                    ("group_join_request_cancelled", "Group join request cancelled"),
                    ("group_member_joined", "Group member joined"),
                    ("group_member_left", "Group member left"),
                    ("event_updated", "Event updated"),
                    ("event_deleted", "Event deleted"),
                    ("event_participant_joined", "Event participant joined"),
                    ("event_participant_left", "Event participant left"),
                    ("event_participant_promoted", "Event participant promoted"),
                ],
                max_length=32,
            ),
        ),
    ]
