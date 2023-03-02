from pathlib import Path
from datetime import timedelta
from shutil import rmtree, move as file_move

from django.conf import settings
from django.contrib.auth import login, logout
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.signing import Signer, TimestampSigner, BadSignature, SignatureExpired
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.generic import TemplateView
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import FileResponse
from django.shortcuts import render
from django.template.loader import render_to_string
from rest_framework import status, mixins, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet

from pan.models import (
    GenericFile, RecycleFile, File, Folder, FileType,
    FileShare, AcceptRecord, Notice, Profile
)
from pan.serializers import (
    LoginSerializer, RegisterSerializer, PasswordSerializer, ProfileSerializer, UserSerializer,
    NoticeSerializer, LetterSerializer, FileSerializer, RecycleSerializer, FileShareSerializer
)
from pan.utils import AjaxData, get_key_signature, get_dir_size, make_archive_bytes, get_uuid


@method_decorator(ensure_csrf_cookie, 'get')
class IndexView(TemplateView):
    """首页"""
    template_name = 'pan/index.html'


@method_decorator(ensure_csrf_cookie, 'get')
class HomeView(LoginRequiredMixin, TemplateView):
    """主页面"""
    template_name = 'pan/home.html'


class FileDetailView(LoginRequiredMixin, TemplateView):
    """文件详情"""
    template_name = 'pan/detail.html'


class FileShareView(TemplateView):
    """链接获取文件"""
    template_name = 'pan/share.html'


class ResetDoneView(TemplateView):
    """重置密码结果"""
    template_name = 'pan/reset_done.html'

    def get_context_data(self, **kwargs):
        param = kwargs.get('param')
        context = super().get_context_data()
        try:
            auth = TimestampSigner().unsign_object(param, max_age=settings.TOKEN_EXPIRY)
            if not auth.get('token') or not auth.get('user') or auth['token'] != settings.RESET_TOKEN:
                context['access'] = False
            else:
                user = User.objects.get(username=auth['user'])
                user.set_password(settings.RESET_PASSWORD)
                user.save()
                context['access'] = True
        except (BadSignature, SignatureExpired):
            context['access'] = False
        return context


class LoginView(APIView):
    """登录"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            login(request, serializer.validated_data['user'])
            expiry = request.session.get_expiry_date().timestamp()
            if not serializer.validated_data['remember']:
                request.session.set_expiry(0)
                expiry = timezone.now().timestamp()
            data = {
                'terms': request.session['terms'],
                'expiry': expiry,
                'profile': serializer.validated_data['profile'],
            }
            result = AjaxData(msg='登录成功', data=data)
            return Response(result)
        else:
            result = AjaxData(400, errors=serializer.errors)
            return Response(result)


class RegisterView(APIView):
    """注册"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password1']
            User.objects.create_user(username=username, password=password)
            result = AjaxData(msg='注册成功')
            return Response(result)
        else:
            result = AjaxData(400, errors=serializer.errors)
            return Response(result)


class LogoutView(APIView):
    """登出"""

    def get(self, request):
        logout(request)
        return Response()


class PasswordView(APIView):
    """修改密码"""

    def post(self, request):
        serializer = PasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['password1'])
            result = AjaxData(msg='修改成功')
            return Response(result)
        else:
            result = AjaxData(400, errors=serializer.errors)
            return Response(result)


