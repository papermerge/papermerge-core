from setuptools import setup, find_namespace_packages

setup(
    packages=find_namespace_packages(
        include=['papermerge.*']
    ),
    install_requires=[
        "django == 3.2.7",
        "channels == 3.0.3",
        "channels-redis == 3.2.0",
        "redis == 3.5.3",
        "ocrmypdf == 12.0.3",  # has pikepdf dependency
        "mglib == 1.3.8",
        "mgclipboard >= 0.3.0",
        "stapler == 1.0.0",
        "django-dynamic-preferences == 1.10.1",
        "celery >= 5.0.0",
        "django-taggit == 1.3.0",
        "imapclient",
        "djangorestframework",
        "django-rest-knox",
        "pyyaml",
        "lxml == 4.6.2",
        "django-celery-results",
        "django-allauth == 0.44.0",
        "django-polymorphic",
        "django-mptt == 0.11.0",
        "django-polymorphic-tree",
        "django-modelcluster",
        "persisting-theory",
        "django-bootstrap4",
        "python-magic"
    ]
)
