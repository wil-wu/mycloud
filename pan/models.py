from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User

from pan.utils import get_uuid, get_unique_filename


# 删除被关联字段后获取的填充值
def get_deleted_role():
    return Role.objects.get_or_create(role_key='anonymous', defaults={'role_name': 'anonymous'})[0]


def get_deleted_user():
    return User.objects.get_or_create(username='anonymous', defaults={'password': 'anonymous'})[0]


def get_deleted_user_file():
    return GenericFile.objects.get_or_create(
        file_name='anonymous',
        create_by=None,
        defaults={
            'file_uuid': get_uuid(),
            'file_cate': '0',
            'file_size': 0,
            'file_path': 'anonymous'
        }
    )[0]


def get_deleted_file_type():
    return FileType.objects.get_or_create(
        suffix='',
        defaults={'type_name': '未知'}
    )[0]


def get_deleted_file_share():
    return FileShare.objects.get_or_create(
        secret_key='anonymous',
        defaults={
            'signature': 'anonymous',
            'user_file': get_deleted_user_file(),
            'expire_time': timezone.now()
        }
    )[0]


# 代理管理器
class UserFileManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(file_cate='0')


class UserDirManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(file_cate='1')


class MessageManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(action='0')


class ApprovalManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(action='1')


class BaseModel(models.Model):
    """基础字段"""

    create_time = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    update_time = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    create_by = models.ForeignKey(User, on_delete=models.SET(get_deleted_user), blank=True, null=True,
                                  related_name='+', verbose_name='创建者')
    update_by = models.ForeignKey(User, on_delete=models.SET(get_deleted_user), blank=True, null=True,
                                  related_name='+', verbose_name='更新者')
    remark = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        abstract = True


class Role(BaseModel):
    """角色"""

    role_name = models.CharField(max_length=50, verbose_name='角色名称')
    role_key = models.CharField(unique=True, max_length=50, verbose_name='角色字符')

    class Meta:
        verbose_name = '角色'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.role_name


class Limit(BaseModel):
    """限制"""

    limit_name = models.CharField(max_length=50, verbose_name='限制名称')
    limit_key = models.CharField(unique=True, max_length=50, verbose_name='限制字符')

    class Meta:
        verbose_name = '限制'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.limit_name


class RoleLimit(BaseModel):
    """角色限制"""

    role = models.ForeignKey(Role, on_delete=models.CASCADE, verbose_name='角色')
    limit = models.ForeignKey(Limit, on_delete=models.CASCADE, verbose_name='限制')
    value = models.BigIntegerField(verbose_name='值')

    class Meta:
        verbose_name = '角色限制'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'role: {self.role.role_key}, limit: {self.limit.limit_key}'


class Profile(BaseModel):
    """用户概要"""

    create_by = None

    GENDER = [
        ('0', '女'),
        ('1', '男')
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, verbose_name='用户')
    avatar = models.ImageField(upload_to=get_unique_filename, default='default/user.svg', verbose_name='头像')
    gender = models.CharField(max_length=1, choices=GENDER, blank=True, verbose_name='性别')
    role = models.ForeignKey(Role, on_delete=models.SET(get_deleted_role), verbose_name='角色')

    class Meta:
        verbose_name = '用户概要'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.user.username


class FileType(BaseModel):
    """文件类型"""

    type_name = models.CharField(max_length=50, verbose_name='类型名')
    suffix = models.CharField(unique=True, blank=True, max_length=10, verbose_name='文件后缀')

    class Meta:
        verbose_name = "文件类型"
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.suffix


