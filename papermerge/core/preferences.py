from pytz import common_timezones

from django.conf import settings

from dynamic_preferences.preferences import Section as OrigSection
from dynamic_preferences.types import (
    ChoicePreference,
    BooleanPreference,
    StringPreference
)
from dynamic_preferences.users.registries import user_preferences_registry

from .lib.lang import get_ocr_lang_choices, get_default_ocr_lang


def _get_timezone_choices():
    return list((tz, tz) for tz in common_timezones)

def _is_email_routing_enabled():

    by_user = getattr(
        settings,
        'PAPERMERGE_IMPORT_MAIL_BY_USER',
        False
    )

    by_secret = getattr(
        settings,
        'PAPERMERGE_IMPORT_MAIL_BY_SECRET',
        False
    )
    return by_user or by_secret


class Section(OrigSection):
    """
    Section has following attributes:

        * name
        * verbose_name
        * help_text
        * icon_name
        * visible (default=True)

    If Section has visibility attribute set to False - it won't be
    displayed/visible in User preferences view.
    Example:
    if administrator decides to disable email_routing feature (i.e. he/she
    preferes all incoming email to land in superuser Inbox) with:

        PAPERMERGE_IMPORT_MAIL_BY_USER = False
        PAPERMERGE_IMPORT_MAIL_BY_SECRET = False

    Then, there is no point (it is even confusing) for user to fiddle with
    Email Routing options. From UX poing of view - it is better not to display
    Email Routing section at all.
    """

    def __init__(
        self,
        name,
        verbose_name=None,
        help_text=None,
        icon_name=None,
        visible=True,
    ):
        super().__init__(
            name=name,
            verbose_name=verbose_name
        )
        self.help_text = help_text
        self.icon_name = icon_name
        self.visible = visible


localization = Section(
    'localization',
    verbose_name="Localization",
    icon_name="globe-americas",
    help_text="Timezone, date and time formats"
)

ocr = Section(
    'ocr',
    verbose_name="Opical Character Recognition",
    icon_name="eye",
    help_text="Choose default OCR Language"
)

email_routing = Section(
    'email_routing',
    verbose_name="Email Routing",
    icon_name="envelope-open-text",
    help_text="How email attachments match your Inbox",
    visible=_is_email_routing_enabled()
)


@user_preferences_registry.register
class TimezoneGlobal(ChoicePreference):
    help_text = """
    Timezone
"""
    section = localization
    name = "timezone"
    choices = _get_timezone_choices()
    # fallback value
    default = settings.TIME_ZONE


@user_preferences_registry.register
class OcrLanguage(ChoicePreference):
    help_text = """
    Language used for OCR processing.
"""
    section = ocr
    name = 'OCR_Language'
    choices = get_ocr_lang_choices()
    default = get_default_ocr_lang()


@user_preferences_registry.register
class LocalizationDate(ChoicePreference):
    help_text = """
    Date format
"""
    section = localization
    name = 'date_format'
    choices = (
        ('%Y-%m-%d', '2020-11-25'),
        ('%a %d %b, %Y', 'Wed 25 Nov, 2020'),
        ('%d %b, %Y', '25 Nov, 2020'),
        ('%m/%d/%Y', '11/25/2020'),
        ('%d/%m/%Y', '25/11/2020'),
        ('%d.%m.%y', '25.11.20'),
        ('%d.%m.%Y', '25.11.2020'),
    )
    default = '%Y-%m-%d'


@user_preferences_registry.register
class LocalizationTime(ChoicePreference):
    help_text = """
    Time format
"""
    section = localization
    name = 'time_format'
    choices = (
        ('%I:%M %p', '9:48 PM'),
        ('%H:%M', '21:48'),
    )
    default = '%H:%M'


@user_preferences_registry.register
class EmailRoutingByUser(BooleanPreference):
    help_text = """
    Email attachments will end up in your Inbox
    if incoming email's 'From' or 'To' fields matches your Papermerge user
    email address.
"""
    section = email_routing
    name = "by_user"
    default = False


@user_preferences_registry.register
class EmailRoutingBySecret(BooleanPreference):
    help_text = """
    Email attachments will end up in your will Inbox
    if given secret text is found either in email body or
    in email subject field.
"""
    section = email_routing
    name = "by_secret"
    default = False


@user_preferences_registry.register
class StringPreference(StringPreference):
    help_text = """
    Email secret text used by 'routing by secret' option.
"""
    section = email_routing
    name = "mail_secret"
    default = ""


