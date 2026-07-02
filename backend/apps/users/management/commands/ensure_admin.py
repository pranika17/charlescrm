from django.core.management.base import BaseCommand, CommandError

from apps.users.models import User


class Command(BaseCommand):
    help = "Create or reset an owner admin account."

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True)
        parser.add_argument("--password", required=True)
        parser.add_argument("--full-name", default="CharlesCRM Admin")
        parser.add_argument("--username", default="")

    def handle(self, *args, **options):
        email = options["email"].strip().lower()
        password = options["password"]
        full_name = options["full_name"].strip() or "CharlesCRM Admin"
        username = options["username"].strip() or email.split("@")[0]

        if not email:
            raise CommandError("Admin email is required.")
        if len(password) < 8:
            raise CommandError("Admin password must be at least 8 characters.")

        user, created = User.objects.update_or_create(
            email=email,
            defaults={
                "username": username,
                "full_name": full_name,
                "role": User.Role.OWNER,
                "is_active": True,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        user.set_password(password)
        user.save()

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} admin user: {email}"))
