from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.utils import timezone

from events.models import Event


class Command(BaseCommand):
    help = "Load the committed eval snapshot (users, events, groups, chats)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Wipe the database first and reload the snapshot.",
        )

    def handle(self, *args, **options):
        user_model = get_user_model()

        if options["flush"]:
            call_command("flush", interactive=False)
            call_command("loaddata", "eval_snapshot")
            self._reset_sequences()
            self.stdout.write(self.style.SUCCESS("Eval snapshot is loaded."))
        elif user_model.objects.exists():
            self.stdout.write("Database already has users; skip seed.")
        else:
            call_command("loaddata", "eval_snapshot")
            self._reset_sequences()
            self.stdout.write(self.style.SUCCESS("Eval snapshot is loaded."))

        shifted = self._shift_event_dates()
        if shifted:
            self.stdout.write(
                f"Shifted {shifted} seeded event(s) so they remain in the future."
            )

    def _shift_event_dates(self):
        events = list(Event.objects.only("id", "start_at", "end_at"))
        if not events:
            return 0

        now = timezone.now()
        min_start = min(event.start_at for event in events)
        target_min = now + timedelta(days=1)
        if min_start >= target_min:
            return 0

        shift = target_min - min_start
        for event in events:
            event.start_at += shift
            event.end_at += shift

        Event.objects.bulk_update(events, ["start_at", "end_at"])
        return len(events)

    def _reset_sequences(self):
        from django.apps import apps
        from django.core.management.color import no_style
        from django.db import connection

        sequence_sql = connection.ops.sequence_reset_sql(no_style(), apps.get_models())
        if not sequence_sql:
            return
        with connection.cursor() as cursor:
            for statement in sequence_sql:
                cursor.execute(statement)
