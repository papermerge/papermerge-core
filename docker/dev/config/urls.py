from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, \
    SpectacularRedocView,\
    SpectacularSwaggerView

urlpatterns = [
    path('api/', include('papermerge.core.urls')),
    path('api/search/', include('papermerge.search.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    # Optional UI:
    path(
        'api/schema/swagger-ui/',
        SpectacularSwaggerView.as_view(url_name='schema'),
        name='swagger-ui'
    ),
    path(
        'api/schema/redoc/',
        SpectacularRedocView.as_view(url_name='schema'),
        name='redoc'
    ),
    # provides views for browsable API login/logout
    path('auth/', include('rest_framework.urls')),
]
