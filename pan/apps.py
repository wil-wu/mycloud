from django.apps import AppConfig


class PanConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'pan'
    verbose_name = '云盘'

    def ready(self):
        import pan.signals
