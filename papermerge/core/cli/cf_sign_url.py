import typer
from rich import print
from typing_extensions import Annotated

from papermerge.core import cloudfront

app = typer.Typer(help="List various entities")

ValidFor = Annotated[
    int,
    typer.Argument(help='Number of seconds the url will be valid for')
]


@app.command()
def cf_sign_url(url: str, valid_for: ValidFor = 600):
    """Sign URL using AWS CloudFront signer"""
    result = cloudfront.sign_url(url, valid_for)
    print(f"Signed URL: {result}")
