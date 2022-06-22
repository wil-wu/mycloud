from pathlib import Path

from django.conf import settings
from django.dispatch import receiver
from django.db.models.signals import pre_save, post_save
from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from django.contrib.auth.models import User

from httpagentparser import simple_detect

from pan.models import UserFile, UserDir, UserMessage, UserApproval, RoleLimit, UserLog, Profile, Role
from pan.utils import get_secret_path


# 用户首次创建和相关根目录创建
@receiver(post_save, sender=User, dispatch_uid="post_save_user")
def post_save_user(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance, role=Role.objects.get(role_key='common'))
        root = get_secret_path(instance.username.encode())
        root_path = Path('pan') / root
        UserDir.objects.create(create_by=instance, file_name=root, file_path=root_path)
        Path.mkdir(settings.MEDIA_ROOT / root_path)


# 文件存储
@receiver(pre_save, sender=UserFile, dispatch_uid='pre_save_file_uid')
def pre_save_file(sender, instance, **kwargs):
    if instance.file_cate == '':
        instance.file_cate = '0'


@receiver(pre_save, sender=UserDir, dispatch_uid='pre_save_folder_uid')
def pre_save_folder(sender, instance, **kwargs):
    if instance.file_cate == '':
        instance.file_cate = '1'


@receiver(pre_save, sender=UserMessage, dispatch_uid='pre_save_message_uid')
def pre_save_message(sender, instance, **kwargs):
    if instance.action == '':
        instance.action = '0'


@receiver(pre_save, sender=UserApproval, dispatch_uid='pre_save_approval_uid')
def pre_save_approval(sender, instance, **kwargs):
    if instance.action == '':
        instance.action = '1'


# 用户日志
@receiver(user_logged_in, dispatch_uid='user_logged_in')
def logged_in_log(sender, request, user, **kwargs):
    # 保存根目录
    root = user.files.get(folder=None)
    request.session['root'] = str(root.file_uuid)
    # 保存当前用户限制和存储空间
    queryset = RoleLimit.objects.select_related('limit').filter(role=user.profile.role)
    cloud = {}
    for item in queryset:
        cloud[item.limit.limit_key] = item.value

    cloud['used'] = root.file_size
    request.session['cloud'] = cloud

    ip = request.META.get('REMOTE_ADDR')
    ua = simple_detect(request.headers.get('user-agent'))
    UserLog.objects.create(username=user.username, ipaddress=ip, os=ua[0], browser=ua[1], action='0')


@receiver(user_logged_out, dispatch_uid='user_logged_out')
def logged_out_log(sender, request, user, **kwargs):
    ip = request.META.get('REMOTE_ADDR')
    ua = simple_detect(request.headers.get('user-agent'))
    UserLog.objects.create(username=user.username, ipaddress=ip, os=ua[0], browser=ua[1], action='1')


@receiver(user_login_failed, dispatch_uid='user_login_failed')
def login_failed_log(sender, credentials, request, **kwargs):
    ip = request.META.get('REMOTE_ADDR')
    ua = simple_detect(request.headers.get('user-agent'))
    UserLog.objects.create(username=credentials.get('username'), ipaddress=ip, os=ua[0], browser=ua[1], action='2')
