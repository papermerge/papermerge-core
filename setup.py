from setuptools import setup, find_namespace_packages

setup(
    packages=find_namespace_packages(
        include=['papermerge.*']
    ),
    install_requires=[
        "django == 3.1",
        "mglib == 1.3.8",
        "mgclipboard >= 0.3.0",
        "stapler == 1.0.0",
        "django-dynamic-preferences == 1.10.1",
        "celery",
        "django-taggit",
        "imapclient",
        "djangorestframework",
        "django-rest-knox",
        "pyyaml",
        "lxml",
        "django-celery-results",
        "django-allauth",
        "django-polymorphic",
        "django-mptt",
        "django-polymorphic-tree",
        "django-modelcluster",
        "persisting-theory",
        "django-bootstrap4",
        "python-magic"
    ]
)
