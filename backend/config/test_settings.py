from .settings import *

# Use SQLite for testing
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Use Argon2id for testing (with reduced memory/time cost)
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
]

# Configure Argon2id for faster testing
ARGON2_TIME_COST = 1  # Default is 2
ARGON2_MEMORY_COST = 1024  # Default is 65536
ARGON2_PARALLELISM = 1  # Default is 4

# Disable email sending during tests
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend' 