from django.urls import path
from django.conf.urls import include, url

from rest_framework import routers
from rest_framework.authtoken import views as authtoken_views

from papermerge.core import views


router = routers.DefaultRouter()

router.register(r"automates", views.AutomatesViewSet)
router.register(r"tags", views.TagsViewSet)
router.register(r"roles", views.RolesViewSet)
router.register(r"groups", views.GroupsViewSet)
router.register(r"users", views.UsersViewSet)


urlpatterns = [
    url(r"^", include(router.urls)),
    path('users/<int:pk>/change-password/', views.UserChangePassword.as_view()),
    path('content-types/<int:pk>/', views.ContentTypeRetrieve.as_view()),
    path('permissions/', views.PermissionsList.as_view()),
    path('auth-token/', authtoken_views.obtain_auth_token)
]
