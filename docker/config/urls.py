from django.urls import path, include

urlpatterns = [
    path('', include('papermerge.core.urls')),
]
