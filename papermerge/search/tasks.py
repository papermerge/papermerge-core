import logging

from django.core.exceptions import ImproperlyConfigured
from django.apps import apps
from celery import shared_task
from haystack.exceptions import NotHandled as IndexNotFoundException
from haystack import connections, connection_router


logger = logging.getLogger(__name__)


def split_identifier(identifier):
    """
    Break down the identifier representing the instance.
    Converts 'notes.note.23' into ('notes.note', 23).
    """
    bits = identifier.split('.')

    if len(bits) < 2:
        logger.error("Unable to parse object "
                     "identifer '%s'. Moving on..." % identifier)
        return (None, None)

    pk = bits[-1]
    # In case Django ever handles full paths...
    object_path = '.'.join(bits[:-1])
    return (object_path, pk)


def get_instance(model_class, pk):
    """
    Fetch the instance in a standarized way.
    """
    instance = None
    try:
        instance = model_class._default_manager.get(pk=pk)
    except model_class.DoesNotExist:
        logger.error("Couldn't load %s.%s.%s. Somehow it went missing?" %
                     (model_class._meta.app_label.lower(),
                      model_class._meta.object_name.lower(), pk))
    except model_class.MultipleObjectsReturned:
        logger.error("More than one object with pk %s. Oops?" % pk)
    return instance


def get_indexes(model_class):
    """
    Fetch the model's registered ``SearchIndex`` in a standarized way.
    """
    try:
        using_backends = connection_router.for_write(
            models=[model_class]
        )
        for using in using_backends:
            index_holder = connections[using].get_unified_index()
            yield index_holder.get_index(model_class), using
    except IndexNotFoundException:
        raise ImproperlyConfigured(
            "Couldn't find a SearchIndex for %s." % model_class
        )


def get_model_class(object_path):
    """
    Fetch the model's class in a standarized way.
    """
    bits = object_path.split('.')
    app_name = '.'.join(bits[:-1])
    classname = bits[-1]
    model_class = apps.get_model(app_name, classname)

    if model_class is None:
        raise ImproperlyConfigured("Could not load model '%s'." %
                                   object_path)
    return model_class


@shared_task
def update_index(
    action,
    identifier,
):
    object_path, pk = split_identifier(identifier)
    if object_path is None or pk is None:
        msg = "Couldn't handle object with identifier %s" % identifier
        logger.error(msg)
        raise ValueError(msg)

    # Then get the model class for the object path
    model_class = get_model_class(object_path)
    for current_index, using in get_indexes(model_class):
        current_index_name = ".".join([current_index.__class__.__module__,
                                       current_index.__class__.__name__])

        if action == 'delete':
            # If the object is gone, we'll use just the identifier
            # against the index.
            try:
                current_index.remove_object(identifier, using=using)
            except Exception as exc:
                logger.exception(exc)
            else:
                msg = ("Deleted '%s' (with %s)" %
                       (identifier, current_index_name))
                logger.debug(msg)
        elif action == 'save':
            # and the instance of the model class with the pk
            instance = get_instance(model_class, pk)
            if instance is None:
                logger.debug("Failed updating '%s' (with %s)" %
                             (identifier, current_index_name))
                raise ValueError("Couldn't load object '%s'" % identifier)

            # Call the appropriate handler of the current index and
            # handle exception if necessary
            try:
                current_index.update_object(instance, using=using)
            except Exception as exc:
                logger.exception(exc)
            else:
                msg = ("Updated '%s' (with %s)" %
                       (identifier, current_index_name))
                logger.debug(msg)
        else:
            logger.error("Unrecognized action '%s'. Moving on..." % action)
            raise ValueError("Unrecognized action %s" % action)
