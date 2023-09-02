from django.urls import include, path

urlpatterns = [
    path('api/', include('papermerge.core.urls')),
    path('api/search/', include('papermerge.search.urls')),
]
