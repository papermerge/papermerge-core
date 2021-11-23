from setuptools import setup, find_namespace_packages

setup(
    packages=find_namespace_packages(
        include=['papermerge.*']
    ),
    install_requires=[
        "django == 3.2.7",
        "djangorestframework == 3.12.4",
        "django-cors-headers == 3.9.0",
        "djangorestframework-jsonapi == 4.2.1",
        "django_filter == 21.1",
        "channels == 3.0.3",
        "channels-redis == 3.2.0",
        "redis == 3.5.3",
        "ocrmypdf == 12.7.2",  # has pikepdf dependency
        "ocrmypdf-papermerge == 0.3.2",
        "mglib == 1.3.8",
        "mgclipboard >= 0.3.0",
        "stapler == 1.0.0",
        "django-dynamic-preferences == 1.10.1",
        "celery >= 5.0.0",
        "django-taggit == 1.3.0",
        "imapclient",
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
