import importlib.metadata

# In order for this to work, you need to run first:
#   $ poetry install
__version__ = importlib.metadata.version("papermerge")
