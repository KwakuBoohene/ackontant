from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.db import DEFAULT_DB_ALIAS

User = get_user_model()

class Command(BaseCommand):
    help = 'Used to create a superuser with synchronized email and username.'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.UserModel = get_user_model()
        self.username_field = self.UserModel._meta.get_field(self.UserModel.USERNAME_FIELD)

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            help='Specifies the email address for the superuser.',
        )
        parser.add_argument(
            '--password',
            help='Specifies the password for the superuser.',
        )
        parser.add_argument(
            '--noinput', '--no-input',
            action='store_false',
            dest='interactive',
            help=(
                'Tells Django to NOT prompt the user for input of any kind. '
                'You must use --email with --noinput, along with an option for '
                'any other required field. Superusers created with --noinput will '
                'not be able to log in until they\'re given a valid password.'
            ),
        )
        parser.add_argument(
            '--database',
            default=DEFAULT_DB_ALIAS,
            help='Specifies the database to use. Default is "default".',
        )

    def handle(self, *args, **options):
        email = options.get('email')
        password = options.get('password')
        database = options.get('database')

        if not email and options['interactive']:
            email = self.get_input_data(self.username_field, 'Email address')
            while self.UserModel._default_manager.db_manager(database).filter(email=email).exists():
                self.stderr.write("Error: That email address is already taken.")
                email = self.get_input_data(self.username_field, 'Email address')

        if not password and options['interactive']:
            password = self.get_input_data('password', 'Password')
            password2 = self.get_input_data('password', 'Password (again)')
            while password != password2:
                self.stderr.write("Error: Your passwords didn't match.")
                password = self.get_input_data('password', 'Password')
                password2 = self.get_input_data('password', 'Password (again)')

        try:
            self.UserModel._default_manager.db_manager(database).create_superuser(
                email=email,
                username=email,  # Set username same as email
                password=password,
            )
            if options['verbosity'] >= 1:
                self.stdout.write("Superuser created successfully.")
        except Exception as e:
            raise CommandError("Error: %s" % e)

    def get_input_data(self, field, message, default=None):
        """
        Override this method if you want to customize data inputs or
        validation exceptions.
        """
        raw_value = input(message)
        if default and raw_value == '':
            raw_value = default
        try:
            val = field.clean(raw_value, None)
        except Exception as e:
            self.stderr.write("Error: %s" % e)
            val = None

        return val 