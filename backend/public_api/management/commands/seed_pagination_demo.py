from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from core.districts import DISTRICT_CODES
from core.languages import LANGUAGE_CODES
from core.sports import SPORT_CHOICES
from events.models import Event, EventParticipant
from groups.models import Group, GroupMembership


ATHLETES = (
    ("lionel_messi_demo", "Lionel", "Messi", "football"),
    ("cristiano_ronaldo_demo", "Cristiano", "Ronaldo", "football"),
    ("kylian_mbappe_demo", "Kylian", "Mbappé", "football"),
    ("erling_haaland_demo", "Erling", "Haaland", "football"),
    ("lebron_james_demo", "LeBron", "James", "basketball"),
    ("stephen_curry_demo", "Stephen", "Curry", "basketball"),
    ("luka_doncic_demo", "Luka", "Dončić", "basketball"),
    ("giannis_antetokounmpo_demo", "Giannis", "Antetokounmpo", "basketball"),
    ("novak_djokovic_demo", "Novak", "Djokovic", "tennis"),
    ("rafael_nadal_demo", "Rafael", "Nadal", "tennis"),
    ("serena_williams_demo", "Serena", "Williams", "tennis"),
    ("coco_gauff_demo", "Coco", "Gauff", "tennis"),
    ("usain_bolt_demo", "Usain", "Bolt", "running"),
    ("eliud_kipchoge_demo", "Eliud", "Kipchoge", "running"),
    ("faith_kipyegon_demo", "Faith", "Kipyegon", "running"),
    ("michael_phelps_demo", "Michael", "Phelps", "swimming"),
    ("katie_ledecky_demo", "Katie", "Ledecky", "swimming"),
    ("tadej_pogacar_demo", "Tadej", "Pogačar", "cycling"),
    ("jonas_vingegaard_demo", "Jonas", "Vingegaard", "cycling"),
    ("canelo_alvarez_demo", "Canelo", "Álvarez", "boxing"),
    ("oleksandr_usyk_demo", "Oleksandr", "Usyk", "boxing"),
    ("truls_moregard_demo", "Truls", "Möregårdh", "table_tennis"),
    ("fan_zhendong_demo", "Fan", "Zhendong", "table_tennis"),
    ("mikaela_shiffrin_demo", "Mikaela", "Shiffrin", "skiing"),
    ("chloe_kim_demo", "Chloe", "Kim", "snowboarding"),
    ("janja_garnbret_demo", "Janja", "Garnbret", "climbing"),
    ("magnus_carlsen_demo", "Magnus", "Carlsen", "chess"),
    ("viktor_axelsen_demo", "Viktor", "Axelsen", "badminton"),
    ("gabi_guimaraes_demo", "Gabi", "Guimarães", "volleyball"),
    ("olaf_tufte_demo", "Olaf", "Tufte", "rowing"),
    ("teddy_riner_demo", "Teddy", "Riner", "martial_arts"),
    ("misty_copeland_demo", "Misty", "Copeland", "dance"),
    ("kilian_jornet_demo", "Kilian", "Jornet", "hiking"),
    ("arnold_schwarzenegger_demo", "Arnold", "Schwarzenegger", "strength"),
)

INDIVIDUAL_ATHLETE_INDICES = (0, 4, 8, 12, 15, 17, 19, 21, 24, 26)

VENUES = (
    ("Prater Hauptallee", "Hauptallee, 1020 Wien", 48.2066, 16.3974),
    ("Donauinsel", "Donauinsel, 1220 Wien", 48.2417, 16.4127),
    ("Augarten", "Obere Augartenstraße, 1020 Wien", 48.2241, 16.3788),
    ("Türkenschanzpark", "Hasenauerstraße, 1180 Wien", 48.2387, 16.3376),
    ("Wiener Stadthalle", "Roland-Rainer-Platz 1, 1150 Wien", 48.2029, 16.3375),
    ("Sportzentrum Marswiese", "Neuwaldegger Straße 57A, 1170 Wien", 48.2384, 16.2856),
    ("Wienerberg", "Wienerbergstraße, 1100 Wien", 48.1629, 16.3421),
    ("Lainzer Tiergarten", "Hermesstraße, 1130 Wien", 48.1777, 16.2394),
    ("Rathauspark", "Rathausplatz, 1010 Wien", 48.2106, 16.3581),
    ("Kahlenberg", "Josefsdorf, 1190 Wien", 48.2761, 16.3402),
    ("Hermann-Gmeiner-Park", "Gumpendorfer Straße, 1060 Wien", 48.1946, 16.3474),
    ("Stadionbad", "Praterallee 14, 1020 Wien", 48.2055, 16.4138),
)

