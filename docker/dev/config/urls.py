from django.urls import path, include

urlpatterns = [
    path('', include('papermerge.core.urls')),
    path('search/', include('papermerge.search.urls')),
]
