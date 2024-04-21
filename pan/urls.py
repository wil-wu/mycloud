from django.urls import path
from rest_framework.routers import SimpleRouter

from pan import views

app_name = 'pan'

# 主要页面
urlpatterns = [
    path('', views.IndexView.as_view(), name='index'),
    path('home', views.HomeView.as_view(), name="home"),
    path('detail', views.FileDetailView.as_view(), name='detail'),
    path('share', views.FileShareView.as_view(), name='share')
]

# 上传
urlpatterns += [
    path('file/upload', views.FileUploadView.as_view(), name='file-upload'),
    path('folder/upload', views.FolderUploadView.as_view(), name='folder-upload'),
]

# 验证
urlpatterns += [
    path('login', views.LoginView.as_view(), name='login'),
    path('register', views.RegisterView.as_view(), name='register'),
    path('logout', views.LogoutView.as_view(), name='logout'),
    path('password', views.PasswordView.as_view(), name='password'),
    path('reset', views.ResetView.as_view(), name='reset'),
    path('reset-done/<str:param>', views.ResetDoneView.as_view(), name='reset-done'),
]

# restful api
router = SimpleRouter(trailing_slash=False)
router.register('file', views.FileViewSet, 'file')
router.register('share', views.FileShareViewSet, 'share')
router.register('recycle', views.RecycleViewSet, 'recycle')
router.register('letter', views.LetterViewSet, 'letter')
router.register('notice', views.NoticeViewSet, 'notice')
router.register('profile', views.ProfileViewSet, 'profile')
