import os

import typer
from rich import print_json
from salinic import SchemaManager, create_engine

from papermerge.search.schema import SearchIndex

app = typer.Typer(help="Index Schema Management")


@app.command(name="apply")
def apply_cmd(dry_run: bool = False):
    """Apply schema fields"""
    schema_manager = get_schema_manager()

    if dry_run:
        print_json(data=schema_manager.apply_dict_dump())
    else:
        schema_manager.apply()


@app.command(name="delete")
def delete_cmd(dry_run: bool = False):
    """Delete schema fields"""
    schema_manager = get_schema_manager()

    if dry_run:
        print_json(data=schema_manager.delete_dict_dump())
    else:
        schema_manager.delete()


@app.command(name="create")
def create_cmd(dry_run: bool = False):
    """Create schema fields"""
    schema_manager = get_schema_manager()

    if dry_run:
        print_json(data=schema_manager.create_dict_dump())
    else:
        schema_manager.create()


def get_schema_manager():
    search_url = os.environ.get("PAPERMERGE__SEARCH__URL")
    if not search_url:
        raise ValueError("missing PAPERMERGE__SEARCH__URL")

    engine = create_engine(search_url)
    return SchemaManager(engine, model=SearchIndex)
