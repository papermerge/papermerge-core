from datetime import datetime, timedelta
from pathlib import Path

import rsa
from botocore.signers import CloudFrontSigner
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

    private_key = open(key_path, 'r').read()
    ret = rsa.sign(
        message,
        rsa.PrivateKey.load_pkcs1(private_key.encode('utf8')),
        'SHA-1'
    )  # CloudFront requires SHA-1 hash

    return ret


def sign_url(url: str, valid_for: int = 600):
    """
    :type url: str
    :param url: The URL of the protected object

    :type valid_for: int
    :param valid_for: number of seconds the url will be valid for, defaults
        to 600 (i.e. 10 minutes)
    """
    key_id = getattr(settings, 'CF_SIGN_URL_KEY_ID', None)
    if key_id is None:
        raise ValueError(
            "CF_SIGN_URL_KEY_ID is empty"
        )
    cf_signer = CloudFrontSigner(
        key_id,
        rsa_signer
    )
    date_less_than = datetime.now() + timedelta(minutes=valid_for)
    signed_url = cf_signer.generate_presigned_url(
        url,
        date_less_than=date_less_than
    )
    return signed_url
