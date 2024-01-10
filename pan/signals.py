from pathlib import Path

from django.conf import settings
from django.dispatch import receiver
from django.db.models.signals import post_save
from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from django.contrib.auth.models import User

from httpagentparser import simple_detect

from pan.models import GenericFile, RecycleFile, AuthLog, Profile, Role, RoleLimit
from pan.utils import get_secret_path


# 用户首次创建和相关根目录创建
@receiver(post_save, sender=User, dispatch_uid="post_save_user")
def post_save_user(sender, instance, created, **kwargs):
    if created:
        role = Role.objects.get_or_create(role_key='common', defaults={'role_name': '普通用户'})[0]
        Profile.objects.create(user=instance, role=role)
        root = get_secret_path(instance.username.encode())
        GenericFile.objects.create(create_by=instance, file_name=root, file_path=root)
        RecycleFile.objects.create(create_by=instance, origin_path=root, recycle_path=root)
        Path(settings.PAN_ROOT / root).mkdir(parents=True)
        Path(settings.BIN_ROOT / root).mkdir(parents=True)


# 用户日志
@receiver(user_logged_in, dispatch_uid='user_logged_in')
def logged_in_log(sender, request, user, **kwargs):
    # 保存根目录
    root = user.files.get(folder=None)
    rec_root = user.recycle_files.get(origin=None)
    request.session['root'] = str(root.file_uuid)
    request.session['rec_root'] = str(rec_root.pk)
    # 保存当前用户限制和存储空间
    queryset = RoleLimit.objects.select_related('limit').filter(role=user.profile.role)
    terms = {'used': root.file_size}
    for item in queryset:
        terms[item.limit.limit_key] = item.value

    request.session['terms'] = terms

    ip = request.META.get('REMOTE_ADDR')
    ua = simple_detect(request.headers.get('user-agent'))
    AuthLog.objects.create(username=user.username, ipaddress=ip, os=ua[0], browser=ua[1], action='0')


@receiver(user_logged_out, dispatch_uid='user_logged_out')
def logged_out_log(sender, request, user, **kwargs):
    ip = request.META.get('REMOTE_ADDR')
    ua = simple_detect(request.headers.get('user-agent'))
    AuthLog.objects.create(username=user.username, ipaddress=ip, os=ua[0], browser=ua[1], action='1')


@receiver(user_login_failed, dispatch_uid='user_login_failed')
def login_failed_log(sender, credentials, request, **kwargs):
    ip = request.META.get('REMOTE_ADDR')
    ua = simple_detect(request.headers.get('user-agent'))
    AuthLog.objects.create(username=credentials.get('username'), ipaddress=ip, os=ua[0], browser=ua[1], action='2')
