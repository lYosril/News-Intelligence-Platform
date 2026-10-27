"""Tests for the wait_for_db management command."""

from io import StringIO
from unittest import mock

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase

from apps.core.management.commands import wait_for_db as wait_for_db_module
from apps.core.tests.helpers import unreachable_connection


class WaitForDbTests(TestCase):
    def test_succeeds_when_database_is_available(self) -> None:
        stdout = StringIO()

        call_command("wait_for_db", "--timeout", "5", "--interval", "0.1", stdout=stdout)

        self.assertIn("Database ready", stdout.getvalue())

    def test_fails_when_database_is_unreachable(self) -> None:
        # The command's connection is swapped for a real wrapper pointing at
        # a closed port, so the underlying connection failure is genuine.
        with mock.patch.object(wait_for_db_module, "connection", unreachable_connection()):
            with self.assertRaises(CommandError):
                call_command(
                    "wait_for_db",
                    "--timeout",
                    "0",
                    "--interval",
                    "0",
                    stdout=StringIO(),
                )

    def test_failure_message_does_not_include_connection_details(self) -> None:
        with mock.patch.object(wait_for_db_module, "connection", unreachable_connection()):
            with self.assertRaises(CommandError) as ctx:
                call_command(
                    "wait_for_db",
                    "--timeout",
                    "0",
                    "--interval",
                    "0",
                    stdout=StringIO(),
                )

        message = str(ctx.exception)
        self.assertNotIn("unreachable", message)
        self.assertNotIn("password", message.lower())
