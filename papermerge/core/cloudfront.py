from datetime import timedelta
from pathlib import Path

from botocore.signers import CloudFrontSigner
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

from papermerge.core.config import settings
from papermerge.core.cache import client as cache
from papermerge.core.utils.tz import utc_now

PEM_PRIVATE_KEY_STRING = "pem-private-key-string"
PEM_PRIVATE_KEY_TTL = 600


def rsa_signer(message):
    private_key_string = cache.get(PEM_PRIVATE_KEY_STRING)

    if private_key_string is not None:
        private_key = serialization.load_pem_private_key(
            private_key_string,
            password=None,
            backend=default_backend()
        )
        return private_key.sign(message, padding.PKCS1v15(), hashes.SHA1())

    _kpath = settings.cf_sign_url_private_key
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
        private_key_string = key_file.read()
        private_key = serialization.load_pem_private_key(
            private_key_string,
            password=None,
            backend=default_backend()
        )
        cache.set(
            PEM_PRIVATE_KEY_STRING,
            private_key_string,
            ex=PEM_PRIVATE_KEY_TTL
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
    key_id = settings.cf_sign_url_key_id

    if key_id is None:
        raise ValueError(
            "CF_SIGN_URL_KEY_ID is empty"
        )
    cf_signer = CloudFrontSigner(key_id, rsa_signer)

    # CloudFront expiration times are always in UTC
    date_less_than = utc_now() + timedelta(seconds=valid_for)
    signed_url = cf_signer.generate_presigned_url(
        url,
        date_less_than=date_less_than
    )
    return signed_url
