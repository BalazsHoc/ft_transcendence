import uuid

import django.core.validators
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Group",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=150)),
                ("description", models.TextField(blank=True)),
                ("sport", models.CharField(max_length=50)),
                ("levels", models.JSONField(blank=True, default=list)),
                ("kind", models.CharField(choices=[("training", "Training"), ("social", "Social"), ("competitive", "Competitive"), ("team", "Team")], default="training", max_length=20)),
                ("visibility", models.CharField(choices=[("public", "Public"), ("private", "Private")], default="public", max_length=20)),
                ("join_policy", models.CharField(choices=[("open", "Open"), ("approval", "Requires approval"), ("invite_only", "Invite only")], default="open", max_length=20)),
                ("max_members", models.PositiveIntegerField(default=0, help_text="0 means the group has no membership limit.")),
                ("languages", models.JSONField(blank=True, default=list)),
                ("location_name", models.CharField(blank=True, max_length=255)),
                ("location_address", models.CharField(blank=True, max_length=512)),
                ("cover_image", models.FileField(blank=True, null=True, upload_to="group-images/", validators=[django.core.validators.FileExtensionValidator(["jpg", "jpeg", "png", "gif", "webp"])])),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("owner", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="owned_groups", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="GroupMembership",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("role", models.CharField(choices=[("owner", "Owner"), ("admin", "Admin"), ("member", "Member")], default="member", max_length=20)),
                ("status", models.CharField(choices=[("active", "Active"), ("pending", "Pending")], default="active", max_length=20)),
                ("joined_at", models.DateTimeField(auto_now_add=True)),
                ("group", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="memberships", to="groups.group")),
                ("user", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="group_memberships", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["role", "joined_at"]},
        ),
        migrations.AddIndex(model_name="group", index=models.Index(fields=["sport"], name="groups_grou_sport_8b55b4_idx")),
        migrations.AddIndex(model_name="group", index=models.Index(fields=["visibility"], name="groups_grou_visibil_7d5444_idx")),
        migrations.AddIndex(model_name="group", index=models.Index(fields=["is_active"], name="groups_grou_is_acti_04bc24_idx")),
        migrations.AddConstraint(model_name="groupmembership", constraint=models.UniqueConstraint(fields=("group", "user"), name="unique_group_membership")),
    ]
