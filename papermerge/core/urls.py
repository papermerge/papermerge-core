from django.urls import path, re_path
from django.conf.urls import include, url

from rest_framework import routers
from knox import views as knox_views
from papermerge.core import views


router = routers.DefaultRouter()

router.register(r"automates", views.AutomatesViewSet, basename="automate")
router.register(r"tokens", views.TokensViewSet, basename="token")
router.register(r"tags", views.TagsViewSet, basename="tag")
router.register("nodes", views.NodesViewSet, basename="node")
router.register(r"roles", views.RolesViewSet)
router.register(r"groups", views.GroupsViewSet)
router.register(r"users", views.UsersViewSet)
router.register(r"folders", views.FoldersViewSet, basename="folder")
router.register(
    r"documents", views.DocumentDetailsViewSet, basename="document"
)
router.register(
    r'preferences',
    views.CustomUserPreferencesViewSet,
    basename='preferences'
)

urlpatterns = [
    re_path(
        r'documents/(?P<document_id>\d+)?/upload/(?P<file_name>[^/]+)',
        views.DocumentUploadView.as_view()
    ),
    path(
        'document-versions/<int:pk>/download/',
        views.DocumentVersionsDownloadView.as_view(),
    ),
    path(
        'users/<int:pk>/change-password/',
        views.UserChangePassword.as_view()
    ),
    path('users/me/', views.CurrentUserView.as_view()),
    path('nodes/move/', views.NodesMoveView.as_view()),
    path('nodes/inboxcount/', views.InboxCountView.as_view()),
    path('nodes/download/', views.NodesDownloadView.as_view()),
    path('pages/<pk>/', views.PageView.as_view()),
    path('content-types/<int:pk>/', views.ContentTypeRetrieve.as_view()),
    path('permissions/', views.PermissionsList.as_view()),
    url(r'auth/login/', views.LoginView.as_view(), name='knox_login'),
    url(r'auth/logout/', knox_views.LogoutView.as_view(), name='knox_logout'),
    url(r'auth/logoutall/', knox_views.LogoutAllView.as_view(),
        name='knox_logoutall'),
    path('ocr/', views.OCRView.as_view()),
    url(r"^", include(router.urls)),
]
