from django.urls import path
from rest_framework.routers import DefaultRouter

from pan import views


app_name = 'pan'

# 主要页面
urlpatterns = [
    path('', views.IndexView.as_view(), name='index'),
    path('profile', views.ProfileView.as_view(), name='profile'),
    path('cloud', views.CloudView.as_view(), name='cloud'),
    path('history', views.HistoryView.as_view(), name='history'),
    path('bin', views.BinView.as_view(), name='bin'),
    path('detail', views.FileDetailView.as_view(), name='detail'),
]

# 下载和分享页
urlpatterns += [
    path('download/<uuid:guid>', views.FileDownloadView.as_view(), name='download'),
    path('share/<str:signature>', views.ShareLinkView.as_view(), name='share-link'),
]

# 分享
urlpatterns += [
    path('share-get', views.ShareGetView.as_view(), name='share-get'),
    path('share-create', views.ShareCreateView.as_view(), name='share-create'),
    path('share-update', views.ShareUpdateView.as_view(), name='share-update'),
    path('share-delete', views.ShareDelete.as_view(), name='history-delete'),
]

# 文件
urlpatterns += [
    path('file-delete', views.FileDeleteView.as_view(), name='file-delete'),
    path('file-upload', views.FileUploadView.as_view(), name='file-upload'),
    path('folder-upload', views.FolderUploadView.as_view(), name='folder-upload'),
    path('duplicated-check', views.DuplicatedCheck.as_view(), name='duplicated-check'),
    path('trash', views.FileTrashView.as_view(), name='trash'),
    path('move', views.FileMoveView.as_view(), name='move'),
]

# 验证
urlpatterns += [
    path('login', views.LoginView.as_view(), name='login'),
    path('register', views.RegisterView.as_view(), name='register'),
    path('logout', views.LoginOutView.as_view(), name='logout'),
]

# 个人信息
urlpatterns += [
    path('alter-avatar', views.AlterAvatarView.as_view(), name='alter-avatar'),
    path('alter-password', views.AlterPasswordView.as_view(), name='alter-password'),
    path('alter-info', views.AlterInfoView.as_view(), name='alter-info'),
    path('msg-appr', views.MsgApprView.as_view(), name='message'),
]


# restful api
router = DefaultRouter()
router.register('cloud', views.CloudViewSet, 'api-cloud')
router.register('history', views.HistoryViewSet, 'api-history')
router.register('bin', views.BinViewSet, 'api-bin')
router.register('folder', views.FolderViewSet, 'api-folder')
router.register('file', views.FileViewSet, 'api-file')
router.register('notice', views.NoticeViewSet, 'api-notice')
