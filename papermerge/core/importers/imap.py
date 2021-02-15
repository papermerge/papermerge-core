import ssl
import email
import logging
from imapclient import IMAPClient
from imapclient.exceptions import LoginError
from imapclient.response_types import BodyData
from email.message import EmailMessage

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
    """

    extracted_by_user = False
    user = None
    user_found = None
    body_text = None

    if not isinstance(email_message, EmailMessage):
        raise ValueError("Expecting email.message.EmailMessage instance")

    sender_address = email.utils.parseaddr(
        email_message.get('From'))[1]
    body = email_message.get_body()

    if body is not None:
        body_text = body.as_string()
    email_main_text = [email_message.get('Subject'), body_text]
    try:
        message_secret = '\n'.join([
            text for text in email_main_text if text
        ]).split('SECRET{')[1].split('}')[0]
    except IndexError:
        message_secret = None

    if message_secret:
        message_secret = message_secret.strip()

    # Priority to sender address
    if by_user:
        user_found = User.objects.filter(
            email=sender_address
        ).first()
        logger.debug(f"{IMAP} importer: found user {user_found} from email")
    if user_found and user_found.mail_by_user:
        user = user_found
        extracted_by_user = True

    # Then check secret
    if not extracted_by_user and by_secret and message_secret is not None:
        user_found = User.objects.filter(
            mail_secret=message_secret
        ).first()
        logger.debug(f"{IMAP} importer: found user {user_found} from secret")
    if user_found and user_found.mail_by_secret:
        user = user_found

    # Otherwise put it into first superuser's inbox
    return user


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
