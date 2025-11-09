import importlib
import pkgutil
from pathlib import Path
from typing import List

from fastapi import APIRouter


def discover_routers(features_path: Path) -> List[tuple[APIRouter, str]]:
    """
    Automatically discover and load all routers from feature modules.

    Returns list of tuples: (router, feature_name)
    """
    routers = []
    features_dir = features_path / "features"

    # Iterate through all feature directories
    for feature_module in pkgutil.iter_modules([str(features_dir)]):
        if feature_module.ispkg:
            feature_name = feature_module.name

            # Try to import router from the feature module
            try:
                module = importlib.import_module(
                    f"papermerge.core.features.{feature_name}.router"
                )
                if hasattr(module, 'router'):
                    routers.append((module.router, feature_name))
            except (ImportError, AttributeError) as e:
                # Skip if no router exists
                print(f"{feature_name} has no router {e}")
                pass


            # Also check for additional routers with suffixes
            # (like router_folders, router_pages, etc.)
            try:
                module_path = features_dir / feature_name
                for file in module_path.glob("router_*.py"):
                    router_module_name = file.stem
                    module = importlib.import_module(
                        f"papermerge.core.features.{feature_name}.{router_module_name}"
                    )
                    if hasattr(module, 'router'):
                        routers.append((module.router, f"{feature_name}_{router_module_name}"))
            except (ImportError, AttributeError):
                pass

    return routers