SPORT_LABELS = dict(SPORT_CHOICES)


class Command(BaseCommand):
    help = "Create an idempotent local demo dataset for testing event and group pagination."

    def add_arguments(self, parser):
        parser.add_argument(
            "--events-per-user",
            type=int,
            default=4,
            help="Events to create per demo athlete (the first one is in the past).",
        )
        parser.add_argument(
            "--members-per-group",
            type=int,
            default=5,
            help="Additional demo members to add to each group.",
        )
        parser.add_argument(
            "--password",
            default="demo-pass-123",
            help="Password assigned only when a demo account is first created.",
        )

    def handle(self, *args, **options):
        events_per_user = options["events_per_user"]
        members_per_group = options["members_per_group"]
        password = options["password"]
        if events_per_user < 1:
            raise CommandError("--events-per-user must be at least 1.")
        if members_per_group < 0:
            raise CommandError("--members-per-group cannot be negative.")

        user_model = get_user_model()
        with transaction.atomic():
            users = self._seed_users(user_model, password)
            groups = self._seed_groups(users, members_per_group)
            events = self._seed_events(users, groups, events_per_user)
            individual_events = self._seed_individual_events(users)

        self.stdout.write(self.style.SUCCESS("Pagination demo data is ready."))
        self.stdout.write(f"Demo users:  {len(users)}")
        self.stdout.write(f"Demo groups: {len(groups)}")
        self.stdout.write(
            f"Demo events: {len(events) + len(individual_events)} "
            f"({events_per_user - 1} future per user plus {len(individual_events)} individual map events)"
        )
        self.stdout.write(f"Demo password for newly created accounts: {password}")

    def _seed_users(self, user_model, password):
        users = []
        for index, (username, first_name, last_name, sport) in enumerate(ATHLETES):
            defaults = {
                "email": f"{username}@example.test",
                "first_name": first_name,
                "last_name": last_name,
                "district": DISTRICT_CODES[index % len(DISTRICT_CODES)],
                "bio": f"Pagination demo profile for {first_name} {last_name}.",
                "languages": [LANGUAGE_CODES[index % len(LANGUAGE_CODES)]],
                "interests": [sport],
            }
            user, created = user_model.objects.get_or_create(
                username=username,
                defaults=defaults,
            )
            if created:
                user.set_password(password)
                user.save(update_fields=["password"])
            else:
                for field, value in defaults.items():
                    setattr(user, field, value)
                user.save(update_fields=list(defaults))
            users.append(user)
        return users

    def _seed_groups(self, users, members_per_group):
        groups = []
        for index, user in enumerate(users):
            sport = ATHLETES[index][3]
            sport_label = SPORT_LABELS[sport]
            levels = self._levels_for(index)
            group_name = f"{user.first_name} {user.last_name} · {sport_label} group"
            defaults = {
                "description": f"A pagination demo group hosted by {user.first_name} {user.last_name}.",
                "sport": sport,
                "levels": levels,
                "max_members": 0,
                "languages": ["en"],
                "location_name": VENUES[index % len(VENUES)][0],
                "location_address": VENUES[index % len(VENUES)][1],
                "is_active": True,
            }
            group, _ = Group.objects.update_or_create(
                owner=user,
                name=group_name,
                defaults=defaults,
            )
            GroupMembership.objects.update_or_create(
                group=group,
                user=user,
                defaults={"role": GroupMembership.ROLE_OWNER},
            )
            for offset in range(1, members_per_group + 1):
                member = users[(index + offset) % len(users)]
                if member.pk == user.pk:
                    continue
                GroupMembership.objects.update_or_create(
                    group=group,
                    user=member,
                    defaults={"role": GroupMembership.ROLE_MEMBER},
                )
            groups.append(group)
        return groups

    def _seed_events(self, users, groups, events_per_user):
        events = []
        now = timezone.now().replace(minute=0, second=0, microsecond=0)
        for index, (user, group) in enumerate(zip(users, groups)):
            sport = ATHLETES[index][3]
            sport_label = SPORT_LABELS[sport]
            venue = VENUES[index % len(VENUES)]
            level = self._levels_for(index)[0]
            for event_index in range(events_per_user):
                if event_index == 0:
                    start_at = now - timedelta(days=2 + index % 5)
                    title = f"{user.first_name} {sport_label} archive session"
                else:
                    start_at = now + timedelta(
                        days=2 + event_index * 2 + index % 5,
                        hours=(index * 3) % 8,
                    )
                    title = f"{user.first_name} {sport_label} meetup #{event_index}"
                defaults = {
                    "description": f"Pagination demo event hosted by {user.first_name} {user.last_name}.",
                    "sport": sport,
                    "level": level,
                    "languages": ["en"],
                    "location_name": venue[0],
                    "location_address": venue[1],
                    "latitude": venue[2],
                    "longitude": venue[3],
                    "start_at": start_at,
                    "end_at": start_at + timedelta(hours=2),
                    "max_slots": 20,
                    "visibility": Event.VISIBILITY_PUBLIC,
                }
                event, _ = Event.objects.update_or_create(
                    creator=user,
                    group=group,
                    title=title,
                    defaults=defaults,
                )
                for offset in range(1, min(4, len(users) - 1) + 1):
                    attendee = users[(index + offset) % len(users)]
                    EventParticipant.objects.update_or_create(
                        event=event,
                        user=attendee,
                        defaults={
                            "status": EventParticipant.STATUS_ATTENDING,
                            "queue_position": 0,
                        },
                    )
                events.append(event)
        return events

    def _seed_individual_events(self, users):
        """Create future, non-group events spread across Vienna for map testing."""

        events = []
        now = timezone.now().replace(minute=0, second=0, microsecond=0)
        for event_number, athlete_index in enumerate(INDIVIDUAL_ATHLETE_INDICES, start=1):
            user = users[athlete_index]
            sport = ATHLETES[athlete_index][3]
            sport_label = SPORT_LABELS[sport]
            venue = VENUES[(event_number + 7) % len(VENUES)]
            title = f"{user.first_name} {sport_label} city session #{event_number}"
            start_at = (
                now + timedelta(hours=2)
                if event_number == 1
                else now + timedelta(days=1, hours=event_number)
            )
            event, _ = Event.objects.update_or_create(
                creator=user,
                group=None,
                title=title,
                defaults={
                    "description": (
                        f"Individual map demo event hosted by {user.first_name} "
                        f"{user.last_name}."
                    ),
                    "sport": sport,
                    "level": self._levels_for(athlete_index)[0],
                    "languages": ["en"],
                    "location_name": venue[0],
                    "location_address": venue[1],
                    "latitude": venue[2],
                    "longitude": venue[3],
                    "start_at": start_at,
                    "end_at": start_at + timedelta(hours=2),
                    "max_slots": 16,
                    "visibility": Event.VISIBILITY_PUBLIC,
                },
            )
            for offset in range(1, 4):
                attendee = users[(athlete_index + offset) % len(users)]
                EventParticipant.objects.update_or_create(
                    event=event,
                    user=attendee,
                    defaults={
                        "status": EventParticipant.STATUS_ATTENDING,
                        "queue_position": 0,
                    },
                )
            events.append(event)
        return events

    @staticmethod
    def _levels_for(index):
        level_sets = (
            ["beginner", "intermediate"],
            ["intermediate", "advanced"],
            ["advanced"],
            ["all"],
        )
        return level_sets[index % len(level_sets)]
