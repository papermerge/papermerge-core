import ssl
import email
import logging

from imapclient import IMAPClient
from imapclient.exceptions import LoginError
from imapclient.response_types import BodyData
from email.message import EmailMessage

from django.db.models import Q

from papermerge.core.import_pipeline import IMAP, go_through_pipelines
from papermerge.core.models import User


logger = logging.getLogger(__name__)


def login(imap_server, username, password):
    """
    Login to provided IMAP server.

    All arguments :imap_server:, :username: and :password:
    are string instances.

    On successful login returns a non empty ``imapclient.IMAPClient`` instance.
    """

    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    imap_client = IMAPClient(
        imap_server,
        ssl_context=ssl_context
    )

    try:
        imap_client.login(username, password)
    except LoginError:
        logger.error(
            "IMAP Import: ERROR. Login failed."
        )
        return None

    return imap_client


def trigger_document_pipeline(
    email_message: EmailMessage,
    user=None,
    skip_ocr=False
):
    """
    email_message is instance of ``email.message.EmailMessage``.
    Where email package is python standard (for python >= 3.6)
    library for managing email messages.
    """
    ingested = False

    if not isinstance(email_message, EmailMessage):
        raise ValueError("Expecting email.message.EmailMessage instance")

    for part in email_message.iter_attachments():
        try:
            payload = part.get_content()
        except KeyError:
            continue
        init_kwargs = {'payload': payload, 'processor': IMAP}
        apply_kwargs = {
            'user': user,
            'name': part.get_filename(),
            'skip_ocr': skip_ocr
        }
        doc = go_through_pipelines(init_kwargs, apply_kwargs)
        if doc is not None and not ingested:
            ingested = True

    return ingested


def contains_attachments(structure):

    if isinstance(structure, BodyData):
        if structure.is_multipart:
            for part in structure:
                if isinstance(part, list):
                    for element in part:
                        if contains_attachments(element):
                            return True
        try:
            if isinstance(
                structure[8],
                tuple
            ) and structure[8][0] == b'attachment':
                return True
        except IndexError:
            return False
    return False


def get_secret(str_or_list):
    """
    Find and returns mail secret.

    Mail secret uses following format:

        SECRET{ some-secret }

    note that there are no spaces between all capitalized keyword
    SECRET and immediately following it curly brackets.
    However, the text inside curly brackets can be surrounded by white
    spaces. In example above ``get_secret``
    function returns "some-secret" string.

    :str_or_list: argument can be either a string of a list of
    strings.
    """

    text = str_or_list

    if isinstance(str_or_list, list):
        text = "\n".join(str_or_list)

    try:
        message_secret = text.split('SECRET{')[1].split('}')[0]
    except IndexError:
        message_secret = None

    if message_secret:
        message_secret = message_secret.strip()

    return message_secret


def match_by_user(to_field, from_field):
    """
    Returns first user with email address matching to_field or from_field.

    Note that search is perfomed only on users with ``mail_by_user`` attribute
    set to True.
    :user: is instance of ``papermerge.core.models.User``
    :to_field: and :from_field: are email addresses as string.

    If no user matches - returns None.
    """

    user_found = User.objects.filter(
        Q(email=from_field) | Q(email=to_field)
    ).first()

    if user_found and user_found.preferences['email_routing__by_user']:
        logger.debug(
            f"{IMAP} importer: found user {user_found} from email"
        )
        return user_found

    return None


def match_by_secret(message_secret):
    """
    Returns first user with matching mail_secret.

    :user: is instance of ``papermerge.core.models.User``
    Search is performed only on users with ``mail_by_secret`` flag set to
    True.
    If no user matches - returns None.
    """
    user_found = User.objects.filter(
        userpreferencemodel__section="email_routing",
        userpreferencemodel__name="mail_secret",
        userpreferencemodel__raw_value=message_secret,
    ).first()

    if user_found and user_found.preferences['email_routing__by_secret']:
        logger.debug(
            f"{IMAP} importer: found user {user_found} from secret"
        )
        return user_found

    return None


def get_matching_user(
    email_message: EmailMessage,
    by_user=False,
    by_secret=False
):
    """
    Returns ``papermerge.core.models.User`` instance
    of the user for whom given email message is addressed.

    email_message is instance of ``email.message.EmailMessage``.
    Where email package is python standard (for python >= 3.6)
    library for managing email messages.

    Will return None when no user matched.
    """

    body_text = None
    user_found = None

    if not isinstance(email_message, EmailMessage):
        raise ValueError("Expecting email.message.EmailMessage instance")

    from_field = email.utils.parseaddr(
        email_message.get('From'))[1]

    to_field = email.utils.parseaddr(
        email_message.get('To'))[1]

    body = email_message.get_body()

    if body is not None:
        body_text = body.as_string()

    subject_text = email_message.get('Subject')

    # secret can be in body or in subject
    message_secret = get_secret(
        [body_text, subject_text]
    )

    if by_user:
        user_found = match_by_user(
            to_field=to_field,
            from_field=from_field
        )

    # matched by_user?
    if user_found:
        # yes, it matched, just return.
        return user_found

    if by_secret and message_secret is not None:
        user_found = match_by_secret(message_secret)

    return user_found


def select_inbox(
    imap_client,
    inbox_name,
    readonly=False
):
    """
    Thin layer over imap_client.select_folder function
    """
    if not isinstance(imap_client, IMAPClient):
        raise ValueError("Expecting IMAPClient instance as first argument")

    try:
        imap_client.select_folder(
            inbox_name,
            readonly=False
        )
    except Exception:
        logger.error(
            f"IMAP import: Failed to select folder. "
            f"Maybe user needs read write access to the folder "
            f"\"{inbox_name}\"?"
        )
        return

    return imap_client


def email_iterator(
    imap_client: IMAPClient,
    delete=False
):
    """
    Generator used for lazy iteration over
    all UNEED email massages WITH attachment.

    Yields ``email.message.EmailMessage`` instances.
    Where email package is python standard (for python >= 3.6)
    library for managing email messages.
    """

    if not isinstance(imap_client, IMAPClient):
        raise ValueError("Expecting IMAPClient instance as first argument")

    messages = imap_client.search(['UNSEEN'])

    logger.debug(
        f"IMAP Import: UNSEEN messages {len(messages)} count"
    )

    messages_structure = imap_client.fetch(messages, ['BODYSTRUCTURE'])

    for uid, structure in messages_structure.items():
        if not contains_attachments(structure[b'BODYSTRUCTURE']):
            messages.remove(uid)

    for uid, message_data in imap_client.fetch(messages, ['RFC822']).items():
        body = message_data[b'RFC822']
        email_message = email.message_from_bytes(
            body,
            policy=email.policy.default
        )
        yield email_message

    if delete:
        imap_client.delete_messages(messages)


def import_attachment(
    imap_server: str,
    username: str,
    password: str,
    delete=False,
    inbox_name="INBOX",
    by_user=False,
    by_secret=False
):
    imap_client = login(
        imap_server=imap_server,
        username=username,
        password=password
    )

    if not imap_client:
        logger.info(
            f"IMAP import: Failed to login to imap server {imap_server}."
            " Please double check IMAP account credentials."
        )
        return

    imap_client = select_inbox(imap_client, inbox_name)

    for email_message in email_iterator(imap_client, delete=delete):
        user = get_matching_user(
            email_message,
            by_user=by_user,
            by_secret=by_secret
        )
        trigger_document_pipeline(
            email_message=email_message,
            user=user
        )
