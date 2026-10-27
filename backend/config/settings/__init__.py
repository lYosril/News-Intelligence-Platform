"""Settings package.

The active settings module is selected with the ``DJANGO_SETTINGS_MODULE``
environment variable:

* ``config.settings.development`` - local development (default in manage.py)
* ``config.settings.production``  - hardened settings, validates required env vars
* ``config.settings.test``        - pytest-django test settings
"""
