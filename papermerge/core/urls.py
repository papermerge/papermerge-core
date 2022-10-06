from django.urls import path, re_path
from django.conf.urls import include

from rest_framework import routers
from papermerge.core import views


router = routers.DefaultRouter()

router.register(r"tokens", views.TokensViewSet, basename="token")
router.register(r"tags", views.TagsViewSet, basename="tag")
router.register("nodes", views.NodesViewSet, basename="node")
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
        r'documents/(?P<document_id>[0-9a-f-]+)?/upload/(?P<file_name>[^/]+)',
        views.DocumentUploadView.as_view(),
        name='documents_upload'
    ),
    path(
        'documents/<uuid:pk>/ocr-text',
        views.DocumentOcrTextView.as_view(),
        name='document-ocr-text'
    ),
    path(
        'documents/merge/',
        views.DocumentsMergeView.as_view(),
        name='documents_merge'
    ),
    path(
        'document-versions/<uuid:pk>/download/',
        views.DocumentVersionsDownloadView.as_view(),
        name='download-document-version'
    ),
    path(
        'document-versions/<uuid:pk>/',
        views.DocumentVersionView.as_view(),
        name='document-version'
    ),
    path(
        'users/<uuid:pk>/change-password/',
        views.UserChangePassword.as_view(),
        name='users-change-password'
    ),
    path(
        'users/me/',
        views.CurrentUserView.as_view(),
        name='users-me'
    ),
    path(
        'nodes/move/',
        views.NodesMoveView.as_view(),
        name='nodes-move'
    ),
    path(
        'nodes/inboxcount/', views.InboxCountView.as_view(), name='inboxcount'
    ),
    path('nodes/download/', views.NodesDownloadView.as_view()),
    path(
        'nodes/<uuid:pk>/tags/',
        views.NodeTagsView.as_view(),
        name='node-tags'
    ),
    path(
        'pages/reorder/',
        views.PagesReorderView.as_view(),
        name='pages_reorder'
    ),
    path(
        'pages/rotate/',
        views.PagesRotateView.as_view(),
        name='pages_rotate'
    ),
    path(
        'pages/move-to-folder/',
        views.PagesMoveToFolderView.as_view(),
        name='pages_move_to_folder'
    ),
    path(
        'pages/move-to-document/',
        views.PagesMoveToDocumentView.as_view(),
        name='pages_move_to_document'
    ),
    path('pages/', views.PagesView.as_view(), name='pages'),  # only DELETE
    path(
        'pages/<uuid:pk>/',
        views.PageView.as_view(),
        name='pages_page'
    ),
    path('content-types/<int:pk>/', views.ContentTypeRetrieve.as_view()),
    path(
        'permissions/',
        views.PermissionsList.as_view(),
        name='permission-list'
    ),
    re_path(r'auth/login/', views.LoginView.as_view(), name='knox_login'),
    re_path(
        r'auth/logout/', views.LogoutView.as_view(), name='knox_logout'
    ),
    re_path(
        r'auth/logoutall/',
        views.LogoutAllView.as_view(),
        name='knox_logoutall'
    ),
    path(
        'ocr/',
        views.OCRView.as_view(),
        name='tasks-ocr'
    ),
    path(
        'version/',
        views.VersionView.as_view(),
        name='version'
    ),
    re_path(r"^", include(router.urls)),
]
