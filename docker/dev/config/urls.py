from django.urls import path, include

urlpatterns = [
    path('api/', include('papermerge.core.urls')),
    path('api/search/', include('papermerge.search.urls')),
]
