from django.urls import include, path

urlpatterns = [
    path('api/search/', include('papermerge.search.urls')),
]