class GenericFile(BaseModel):
    """用户文件"""

    CATEGORY = [
        ('0', '文件'),
        ('1', '文件夹')
    ]

    DEL_FLAGS = [
        ('0', '未回收'),
        ('1', '已回收'),
    ]

    create_by = models.ForeignKey(User, on_delete=models.SET(get_deleted_user), related_name='files',
                                  blank=True, null=True,
                                  verbose_name='创建者')

    file_name = models.CharField(max_length=100, verbose_name='文件名')
    file_uuid = models.UUIDField(unique=True, default=get_uuid, verbose_name='文件编号')
    file_cate = models.CharField(choices=CATEGORY, max_length=1, verbose_name='文件分类')
    file_type = models.ForeignKey(FileType, blank=True, null=True, on_delete=models.SET(get_deleted_file_type),
                                  verbose_name="文件类型")
    file_size = models.BigIntegerField(default=0, verbose_name='文件大小(字节)')
    file_path = models.CharField(db_index=True, max_length=500, verbose_name="文件路径")
    folder = models.ForeignKey('self', on_delete=models.CASCADE, to_field='file_uuid', null=True, blank=True,
                               verbose_name="上级目录")
    del_flag = models.CharField(max_length=1, default='0', choices=DEL_FLAGS, verbose_name='回收标识')

    class Meta:
        ordering = ['-create_time']
        verbose_name = '用户文件'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.file_name


class UserFile(GenericFile):
    """文件代理"""
    objects = UserFileManager()

    class Meta:
        proxy = True
        verbose_name = '用户文件'
        verbose_name_plural = verbose_name


class UserDir(GenericFile):
    """文件夹代理"""
    objects = UserDirManager()

    class Meta:
        proxy = True
        verbose_name = '用户文件夹'
        verbose_name_plural = verbose_name


class FileShare(BaseModel):
    """文件分享记录"""

    create_by = None

    secret_key = models.CharField(db_index=True, max_length=10, verbose_name='分享密匙')
    signature = models.CharField(max_length=70, verbose_name='数字签名')
    user_file = models.ForeignKey(GenericFile, on_delete=models.CASCADE, verbose_name='文件')
    expire_time = models.DateTimeField(verbose_name='过期时间')
    summary = models.CharField(blank=True, max_length=100, verbose_name='分享补充描述')

    class Meta:
        ordering = ['-create_time']
        verbose_name = '文件分享'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.user_file.file_name


class ShareRecord(BaseModel):
    """文件接收记录"""

    create_by = None

    file_share = models.ForeignKey(FileShare, on_delete=models.SET(get_deleted_file_share), verbose_name='文件分享')
    recipient = models.ForeignKey(User, null=True, on_delete=models.SET(get_deleted_user), verbose_name='接收者')
    anonymous = models.GenericIPAddressField(null=True, blank=True, verbose_name='匿名用户')

    class Meta:
        verbose_name = '文件接收记录'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.file_share.user_file.file_name


class Notice(BaseModel):
    """通知"""

    title = models.CharField(max_length=50, verbose_name='标题')
    content = models.TextField(verbose_name='通知内容')

    class Meta:
        verbose_name = '通知'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.title


class Message(BaseModel):
    """用户留言"""

    ACTIONS = [
        ('0', '留言'),
        ('1', '申请')
    ]

    STATE = [
        ('0', '未审批'),
        ('1', '通过'),
        ('2', '未通过')
    ]

    action = models.CharField(max_length=1, choices=ACTIONS, verbose_name='类型')
    state = models.CharField(max_length=1, default='0', choices=STATE, verbose_name='状态')
    content = models.TextField(verbose_name='留言内容')

    class Meta:
        verbose_name = '留言'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.create_by.username


class UserMessage(Message):
    """留言代理"""
    objects = MessageManager()

    class Meta:
        proxy = True
        verbose_name = '用户留言'
        verbose_name_plural = verbose_name


class UserApproval(Message):
    """审核代理"""
    objects = ApprovalManager()

    class Meta:
        proxy = True
        verbose_name = '用户申请'
        verbose_name_plural = verbose_name


class UserLog(models.Model):
    """用户登录日志"""

    ACTIONS = [
        ('0', '登录'),
        ('1', '登出'),
        ('2', '登录失败')
    ]

    username = models.CharField(max_length=128, verbose_name='用户名')
    ipaddress = models.GenericIPAddressField(verbose_name='ip地址')
    browser = models.CharField(max_length=200, verbose_name='浏览器')
    os = models.CharField(max_length=30, verbose_name='操作系统')
    action = models.CharField(max_length=1, choices=ACTIONS, verbose_name='动作')
    msg = models.CharField(max_length=100, verbose_name='信息')
    action_time = models.DateTimeField(auto_now_add=True, verbose_name='时间')

    class Meta:
        verbose_name = '用户登录日志'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.ipaddress
