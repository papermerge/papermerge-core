import boto3
from botocore.config import Config

from papermerge.core import config

settings = config.get_settings()


class GenericS3Storage:
    def __init__(self):
        self.client = boto3.client(
            "s3",
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region_name,
            endpoint_url=settings.aws_endpoint_url,
            config=Config(signature_version="s3v4"),
        )

    def sign_url(self, path: str, valid_for: int) -> str:

        return self.client.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": settings.papermerge__s3__bucket_name, "Key": path},
            ExpiresIn=valid_for,
        )
