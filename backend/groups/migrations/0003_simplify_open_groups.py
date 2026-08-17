from django.core.validators import FileExtensionValidator
from django.db import migrations, models


def ensure_cover_image_column(apps, schema_editor):
    """Add cover_image on clean installs while tolerating existing local DBs."""
    Group = apps.get_model("groups", "Group")
    table_name = Group._meta.db_table
    columns = {
        column.name
        for column in schema_editor.connection.introspection.get_table_description(
            schema_editor.connection.cursor(), table_name
        )
    }
    if "cover_image" in columns:
        return
    field = models.FileField(
        blank=True,
        null=True,
        upload_to="group-images/",
        validators=[FileExtensionValidator(["jpg", "jpeg", "png", "gif", "webp"])],
    )
    field.set_attributes_from_name("cover_image")
    field.model = Group
    schema_editor.add_field(Group, field)


def normalize_to_open_groups(apps, schema_editor):
    """Migrate legacy group policies to the single MVP workflow.

    The old columns are intentionally retained for backwards-compatible
    database upgrades, but every group is now public/open and every existing
    pending membership is active.
    """

    Group = apps.get_model("groups", "Group")
    GroupMembership = apps.get_model("groups", "GroupMembership")
    Group.objects.all().update(visibility="public", join_policy="open")
    GroupMembership.objects.filter(status="pending").update(status="active")


class Migration(migrations.Migration):
    dependencies = [("groups", "0002_alter_group_sport")]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(
                    ensure_cover_image_column,
                    migrations.RunPython.noop,
                )
            ],
            state_operations=[
                migrations.AddField(
                    model_name="group",
                    name="cover_image",
                    field=models.FileField(
                        blank=True,
                        null=True,
                        upload_to="group-images/",
                        validators=[
                            FileExtensionValidator(
                                ["jpg", "jpeg", "png", "gif", "webp"]
                            )
                        ],
                    ),
                )
            ],
        ),
        migrations.RunPython(normalize_to_open_groups, migrations.RunPython.noop),
    ]
