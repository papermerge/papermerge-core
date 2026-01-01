import typer
from rich import print
from typing_extensions import Annotated

app = typer.Typer(help="Sign URLs for cloud storage")

ValidFor = Annotated[
    int,
    typer.Argument(help='Number of seconds the url will be valid for')
]


@app.command()
def cf_sign_url(url: str, valid_for: ValidFor = 600):
    """Sign URL using AWS CloudFront signer"""
    from papermerge.storage.backends.cloudfront import sign_url
    result = sign_url(url, valid_for)
    print(f"Signed URL: {result}")


@app.command()
def r2_sign_url(object_key: str, valid_for: ValidFor = 600):
    """Generate presigned URL for Cloudflare R2 object"""
    from papermerge.storage.backends.r2 import R2Backend
    backend = R2Backend()
    result = backend._generate_presigned_url(object_key, valid_for)
    print(f"Presigned URL: {result}")
