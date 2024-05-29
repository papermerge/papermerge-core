from datetime import datetime, timedelta
from pathlib import Path

import pytz
from botocore.signers import CloudFrontSigner
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from django.conf import settings


def rsa_signer(message):
    _kpath = getattr(settings, 'CF_SIGN_URL_PRIVATE_KEY', None)
    if _kpath is None:
        raise ValueError(
            "Missing CF_SIGN_URL_PRIVATE_KEY setting"
        )

    key_path = Path(_kpath)
    if not key_path.exists():
        raise ValueError(
            f"{key_path} does not exist"
        )

    with open(key_path, 'rb') as key_file:
        private_key = serialization.load_pem_private_key(
            key_file.read(),
            password=None,
            backend=default_backend()
        )
    return private_key.sign(message, padding.PKCS1v15(), hashes.SHA1())


def sign_url(url: str, valid_for: int = 600):
    """
    :type url: str
    :param url: The URL of the protected object

    :type valid_for: int
    :param valid_for: number of seconds the url will be valid for, defaults
        to 600 (i.e. 10 minutes)
    """
    key_id = getattr(settings, 'CF_SIGN_URL_KEY_ID', None)
    tz = pytz.timezone(
        getattr(settings, 'TIMEZONE', 'Europe/Berlin')
    )
    if key_id is None:
        raise ValueError(
            "CF_SIGN_URL_KEY_ID is empty"
        )
    cf_signer = CloudFrontSigner(key_id, rsa_signer)
    date_less_than = datetime.now(tz) + timedelta(seconds=valid_for)
    signed_url = cf_signer.generate_presigned_url(
        url,
        date_less_than=date_less_than
    )
    return signed_url
