from django.urls import path, include

urlpatterns = [
    path('api/', include('papermerge.core.urls')),
    path('api/search/', include('papermerge.search.urls')),
    # provides views for browsable API login/logout
    path('auth/', include('rest_framework.urls'))
]