class ResetView(APIView):
    """重置密码"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username').strip()
        queryset = User.objects.filter(username=username)

        if not queryset.exists() or not queryset.get().email:
            result = AjaxData(400, errors={'username': ['用户名不存在或未绑定邮箱']})
            return Response(result)

        user = queryset.get()
        auth = {'user': user.username, 'token': settings.RESET_TOKEN}
        context = {'scheme': request.META.get('wsgi.url_scheme'),
                   'host': request.META.get('HTTP_HOST'),
                   'param': TimestampSigner().sign_object(auth),
                   'password': settings.RESET_PASSWORD}
        html = render_to_string('pan/reset.html', context)
        send_mail(
            subject='Tiny Cloud',
            message=html,
            from_email=None,
            recipient_list=[user.email],
            fail_silently=True,
            html_message=html
        )
        result = AjaxData(msg='已发送验证邮件')
        return Response(result)


class FileUploadView(APIView):
    """上传文件"""

    def post(self, request):
        file = request.data.get('file')
        if not file:
            return Response()

        used = request.session['terms']['used'] + file.size
        if used > request.session['terms']['storage']:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        parent = request.user.files.get(file_uuid=request.data.get('parent', request.session['root']))
        file_path = Path(parent.file_path) / file.name
        if Path(file_path).exists():
            return Response(status=status.HTTP_400_BAD_REQUEST)

        file_type = FileType.objects.get_or_create(suffix=Path(file.name).suffix, defaults={'type_name': '未知'})[0]
        dirs = []

        with open(settings.PAN_ROOT / file_path, 'wb') as f:
            for chunk in file.chunks():
                f.write(chunk)
        user_file = File.objects.create(file_name=file.name, file_type=file_type, file_size=file.size,
                                        file_path=file_path, folder=parent, create_by=request.user)

        # 更新父文件夹大小
        while parent:
            parent.file_size += file.size
            parent.update_by = request.user
            dirs.append(parent)
            parent = parent.folder
        Folder.objects.bulk_update(dirs, ('file_size', 'update_by'))

        request.session['terms']['used'] = used
        return Response(FileSerializer(user_file).data)


class FolderUploadView(APIView):
    """上传文件夹"""

    def post(self, request):
        files = request.data.getlist('files')
        paths = request.data.getlist('paths')
        name = request.data.get('name')

        if not files or not paths or not name:
            return Response()

        path_nums = len(paths)
        if path_nums * 2 > settings.DATA_UPLOAD_MAX_NUMBER_FIELDS:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        used = request.session['terms']['used'] + sum(s.size for s in files)
        if used > request.session['terms']['storage']:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        parent = request.user.files.get(file_uuid=request.data.get('parent', request.session['root']))
        parent_path = Path(parent.file_path)
        folder_path = parent_path / name
        if Path(folder_path).exists():
            return Response(status=status.HTTP_400_BAD_REQUEST)

        objs = []
        dirs = []

        for i in range(path_nums):
            # 递归创建目录
            parts = Path(paths[i]).parts[:-1]
            temp_folder = parent
            temp_path = parent_path
            for part in parts:
                part_path = temp_path / part
                if Path(settings.PAN_ROOT / part_path).exists():
                    prev = Folder.objects.get(file_path=part_path)
                    temp_folder = prev
                    temp_path = Path(part_path)
                else:
                    prev = Folder(file_name=part, file_path=part_path, folder=temp_folder, create_by=request.user)
                    prev.save()
                    dirs.append(prev)
                    Path.mkdir(settings.PAN_ROOT / part_path)
                    temp_folder = prev
                    temp_path = Path(part_path)
            # 创建文件
            file = files[i]
            file_path = temp_path / file.name
            with open(settings.PAN_ROOT / file_path, 'wb') as f:
                for chunk in file.chunks():
                    f.write(chunk)
            file_type = FileType.objects.get_or_create(suffix=Path(file.name).suffix,
                                                       defaults={'type_name': '未知'})[0]
            objs.append(File(file_name=file.name, file_type=file_type, file_size=file.size,
                             file_path=file_path, folder=temp_folder, create_by=request.user))

        # 计算文件大小并更新数据库
        for d in dirs:
            d.file_size = get_dir_size(settings.PAN_ROOT / d.file_path)
            d.update_by = request.user

        while parent:
            parent.file_size = get_dir_size(settings.PAN_ROOT / parent_path)
            parent.update_by = request.user
            dirs.append(parent)
            parent = parent.folder
            parent_path = parent.file_path if parent else None

        File.objects.bulk_create(objs)
        Folder.objects.bulk_update(dirs, ('file_size', 'update_by'))
        folder = Folder.objects.get(file_path=folder_path)

        request.session['terms']['used'] = used
        return Response(FileSerializer(folder).data)


class ProfileViewSet(GenericViewSet):
    """个人信息"""
    serializer_class = ProfileSerializer
    filter_backends = []
    pagination_class = None

    def get_queryset(self):
        return Profile.objects.select_related('user').all()

    @action(methods=['PATCH'], detail=False)
    def partial(self, request):
        serializer = self.get_serializer(request.user.profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(update_by=request.user)
            result = AjaxData(msg='更改成功', data=serializer.data)
            return Response(result)
        else:
            result = AjaxData(400, errors=serializer.errors)
            return Response(result)

    @action(methods=['PATCH'], detail=False)
    def user(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            result = AjaxData(msg='更改成功', data=serializer.data)
            return Response(result)
        else:
            result = AjaxData(400, errors=serializer.errors)
            return Response(result)


class FileViewSet(mixins.ListModelMixin,
                  mixins.UpdateModelMixin,
                  mixins.RetrieveModelMixin,
                  GenericViewSet):
    """网盘文件api"""
    serializer_class = FileSerializer
    pagination_class = None

    lookup_field = 'file_uuid'
    lookup_url_kwarg = 'uuid'

    search_fields = ['file_name']
    ordering_fields = ['file_name', 'file_size', 'create_time']

    def get_queryset(self):
        return self.request.user.files.select_related('file_type').filter(is_del=False)

    @action(methods=['GET'], detail=False)
    def storage(self, request):
        parent = request.query_params.get('parent', self.request.session['root'])
        try:
            queryset = self.get_queryset().filter(folder=parent)
        except ValidationError:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        return Response(FileSerializer(self.filter_queryset(queryset), many=True).data)

    @action(methods=['GET'], detail=False)
    def files(self, request):
        queryset = self.get_queryset().exclude(file_type=None)
        return Response(FileSerializer(self.filter_queryset(queryset), many=True).data)

    @action(methods=['GET'], detail=False)
    def folders(self, request):
        exclude = self.request.query_params.get('exclude')
        parent = self.request.query_params.get('parent', self.request.session['root'])
        try:
            queryset = self.get_queryset().filter(folder=parent, file_type=None).exclude(file_uuid=exclude)
        except ValidationError:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        return Response(FileSerializer(queryset, many=True).data)

    @action(methods=['GET'], detail=True, permission_classes=[permissions.AllowAny])
    def binary(self, request, uuid=None):
        file = self.get_object()
        root = settings.PAN_ROOT

        if file.file_type is not None:
            blob = request.query_params.get('blob')
            response = FileResponse(open(root / file.file_path, 'rb'), as_attachment=True)
            if blob:
                response.as_attachment = False
            return response
        else:
            return FileResponse(make_archive_bytes(root / file.file_path), as_attachment=True, filename='cloud.zip')

    @action(methods=['GET'], detail=True)
    def share(self, request, uuid=None):
        file = self.get_object()
        key, signature = get_key_signature()

        while FileShare.objects.filter(secret_key=key).exists():
            key, signature = get_key_signature()

        obj = FileShare.objects.create(secret_key=key, signature=signature, file=file, create_by=request.user,
                                       expire_time=timezone.now() + timedelta(days=7))
        return Response(FileShareSerializer(obj).data)

    @action(methods=['POST'], detail=False)
    def recycle(self, request):
        uuids = request.data.get('uuids')
        if not uuids:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        try:
            queryset = self.get_queryset().select_related('folder').filter(file_uuid__in=uuids)
        except ValidationError:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        removed = 0
        folder = None
        folders = []
        objs = []
        pan_root = settings.PAN_ROOT
        bin_root = settings.BIN_ROOT
        rec_root = Path(RecycleFile.objects.get(pk=request.session['rec_root']).recycle_path)

        # 递归更新子文件
        def recursive_update(obj):
            obj.is_del = True
            obj.update_by = request.user
            objs.append(obj)

            if obj.file_type is None:
                files = GenericFile.objects.filter(folder=obj)
                for f in files:
                    recursive_update(f)

        for file in queryset:
            if folder is None:
                folder = file.folder
            removed += file.file_size
            rec_path = rec_root / (get_uuid() + Path(file.file_name).suffix)
            (pan_root / file.file_path).rename(bin_root / rec_path)
            RecycleFile.objects.create(recycle_path=rec_path, origin_path=file.file_path,
                                       origin=file, create_by=request.user)
            recursive_update(file)

        queryset.update(file_path='')

        while folder and folder.folder:
            folder.file_size -= removed
            folder.update_by = request.user
            folders.append(folder)
            folder = folder.folder

        if folders:
            Folder.objects.bulk_update(folders, ('file_size', 'update_by'))
        if objs:
            GenericFile.objects.bulk_update(objs, ('is_del', 'update_by'))

        result = AjaxData(msg='成功回收所选文件')
        return Response(result)

    @action(methods=['POST'], detail=True)
    def move(self, request, uuid=None):
        dst_uuid = request.data.get('dst_uuid', request.session['root'])

        if dst_uuid == uuid:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        src = self.get_object()
        dst = request.user.files.get(file_uuid=dst_uuid, file_type=None)

        if (settings.PAN_ROOT / dst.file_path / src.file_name).exists():
            result = AjaxData(400, msg='目标文件夹内存在同名文件')
            return Response(result)

        objs = []
        folders = []
        src_folder = src.folder

        file_move(str(settings.PAN_ROOT / src.file_path), str(settings.PAN_ROOT / dst.file_path))

        # 递归更新文件路径
        def recursive_update(obj, parent):
            obj.folder = parent
            obj.file_path = Path(parent.file_path) / obj.file_name
            obj.update_by = request.user
            objs.append(obj)

            if obj.file_type is None:
                files = GenericFile.objects.filter(folder=obj)
                for f in files:
                    recursive_update(f, obj)

        recursive_update(src, dst)
        GenericFile.objects.bulk_update(objs, ('folder', 'file_path', 'update_by'))

        # 更新目的文件夹和原文件夹以及其父文件夹大小（除根目录）
        while dst.folder:
            dst.file_size += src.file_size
            dst.update_by = request.user
            folders.append(dst)
            dst = dst.folder
        while src_folder.folder:
            src_folder.file_size -= src.file_size
            src_folder.update_by = request.user
            folders.append(src_folder)
            src_folder = src_folder.folder

        if folders:
            Folder.objects.bulk_update(folders, ('file_size', 'update_by'))
        result = AjaxData(msg='成功移动文件')
        return Response(result)


class RecycleViewSet(mixins.ListModelMixin,
                     GenericViewSet):
    """回收站api"""
    serializer_class = RecycleSerializer
    search_fields = ['origin__file_name']
    ordering_fields = ['origin__file_name', 'origin__file_size', 'create_time']

    def get_queryset(self):
        return self.request.user.recycle_files.select_related('origin__file_type').exclude(origin=None)

    @action(methods=['POST'], detail=False)
    def recover(self, request):
        pks = request.data.get('pks')
        if not pks:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        try:
            queryset = self.get_queryset().select_related('origin__folder').filter(pk__in=pks)
        except ValueError:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        folders = []
        folder_dict = {}
        objs = []
        clash = False
        conflict = False
        pan_root = settings.PAN_ROOT
        bin_root = settings.BIN_ROOT
        user_root = Folder.objects.get(file_uuid=request.session['root'])

        # 递归更新子文件
        def recursive_update(obj, parent):
            obj.is_del = False
            obj.folder = parent
            obj.file_path = Path(parent.file_path) / obj.file_name
            obj.update_by = request.user
            objs.append(obj)

            if obj.file_type is None:
                files = GenericFile.objects.filter(folder=obj)
                for f in files:
                    recursive_update(f, obj)

        for rec in queryset:
            if (pan_root / rec.origin_path).exists() or not (pan_root / rec.origin.folder.file_path).exists():
                # 冲突处理
                clash = True
                conflict = True
                rec_name = rec.origin.file_name
                file_name = rec_name.partition('.')[0] + get_uuid() + ''.join(Path(rec_name).suffixes)
                rec.origin.file_name = file_name
                recursive_update(rec.origin, user_root)
                Path(bin_root / rec.recycle_path).rename(pan_root / user_root.file_path / file_name)
            else:
                recursive_update(rec.origin, rec.origin.folder)
                Path(bin_root / rec.recycle_path).rename(pan_root / rec.origin_path)

            folder = rec.origin.folder
            if folder in folder_dict:
                if not clash:
                    folder_dict[folder] += rec.origin.file_size
            else:
                if not clash:
                    folder_dict[folder] = rec.origin.file_size

        queryset.delete()

        # 更新父文件夹
        for folder, size in folder_dict.items():
            while folder and folder.folder:
                folder.file_size += size
                folder.update_by = request.user
                folders.append(folder)
                folder = folder.folder

        if folders:
            Folder.objects.bulk_update(folders, ('file_size', 'update_by'))
        if objs:
            GenericFile.objects.bulk_update(objs, ('file_name', 'is_del', 'folder', 'file_path', 'update_by'))

        if conflict:
            msg = '所选文件中原文件夹不存在或存在同名文件，已随机命名打包存放置根目录下'
        else:
            msg = '成功恢复所选文件'
        result = AjaxData(msg=msg)
        return Response(result)

    @action(methods=['DELETE'], detail=False)
    def remove(self, request):
        pks = request.data.get('pks')
        if not pks:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        try:
            queryset = self.get_queryset().filter(pk__in=pks)
        except ValueError:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        removed = 0
        uuids = []
        bin_root = settings.BIN_ROOT

        for rec in queryset:
            removed += rec.origin.file_size
            uuids.append(rec.origin.file_uuid)
            if rec.origin.file_type is None:
                rmtree(bin_root / rec.recycle_path)
            else:
                (bin_root / rec.recycle_path).unlink()

        GenericFile.objects.filter(file_uuid__in=uuids).delete()

        root = Folder.objects.get(file_uuid=request.session['root'])
        root.file_size -= removed
        root.save()

        request.session['terms']['used'] -= removed
        result = AjaxData(msg='成功删除所选文件')
        return Response(result)


class FileShareViewSet(mixins.ListModelMixin,
                       mixins.UpdateModelMixin,
                       mixins.RetrieveModelMixin,
                       GenericViewSet):
    """文件分享api"""
    serializer_class = FileShareSerializer
    search_fields = ['file__file_name']
    ordering_fields = ['create_time', 'expire_time']

    def get_queryset(self):
        return self.request.user.fileshare_set.select_related('file').filter(file__is_del=False)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if serializer.is_valid():
            self.perform_update(serializer)
            if getattr(instance, '_prefetched_objects_cache', None):
                instance._prefetched_objects_cache = {}
            result = AjaxData(msg='成功设置链接', data=serializer.data)
            return Response(result)
        else:
            return Response(status=status.HTTP_400_BAD_REQUEST)

    def perform_update(self, serializer):
        delta = self.request.data.get('delta')
        user = self.request.user
        if delta and type(delta) == int:
            serializer.save(expire_time=timezone.now() + timedelta(days=delta), update_by=user)
        else:
            serializer.save(update_by=user)

    @action(methods=['DELETE'], detail=False)
    def remove(self, request):
        pks = request.data.get('pks')
        if not pks:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        try:
            self.get_queryset().filter(pk__in=pks).delete()
        except ValueError:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        result = AjaxData(msg="删除成功")
        return Response(result)

    @action(methods=['GET'], detail=False, permission_classes=[permissions.AllowAny])
    def secret(self, request):
        key = request.query_params.get('key')
        if not key:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        try:
            if len(key) > 6:
                obj = FileShare.objects.select_related('file').get(secret_key=Signer().unsign(key))
            else:
                obj = FileShare.objects.select_related('file').get(secret_key=key)
        except (BadSignature, FileShare.DoesNotExist):
            return Response(status=status.HTTP_204_NO_CONTENT)

        if obj.expire_time < timezone.now() or obj.file.is_del:
            return Response(status=status.HTTP_204_NO_CONTENT)

        if request.user.is_authenticated:
            AcceptRecord.objects.create(file_share=obj, create_by=request.user)
        else:
            AcceptRecord.objects.create(file_share=obj, anonymous=request.META.get('REMOTE_ADDR'))
        return Response(FileShareSerializer(obj).data)


class LetterViewSet(mixins.CreateModelMixin,
                    mixins.ListModelMixin,
                    GenericViewSet):
    """申请和留言api"""
    serializer_class = LetterSerializer
    pagination_class = None
    filter_backends = []

    def get_queryset(self):
        return self.request.user.letters.all()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            result = AjaxData(msg='提交成功', data=serializer.data)
            return Response(result, headers=headers)
        else:
            result = AjaxData(400, errors=serializer.errors)
            return Response(result)

    def perform_create(self, serializer):
        serializer.save(create_by=self.request.user)


class NoticeViewSet(mixins.ListModelMixin,
                    GenericViewSet):
    """通知api"""
    serializer_class = NoticeSerializer
    queryset = Notice.objects.select_related('create_by').all()
    filter_backends = []


# 异常视图
def bad_request_view(request, exception, template_name='errors/400.html'):
    return render(request, template_name, status=400)


def permission_denied_view(request, exception, template_name='errors/403.html'):
    return render(request, template_name, status=403)


def not_found_view(request, exception, template_name='errors/404.html'):
    return render(request, template_name, status=404)


def server_error_view(request, template_name='errors/500.html'):
    return render(request, template_name, status=500)
