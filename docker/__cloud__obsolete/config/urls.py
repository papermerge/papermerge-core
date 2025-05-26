from django.urls import include, path

urlpatterns = [
    path('', include('papermerge.core.urls')),
    path('search/', include('papermerge.search.urls')),
]
