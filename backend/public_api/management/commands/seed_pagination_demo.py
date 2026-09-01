from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from core.districts import DISTRICT_CODES
from core.languages import LANGUAGE_CODES
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

# The larger local dataset is also used in screenshots and manual QA. Keep the
# copy human-friendly so it reads like a real community rather than a fixture.
# Every sport gets its own voice, group concept, and event ideas; the athlete's
# name is added by the seed helpers to keep each generated record distinct.
SPORT_COPY = {
    "football": {
        "profile": "Quick combinations, clever movement, and welcoming five-a-side games make every session worth the effort.",
        "group_name": "Prater Playmakers",
        "group_description": "A friendly football circle for quick feet, creative passing, and small-sided games around Vienna.",
        "events": (
            ("First Touch Under the Lights", "Short-sided games, close control, and a rotating finishing challenge."),
            ("Danube Counterattack Lab", "Build from the back, move as a unit, and test ideas in a relaxed mini-match."),
            ("Sunday Five-a-Side Social", "A low-pressure kickabout for new faces, familiar teammates, and good post-game coffee."),
        ),
        "map_event": ("Street Football Sunrise", "A compact warm-up and a few friendly games before the city gets busy."),
    },
    "basketball": {
        "profile": "Fast breaks, patient ball movement, and a clean jumper after work are the perfect way to reset.",
        "group_name": "Rim & Rhythm",
        "group_description": "A welcoming basketball run with rotating teams, skill stations, and plenty of touches for everyone.",
        "events": (
            ("Pick-and-Roll Playground", "Warm up with reads and spacing, then put them into practice in short games."),
            ("Danube Hoops Afterglow", "An easygoing evening run with music, friendly competition, and a few new drills."),
            ("Arc to Arc Shooting Club", "A focused shooting circuit followed by balanced five-on-five rotations."),
        ),
        "map_event": ("Vienna Hoops Circuit", "A drop-in shooting session moving from form work to a few relaxed half-court games."),
    },
    "tennis": {
        "profile": "Long rallies, thoughtful point construction, and a little patience at the baseline keep the game interesting.",
        "group_name": "Baseline Exchange",
        "group_description": "A tennis meet-up for consistent rallies, useful feedback, and doubles partners who communicate.",
        "events": (
            ("Baseline Patterns Morning", "Build reliable cross-court patterns, then finish with friendly sets."),
            ("Second-Serve Workshop", "A practical session for placement, return games, and calmer points under pressure."),
            ("Rally & Rosé Social", "A relaxed doubles afternoon where good rallies matter more than the score."),
        ),
        "map_event": ("Vienna Rally Route", "A social hit with a short movement warm-up, cooperative rallies, and optional tie-breaks."),
    },
    "running": {
        "profile": "Steady miles, honest pacing, and discovering another quiet corner of Vienna are the best training rewards.",
        "group_name": "Sunrise Striders",
        "group_description": "A supportive running circle for easy miles, thoughtful pacing, and routes that make Vienna feel new.",
        "events": (
            ("Canal Tempo & Coffee", "A progressive tempo run that ends with an easy cool-down and a shared coffee stop."),
            ("Prater Long-Loop Social", "Choose a comfortable pace, collect a few kilometres, and keep the conversation moving."),
            ("Hill Notes at Dusk", "Short hill repeats with generous recovery and a relaxed group finish."),
        ),
        "map_event": ("Vienna Pace Picnic", "An easy run with several pace options, a riverside stretch, and time to compare routes."),
    },
    "swimming": {
        "profile": "A quiet lane, a clear set, and the rhythm of the water make training feel wonderfully simple.",
        "group_name": "Lane Lines Vienna",
        "group_description": "A swim circle for technique-focused sets, considerate lane sharing, and a calm start to the day.",
        "events": (
            ("Long-Course Technique Lab", "Drills for a more efficient stroke, followed by a flexible endurance set."),
            ("Open-Water Confidence Hour", "Practice sighting, pacing, and relaxed breathing in a supportive session."),
            ("Relay Without the Pressure", "Short relay blocks and playful challenges where every lane gets a turn."),
        ),
        "map_event": ("Poolside Reset", "A technique-first swim followed by mobility work and an easy walk home."),
    },
    "cycling": {
        "profile": "Quiet roads, a well-packed saddle bag, and a climb that earns the view keep every ride memorable.",
        "group_name": "Two-Wheel Explorers",
        "group_description": "A cycling crew for safe pacing, scenic loops, and route ideas that work for different legs and bikes.",
        "events": (
            ("Danube Drafting Basics", "Learn simple group-riding signals, settle into a smooth pace, and share the front."),
            ("Coffee Climb to Kahlenberg", "A steady ascent with regroup points and a rewarding view over the city."),
            ("Greenway Gravel Ramble", "An unhurried mixed-surface ride with route tips and a picnic-style finish."),
        ),
        "map_event": ("Vienna Two-Wheel Loop", "A scenic loop with a social pace, one optional climb, and a café stop at the finish."),
    },
    "boxing": {
        "profile": "Sharp footwork, controlled combinations, and respect for a training partner matter more than bravado.",
        "group_name": "Guard Up Vienna",
        "group_description": "A technique-led boxing circle for footwork, pad rounds, and conditioning without ego.",
        "events": (
            ("Footwork Before Firepower", "Build balance and distance control before adding crisp, efficient combinations."),
            ("Pads, Pace, and Precision", "A coachable pad-work circuit with options for every level and a measured finish."),
            ("Defence to Counter Clinic", "Practice slips, blocks, and calm counters in a supportive partner rotation."),
        ),
        "map_event": ("Vienna Boxing Footwork Walk", "A mobile conditioning session mixing brisk walking, shadowboxing, and mobility stops."),
    },
    "table_tennis": {
        "profile": "A small table can hold a huge amount of strategy: placement, timing, and one more ball than expected.",
        "group_name": "Spin Station",
        "group_description": "A table-tennis meet-up for curious players, long rallies, and friendly matches with quick rotations.",
        "events": (
            ("Spin & Serve Studio", "Try a few serves, read the return, and build points before the match starts."),
            ("Rally Ladder with a Twist", "A light-hearted ladder where creative shots earn a second chance, not a lecture."),
            ("Backhand Stories", "Explore placement and timing through cooperative drills and short competitive games."),
        ),
        "map_event": ("Table Tennis Pop-Up", "A portable-table session with warm-up rallies, mini-games, and plenty of partner changes."),
    },
    "skiing": {
        "profile": "Good edges, patient turns, and a warm drink after the last run are a reliable recipe for a great day.",
        "group_name": "Alpine Lines",
        "group_description": "A ski planning circle for technique chats, practical trips, and keeping every run enjoyable.",
        "events": (
            ("Edge Control Evening", "Talk technique, compare drills, and plan a focused day on the slopes together."),
            ("Powder Planers Breakfast", "Share snow reports, travel ideas, and a realistic itinerary for the next adventure."),
            ("Après Without the Rush", "A social catch-up for ski stories, kit swaps, and finding the next good mountain day."),
        ),
        "map_event": ("Vienna Alpine Planning Walk", "A relaxed city walk to compare gear lists, routes, and the first lift of the season."),
    },
    "snowboarding": {
        "profile": "A clean line, a playful feature, and enough patience to try a trick one more time keep the stoke high.",
        "group_name": "Fresh Line Society",
        "group_description": "A snowboarding crew for honest progression, shared mountain plans, and celebrating small wins.",
        "events": (
            ("Carve & Balance Workshop", "Dial in stance, edge changes, and confidence on the basics before chasing speed."),
            ("Park Ideas Exchange", "Share line choices and progression tips in a low-pressure session for mixed levels."),
            ("First Tracks Planning Night", "Make a practical mountain plan, compare kit, and leave with a crew to ride with."),
        ),
        "map_event": ("Snowboard Season Kickoff", "An off-snow mobility and planning session for riders getting ready for the first trip."),
    },
    "climbing": {
        "profile": "Reading a wall, trusting a foothold, and finding a calm solution to a tricky move never gets old.",
        "group_name": "Hold Seekers",
        "group_description": "A climbing community for thoughtful beta, safe belays, and celebrating every new problem solved.",
        "events": (
            ("Quiet Feet Bouldering", "A technique session built around balance, precise feet, and sharing useful beta."),
            ("Belay & Belong Evening", "Practice communication, swap routes, and make room for climbers joining for the first time."),
            ("Project Picnic", "Work on one project together, rest well, and trade ideas over a relaxed snack break."),
        ),
        "map_event": ("Urban Climbing Mobility", "A short mobility and grip-strength session outdoors, followed by route planning."),
    },
    "chess": {
        "profile": "Curiosity, pattern recognition, and the grace to learn from a surprising move are the real opening theory.",
        "group_name": "Open File Vienna",
        "group_description": "A chess table for thoughtful games, friendly analysis, and players who enjoy explaining an idea.",
        "events": (
            ("Endgame Espresso", "Bring a favourite endgame, solve a few positions, and play a relaxed rapid set."),
            ("Tactical Lanterns", "A practical evening of patterns, puzzles, and short games with time to review."),
            ("Queenside Picnic", "Casual outdoor boards, gentle clocks, and conversation between every round."),
        ),
        "map_event": ("Vienna Boardwalk Blitz", "A portable-board session with friendly blitz games and a little post-game analysis."),
    },
    "badminton": {
        "profile": "Light feet, early preparation, and a rally that suddenly turns into a grin are what keep the court fun.",
        "group_name": "Shuttlecraft Vienna",
        "group_description": "A badminton circle for lively doubles, useful drills, and easy partner rotations.",
        "events": (
            ("Doubles Rotation Lab", "Work on court coverage, communication, and quick rotations before friendly games."),
            ("Net Play & Nice People", "A social session focused on touch, control, and welcoming anyone new to the court."),
            ("Clear to Smash Evening", "Build the rally from a reliable clear, then add pressure when the opening appears."),
        ),
        "map_event": ("Shuttle & Stretch Session", "A light outdoor footwork session with mobility, coordination games, and doubles planning."),
    },
    "volleyball": {
        "profile": "Good communication, a brave save, and the moment a team finds its rhythm make every rally meaningful.",
        "group_name": "Rally Neighbours",
        "group_description": "A volleyball group for kind communication, rotating teams, and rallies that stay fun for everyone.",
        "events": (
            ("Serve-Receive Social", "Settle into passing patterns, rotate often, and finish with balanced games."),
            ("Block, Cover, Repeat", "A practical session on reading the hitter, covering teammates, and resetting quickly."),
            ("Sunset Sand Tactics", "Playful beach-style games with flexible teams and a friendly competitive spark."),
        ),
        "map_event": ("Vienna Rally Circle", "A casual outdoor volleyball warm-up with coordination games and optional small-sided play."),
    },
    "rowing": {
        "profile": "A shared rhythm, a quiet stretch of water, and eight small improvements add up to a very good session.",
        "group_name": "River Rhythm",
        "group_description": "A rowing circle for steady technique, honest effort, and the calm focus of moving together.",
        "events": (
            ("Catch & Drive Clinic", "Break down the stroke, find a cleaner connection, and build the rate gradually."),
            ("Dawn Erg Exchange", "Share a manageable erg set, compare pacing notes, and leave with one useful cue."),
            ("River Rhythm Social", "A relaxed outing for experienced crews and curious newcomers to meet the boat."),
        ),
        "map_event": ("Waterside Rowing Reset", "A mobility and pacing session by the water for anyone preparing for their next row."),
    },
    "martial_arts": {
        "profile": "Discipline, balance, and a training partner who helps you improve are more valuable than a loud victory.",
        "group_name": "Quiet Power Dojo",
        "group_description": "A respectful martial-arts practice for fundamentals, controlled rounds, and steady progress.",
        "events": (
            ("Balance Before Speed", "Refine stance, movement, and distance before adding the faster combinations."),
            ("Technical Rounds Circle", "Controlled partner rounds with clear goals, feedback, and plenty of recovery."),
            ("Discipline in the Park", "A gentle outdoor practice mixing mobility, fundamentals, and a calm finish."),
        ),
        "map_event": ("Vienna Fundamentals Walk", "A mindful conditioning walk with balance drills, mobility, and technique notes."),
    },
    "dance": {
        "profile": "Musicality, a generous partner, and the freedom to try a new step are the ingredients of a good floor.",
        "group_name": "Moving Stories",
        "group_description": "A dance community for musicality, shared practice, and steps that feel good before they look perfect.",
        "events": (
            ("Musicality in Motion", "Listen for the small accents, explore a few phrases, and let the body find the beat."),
            ("Partnerwork Playground", "Rotate partners, learn a simple pattern, and leave room for your own style."),
            ("Golden Hour Freestyle", "A relaxed outdoor session for improvisation, smiles, and a soundtrack chosen together."),
        ),
        "map_event": ("Vienna Movement Jam", "A short outdoor movement class followed by an open, welcoming freestyle circle."),
    },
    "hiking": {
        "profile": "A well-marked trail, a changing view, and enough time to notice the little things make the walk worthwhile.",
        "group_name": "Trail Notes",
        "group_description": "A hiking circle for scenic routes, sensible pacing, and leaving every trail better than we found it.",
        "events": (
            ("Kahlenberg View Walk", "A steady climb with photo pauses, route notes, and a comfortable descent together."),
            ("Forest Pace & Forage", "Follow a quiet trail, swap local nature knowledge, and keep the pace conversational."),
            ("Sunset Ridge Ramble", "An easy evening hike with a shared viewpoint and a safe return before dark."),
        ),
        "map_event": ("Vienna Trail Sampler", "A city-edge walk connecting green spaces, gentle climbs, and a picnic-friendly finish."),
    },
    "strength": {
        "profile": "Consistent basics, good technique, and celebrating the small plate on the bar make strength training sustainable.",
        "group_name": "Strong Foundations",
        "group_description": "A strength community for patient progression, clean form, and training plans that fit real life.",
        "events": (
            ("Technique Before Load", "Practice the main lifts with useful cues, sensible options, and no pressure to max out."),
            ("Carry, Hinge, Recover", "A practical full-body circuit with room to scale every movement to your day."),
            ("Sunday Strength Social", "Train the basics, compare notes, and finish with a mobility block and a good chat."),
        ),
        "map_event": ("Outdoor Strength Circuit", "A bodyweight and carry circuit in the park with clear progressions for every level."),
    },
    "yoga": {
        "profile": "Breath-led movement, a little patience, and leaving the mat calmer than you arrived are goals worth repeating.",
        "group_name": "Breath & Balance",
        "group_description": "A gentle yoga circle for mobility, breath, and practices that meet people where they are.",
        "events": (
            ("Sunrise Mobility Flow", "A breath-led sequence for waking the joints and starting the day with space."),
            ("Hips, Hamstrings, Ease", "A friendly mobility class with options to soften, strengthen, or simply breathe."),
            ("Restore by the River", "A slow evening practice with longer holds and a quiet closing meditation."),
        ),
        "map_event": ("Vienna Breath Break", "A short outdoor mobility and breathing practice for a calmer pause in the day."),
    },
}


