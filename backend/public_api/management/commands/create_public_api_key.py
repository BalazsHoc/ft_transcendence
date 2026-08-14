from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db.models import Q

from public_api.models import PublicAPIKey


class Command(BaseCommand):
    help = "Issue a public API key and print the raw key once."

    def add_arguments(self, parser):
        parser.add_argument("--name", required=True, help="Human-readable consumer name.")
        parser.add_argument(
            "--created-by",
            help="Optional username or email of the administrator issuing the key.",
        )

    def handle(self, *args, **options):
        created_by = None
        created_by_value = options.get("created_by")
        if created_by_value:
            user_model = get_user_model()
            created_by = user_model.objects.filter(
                Q(username=created_by_value) | Q(email__iexact=created_by_value)
            ).first()
            if created_by is None:
                raise CommandError(f"No user found for --created-by={created_by_value!r}.")

        key, raw_key = PublicAPIKey.issue(
            name=options["name"],
            created_by=created_by,
        )
        self.stdout.write(self.style.SUCCESS("Public API key created."))
        self.stdout.write(f"Name:   {key.name}")
        self.stdout.write(f"Prefix: {key.prefix}")
        self.stdout.write("Key (save it now; it cannot be recovered later):")
        self.stdout.write(raw_key)
