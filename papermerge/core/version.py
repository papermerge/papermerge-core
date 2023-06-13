import importlib.metadata

# In order for this to work, you need to first run:
#   $ poetry install
__version__ = importlib.metadata.version("papermerge-core")
