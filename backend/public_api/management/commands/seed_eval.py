from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import BaseCommand


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
        elif user_model.objects.exists():
            self.stdout.write("Database already has users; skip seed.")
            return

        call_command("loaddata", "eval_snapshot")
        self._reset_sequences()
        self.stdout.write(self.style.SUCCESS("Eval snapshot is loaded."))

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
