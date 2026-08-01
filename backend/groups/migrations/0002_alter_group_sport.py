from django.db import migrations, models


SPORT_CHOICES = [
    ("badminton", "Badminton"), ("basketball", "Basketball"),
    ("boxing", "Boxing"), ("chess", "Chess"), ("climbing", "Climbing"),
    ("cycling", "Cycling"), ("dance", "Dance"), ("football", "Football"),
    ("hiking", "Hiking"), ("martial_arts", "Martial Arts"),
    ("rowing", "Rowing"), ("running", "Running"), ("skiing", "Skiing"),
    ("snowboarding", "Snowboarding"), ("strength", "Strength"),
    ("swimming", "Swimming"), ("table_tennis", "Table Tennis"),
    ("tennis", "Tennis"), ("volleyball", "Volleyball"), ("yoga", "Yoga"),
]


class Migration(migrations.Migration):
    dependencies = [("groups", "0001_initial")]

    operations = [
        migrations.AlterField(
            model_name="group",
            name="sport",
            field=models.CharField(choices=SPORT_CHOICES, max_length=50),
        ),
    ]