class Command(BaseCommand):
    help = "Create an idempotent local activity dataset for testing event and group pagination."

    def add_arguments(self, parser):
        parser.add_argument(
            "--events-per-user",
            type=int,
            default=4,
            help="Events to create per sample athlete (the first one is in the past).",
        )
        parser.add_argument(
            "--members-per-group",
            type=int,
            default=5,
            help="Additional sample members to add to each group.",
        )
        parser.add_argument(
            "--password",
            default="demo-pass-123",
            help="Password assigned only when a sample account is first created.",
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
            self._remove_legacy_dataset(users)
            groups = self._seed_groups(users, members_per_group)
            events = self._seed_events(users, groups, events_per_user)
            individual_events = self._seed_individual_events(users)

        self.stdout.write(self.style.SUCCESS("Sample activity data is ready."))
        self.stdout.write(f"Sample users:  {len(users)}")
        self.stdout.write(f"Sample groups: {len(groups)}")
        self.stdout.write(
            f"Sample events: {len(events) + len(individual_events)} "
            f"({events_per_user - 1} future per user plus {len(individual_events)} individual events)"
        )
        self.stdout.write(f"Password for newly created sample accounts: {password}")

    def _seed_users(self, user_model, password):
        users = []
        for index, (username, first_name, last_name, sport) in enumerate(ATHLETES):
            copy = SPORT_COPY[sport]
            defaults = {
                "email": f"{username}@example.test",
                "first_name": first_name,
                "last_name": last_name,
                "district": DISTRICT_CODES[index % len(DISTRICT_CODES)],
                "bio": (
                    f"{copy['profile']} {first_name} is always happy to welcome "
                    "a new training partner in Vienna."
                ),
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
            copy = SPORT_COPY[sport]
            levels = self._levels_for(index)
            group_name = f"{user.first_name}'s {copy['group_name']}"
            defaults = {
                "description": (
                    f"{copy['group_description']} {user.first_name} keeps sessions "
                    "welcoming for every level."
                ),
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
            copy = SPORT_COPY[sport]
            venue = VENUES[index % len(VENUES)]
            level = self._levels_for(index)[0]
            for event_index in range(events_per_user):
                event_idea = copy["events"][event_index % len(copy["events"])]
                if event_index == 0:
                    start_at = now - timedelta(days=2 + index % 5)
                    title = f"Replay · {user.first_name}'s {event_idea[0]}"
                else:
                    start_at = now + timedelta(
                        days=2 + event_index * 2 + index % 5,
                        hours=(index * 3) % 8,
                    )
                    edition = ("Dawn edition", "Sunset edition", "Weekend edition")[(event_index - 1) % 3]
                    title = f"{user.first_name}'s {event_idea[0]} · {edition}"
                    if event_index > 3:
                        title += f" #{event_index - 3}"
                description = (
                    f"{event_idea[1]} {user.first_name} {user.last_name} is hosting "
                    f"at {venue[0]}. Bring water, arrive ten minutes early, and make "
                    "space for all experience levels."
                )
                if event_index == 0:
                    description += " Kept in activity history as a replay."
                defaults = {
                    "description": description,
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
            copy = SPORT_COPY[sport]
            venue = VENUES[(event_number + 7) % len(VENUES)]
            title = f"{user.first_name}'s {copy['map_event'][0]}"
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
                        f"{copy['map_event'][1]} Meet at {venue[0]}; {user.first_name} "
                        f"{user.last_name} will keep the pace friendly and practical."
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
    def _remove_legacy_dataset(users):
        """Remove rows created by older versions before writing creative copy.

        The old command used the title/description text as its only marker. We
        limit cleanup to the dedicated ``*_demo`` accounts so a local user's
        own groups and events are never touched.
        """

        Event.objects.filter(creator__in=users).filter(
            Q(description__startswith="Pagination demo event hosted by")
            | Q(description__startswith="Individual map demo event hosted by")
        ).delete()
        Group.objects.filter(
            owner__in=users,
            description__startswith="A pagination demo group hosted by",
        ).delete()

    @staticmethod
    def _levels_for(index):
        level_sets = (
            ["beginner", "intermediate"],
            ["intermediate", "advanced"],
            ["advanced"],
            ["all"],
        )
        return level_sets[index % len(level_sets)]
