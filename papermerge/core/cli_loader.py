"""
CLI Loader - Automatic discovery of Typer CLI apps from feature modules.

This module provides automatic discovery and loading of CLI commands from feature modules,
similar to how Django discovers management commands. It scans feature directories for
cli.py or cli/cli.py files that contain a Typer app instance.

Usage:
    from papermerge.core.cli_loader import discover_cli_apps

    apps = discover_cli_apps(features_path)
    for cli_app, name in apps:
        main_app.add_typer(cli_app, name=name)
"""

import importlib
import logging
import pkgutil
from pathlib import Path
from typing import List, Tuple

import typer

logger = logging.getLogger(__name__)


def discover_cli_apps(base_path: Path) -> List[Tuple[typer.Typer, str]]:
    """
    Automatically discover and load all CLI apps from feature modules.

    This function scans the features directory and looks for CLI apps in:
    1. papermerge.core.features.<feature_name>.cli (single file)
    2. papermerge.core.features.<feature_name>.cli.cli (module with cli.py)

    Each discovered CLI module must have an 'app' attribute that is a typer.Typer instance.

    Args:
        base_path: Path to the base directory containing 'features' folder

    Returns:
        List of tuples: (typer_app, command_name)

    Example:
        >>> from pathlib import Path
        >>> features_path = Path(__file__).parent / "core"
        >>> apps = discover_cli_apps(features_path)
        >>> for cli_app, name in apps:
        ...     main_app.add_typer(cli_app, name=name)
    """
    cli_apps = []
    features_dir = base_path / "features"

    if not features_dir.exists():
        logger.warning(f"Features directory not found: {features_dir}")
        return cli_apps

    logger.debug(f"Scanning for CLI apps in: {features_dir}")

    # Iterate through all feature directories
    for feature_module in pkgutil.iter_modules([str(features_dir)]):
        if not feature_module.ispkg:
            continue

        feature_name = feature_module.name
        logger.debug(f"Checking feature: {feature_name}")

        # Try pattern 1: papermerge.core.features.<feature_name>.cli
        cli_app = _try_load_cli_module(
            f"papermerge.core.features.{feature_name}.cli",
            feature_name
        )
        if cli_app:
            cli_apps.append(cli_app)
            continue

        # Try pattern 2: papermerge.core.features.<feature_name>.cli.cli
        cli_app = _try_load_cli_module(
            f"papermerge.core.features.{feature_name}.cli.cli",
            feature_name
        )
        if cli_app:
            cli_apps.append(cli_app)

    logger.info(f"Discovered {len(cli_apps)} CLI apps from features")
    return cli_apps


def discover_additional_cli_apps(search_paths: List[Path]) -> List[Tuple[typer.Typer, str]]:
    """
    Discover CLI apps from additional search paths outside the core features.

    This is useful for discovering CLI apps from other packages like papermerge.search.

    Args:
        search_paths: List of module paths to search (e.g., ['papermerge.search.cli'])

    Returns:
        List of tuples: (typer_app, command_name)

    Example:
        >>> apps = discover_additional_cli_apps([
        ...     'papermerge.search.cli',
        ...     'papermerge.storage.cli'
        ... ])
    """
    cli_apps = []

    for module_path_str in search_paths:
        try:
            # Import the base cli module/package
            base_module = importlib.import_module(module_path_str)

            # Get the package path
            if hasattr(base_module, '__path__'):
                # It's a package, scan for submodules
                package_path = base_module.__path__[0]

                for submodule in pkgutil.iter_modules([package_path]):
                    submodule_name = submodule.name
                    full_module_name = f"{module_path_str}.{submodule_name}"

                    cli_app = _try_load_cli_module(
                        full_module_name,
                        submodule_name
                    )
                    if cli_app:
                        cli_apps.append(cli_app)
            else:
                # It's a single module, try to load it directly
                cli_app = _try_load_cli_module(
                    module_path_str,
                    module_path_str.split('.')[-1]
                )
                if cli_app:
                    cli_apps.append(cli_app)

        except (ImportError, AttributeError) as e:
            logger.debug(f"Could not import {module_path_str}: {e}")
            continue

    logger.info(f"Discovered {len(cli_apps)} CLI apps from additional paths")
    return cli_apps


def _try_load_cli_module(
        module_name: str,
        command_name: str
) -> Tuple[typer.Typer, str] | None:
    """
    Try to load a CLI module and extract its typer app.

    Args:
        module_name: Full module path (e.g., 'papermerge.core.features.users.cli')
        command_name: Name to use for the CLI command

    Returns:
        Tuple of (typer_app, command_name) if successful, None otherwise
    """
    try:
        module = importlib.import_module(module_name)

        if not hasattr(module, 'app'):
            logger.debug(f"Module {module_name} has no 'app' attribute")
            return None

        app = getattr(module, 'app')

        if not isinstance(app, typer.Typer):
            logger.warning(
                f"Module {module_name} has 'app' attribute but it's not a "
                f"typer.Typer instance (found {type(app)})"
            )
            return None

        logger.debug(f"Successfully loaded CLI app '{command_name}' from {module_name}")
        return (app, command_name)

    except ImportError as e:
        logger.debug(f"Could not import {module_name}: {e}")
        return None
    except AttributeError as e:
        logger.debug(f"Error accessing app in {module_name}: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error loading {module_name}: {e}")
        return None


def discover_core_cli_apps(core_cli_path: Path) -> List[Tuple[typer.Typer, str]]:
    """
    Discover CLI apps from the core.cli directory (non-feature CLI commands).

    This handles CLI commands that are in papermerge.core.cli directly,
    not inside feature modules. Examples: perms, scopes, token.

    Args:
        core_cli_path: Path to the core/cli directory

    Returns:
        List of tuples: (typer_app, command_name)

    Example:
        >>> core_cli_path = Path(__file__).parent / "core" / "cli"
        >>> apps = discover_core_cli_apps(core_cli_path)
    """
    cli_apps = []

    if not core_cli_path.exists():
        logger.warning(f"Core CLI directory not found: {core_cli_path}")
        return cli_apps

    # Scan for Python files in core/cli
    for file_path in core_cli_path.glob("*.py"):
        if file_path.name.startswith("__"):
            continue

        module_name = file_path.stem
        full_module_name = f"papermerge.core.cli.{module_name}"

        cli_app = _try_load_cli_module(full_module_name, module_name)
        if cli_app:
            cli_apps.append(cli_app)

    logger.info(f"Discovered {len(cli_apps)} CLI apps from core.cli")
    return cli_apps
