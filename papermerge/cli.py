"""
Papermerge CLI - Main entry point with automatic command discovery.

This module automatically discovers and registers CLI commands from:
1. Feature modules (papermerge.core.features.<feature>.cli)
2. Core CLI modules (papermerge.core.cli.<module>)
3. Additional packages (papermerge.search.cli)

Commands are discovered Django-style: any module with an 'app' attribute
containing a typer.Typer instance will be automatically registered.
"""
import logging
from pathlib import Path

import typer

from papermerge.core.cli_loader import (
    discover_cli_apps,
    discover_core_cli_apps,
    discover_additional_cli_apps,
)

# Set up logging
logging.basicConfig(level=logging.WARN)
logger = logging.getLogger(__name__)

# Create main CLI app
app = typer.Typer(
    help="Papermerge DMS command line management tool",
    no_args_is_help=True,
)


def register_cli_commands():
    """
    Automatically discover and register all CLI commands.

    Discovery order:
    1. Core CLI commands (perms, scopes, token, etc.)
    2. Feature CLI commands (users, groups, etc.)
    3. Additional CLI commands (search, index, etc.)
    """
    # Get the base paths
    current_file = Path(__file__)
    core_path = current_file.parent / "core"
    core_cli_path = core_path / "cli"

    registered_count = 0

    # 1. Discover and register core CLI commands (non-feature commands)
    logger.debug("Discovering core CLI commands...")
    core_cli_apps = discover_core_cli_apps(core_cli_path)
    for cli_app, name in core_cli_apps:
        app.add_typer(cli_app, name=name)
        logger.info(f"Registered core CLI command: {name}")
        registered_count += 1

    # 2. Discover and register feature CLI commands
    logger.debug("Discovering feature CLI commands...")
    feature_cli_apps = discover_cli_apps(core_path)
    for cli_app, name in feature_cli_apps:
        app.add_typer(cli_app, name=name)
        logger.info(f"Registered feature CLI command: {name}")
        registered_count += 1

    # 3. Discover and register additional CLI commands from other packages
    logger.debug("Discovering additional CLI commands...")
    additional_paths = [
        "papermerge.search.cli",  # Search-related commands
    ]
    additional_cli_apps = discover_additional_cli_apps(additional_paths)
    for cli_app, name in additional_cli_apps:
        app.add_typer(cli_app, name=name)
        logger.info(f"Registered additional CLI command: {name}")
        registered_count += 1

    logger.info(f"Total CLI commands registered: {registered_count}")


def main():
    import sys
    from pydantic import ValidationError
    try:
        from papermerge.core.config import get_settings
        get_settings()
    except ValidationError as e:
        logger.error(e)
        sys.exit(1)

    register_cli_commands()
    app()


if __name__ == "__main__":
    main()
