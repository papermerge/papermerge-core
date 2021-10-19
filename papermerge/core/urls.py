from django.urls import path
from django.conf.urls import include, url

from rest_framework import routers

from papermerge.core import views


router = routers.DefaultRouter()

router.register(r"tags", views.TagsViewSet)
router.register(r"roles", views.RolesViewSet)
router.register(r"groups", views.GroupsViewSet)


urlpatterns = [
    url(r"^", include(router.urls)),
    path('automates/', views.AutomatesList.as_view()),
    path('automate/<int:pk>/', views.AutomateDetail.as_view()),
    path('content-types/<int:pk>/', views.ContentTypeRetrieve.as_view()),
    path('permissions/', views.PermissionsList.as_view()),
]
