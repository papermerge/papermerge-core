import os
import subprocess

from django.core.checks import Warning, register

from .app_settings import settings


USED_BINARIES = {
    settings.BINARY_FILE: {
        "msg": (
            "Without it, Papermerge won't be"
            " "
            "able to learn file mime type"),
        "option": "-v"
    },
    settings.BINARY_CONVERT: {
        "msg": (
            "Without it, image resizing is not possible"
        ),
        "option": "-v"
    },
    settings.BINARY_OCR: {
        "msg": (
            "Without it, OCR of the documents is impossible"
        ),
        "option": "-v"
    },
    settings.BINARY_IDENTIFY: {
        "msg": (
            "Without it, it is not possible to count pages in TIFF"
        ),
        "option": "-v"
    },
}


@register()
def binaries_check(app_configs, **kwargs):
    """
    Papermerge requires the existence of a few binaries, so it checks
    if required binaries are available.

    See settings prefixed with BINARY_ defined in mglib.conf.default_settings
    for full list of dependencies.
    """
    error = "Papermerge can't find {}. {}."
    hint = "Either it's not in your PATH or it's not installed."

    check_messages = []
    for binary_path in USED_BINARIES.keys():

        binary = os.path.basename(binary_path)
        option = USED_BINARIES[binary_path]["option"]
        try:
            subprocess.run(
                [binary_path, option],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        except FileNotFoundError:
            check_messages.append(
                Warning(
                    error.format(binary, USED_BINARIES[binary_path]["msg"]),
                    hint
                )
            )

    return check_messages


"""
@register()
def imap_login_check(app_configs, **kwargs):

    host = settings.IMPORT_MAIL_HOST
    user = settings.IMPORT_MAIL_USER
    password = settings.IMPORT_MAIL_PASS

    check_messages = []
    msg = f"Failed to login to IMAP server '{host}'"
    hint =
        Please double check that IMPORT_MAIL_HOST,
        IMPORT_MAIL_USER, IMPORT_MAIL_PASS settings
        are correct.

    if all([host, user, password]):
        try:
            server = imap_login(
                imap_server=host,
                username=user,
                password=password
            )
        except Exception:
            server = None

        if not server:
            check_messages.append(
                Warning(
                    msg,
                    hint
                )
            )

                Warning(
                    msg,
                    hint
                )
            )

    return check_messages
"""
