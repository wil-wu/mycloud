from django.urls import path

from rest_framework.routers import DefaultRouter

from pan.views import (IndexView, ProfileView, CloudView, HistoryView, BinView,
                       FileDetailView, FileMoveView, FileDeleteView, FileTrashView,
                       FileUploadView, FolderUploadView, FileDownloadView,
                       ShareCreateView, ShareUpdateView, ShareGetView, ShareDelete, ShareLinkView,
                       LoginView, RegisterView, LoginOutView, DuplicatedCheck,
                       AlterAvatarView, AlterPasswordView, AlterInfoView, MsgApprView,
                       CloudViewSet, HistoryViewSet, BinViewSet, FolderViewSet, FileViewSet, NoticeViewSet)

app_name = 'pan'

urlpatterns = [
    path('', IndexView.as_view(), name='index'),
    path('profile', ProfileView.as_view(), name='profile'),
    path('cloud', CloudView.as_view(), name='cloud'),
    path('history', HistoryView.as_view(), name='history'),
    path('bin', BinView.as_view(), name='bin'),
    path('detail', FileDetailView.as_view(), name='detail'),
    path('download/<uuid:guid>', FileDownloadView.as_view(), name='download'),
    path('share/<str:signature>', ShareLinkView.as_view(), name='share-link'),
    path('share-get', ShareGetView.as_view(), name='share-get'),
    path('share-create', ShareCreateView.as_view(), name='share-create'),
    path('share-update', ShareUpdateView.as_view(), name='share-update'),
    path('share-delete', ShareDelete.as_view(), name='history-delete'),
    path('file-delete', FileDeleteView.as_view(), name='file-delete'),
    path('file-upload', FileUploadView.as_view(), name='file-upload'),
    path('folder-upload', FolderUploadView.as_view(), name='folder-upload'),
    path('duplicated-check', DuplicatedCheck.as_view(), name='duplicated-check'),
    path('trash', FileTrashView.as_view(), name='trash'),
    path('move', FileMoveView.as_view(), name='move'),
    path('login', LoginView.as_view(), name='login'),
    path('register', RegisterView.as_view(), name='register'),
    path('logout', LoginOutView.as_view(), name='logout'),
    path('alter-avatar', AlterAvatarView.as_view(), name='alter-avatar'),
    path('alter-password', AlterPasswordView.as_view(), name='alter-password'),
    path('alter-info', AlterInfoView.as_view(), name='alter-info'),
    path('msg-appr', MsgApprView.as_view(), name='message'),
]

router = DefaultRouter()
router.register('cloud', CloudViewSet, 'api-cloud')
router.register('history', HistoryViewSet, 'api-history')
router.register('bin', BinViewSet, 'api-bin')
router.register('folder', FolderViewSet, 'api-folder')
router.register('file', FileViewSet, 'api-file')
router.register('notice', NoticeViewSet, 'api-notice')
