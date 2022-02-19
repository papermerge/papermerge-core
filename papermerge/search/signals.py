import logging

from django_elasticsearch_dsl.signals import RealTimeSignalProcessor


logger = logging.getLogger(__name__)


class CustomSignalProcessor(RealTimeSignalProcessor):

    def handle_save(self, sender, instance, **kwargs):
        try:
            super().handle_save(sender, instance, **kwargs)
        except Exception:
            logger.warning("Elastic search connection error")

    def handle_delete(self, sender, instance, **kwargs):
        try:
            super().handle_delete(sender, instance, **kwargs)
        except Exception:
            logger.warning("Elastic search connection error")

    def handle_pre_delete(self, sender, instance, **kwargs):
        try:
            super().handle_pre_delete(sender, instance, **kwargs)
        except Exception:
            logger.warning("Elastic search connection error")

    def handle_m2m_changed(self, sender, instance, action, **kwargs):
        try:
            super().handle_m2m_changed(sender, instance, action, **kwargs)
        except Exception:
            logger.warning("Elastic search connection error")
