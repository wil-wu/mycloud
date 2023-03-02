from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.conf import settings
from rest_framework import serializers

from pan.models import GenericFile, RecycleFile, FileShare, Notice, Profile, Letter


class FileSerializer(serializers.ModelSerializer):
    file_type = serializers.StringRelatedField()
    create_time = serializers.DateTimeField(format='%Y-%m-%d %H:%M', read_only=True)

    class Meta:
        model = GenericFile
        fields = ['file_name', 'file_uuid', 'file_type', 'file_size', 'create_time']


class RecycleSerializer(serializers.ModelSerializer):
    origin = FileSerializer()
    create_time = serializers.DateTimeField(format='%Y-%m-%d %H:%M', read_only=True)

    class Meta:
        model = RecycleFile
        fields = ['pk', 'origin', 'create_time']


class FileShareSerializer(serializers.ModelSerializer):
    file = FileSerializer()
    summary = serializers.CharField(max_length=100, allow_blank=True, required=False)
    expire_time = serializers.DateTimeField(format='%Y-%m-%d %H:%M', required=False)
    create_time = serializers.DateTimeField(format='%Y-%m-%d %H:%M', read_only=True)

    class Meta:
        model = FileShare
        fields = ['pk', 'secret_key', 'signature', 'file', 'summary', 'expire_time', 'create_time']


class UserSerializer(serializers.ModelSerializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    date_joined = serializers.DateTimeField(format='%Y-%m-%d', read_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'date_joined']

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('用户名已存在')
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('电子邮箱已被绑定')
        return value


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    gender = serializers.ChoiceField(choices=Profile.GENDER)
    avatar = serializers.ImageField()
    role = serializers.StringRelatedField()

    class Meta:
        model = Profile
        fields = ['user', 'avatar', 'gender', 'role']

    def validate_avatar(self, value):
        if value.size > settings.MAX_AVATAR_SIZE:
            raise serializers.ValidationError('图片大小超出限制')
        return value


class LetterSerializer(serializers.ModelSerializer):
    action = serializers.ChoiceField(choices=Letter.ACTIONS)
    status = serializers.ChoiceField(choices=Letter.STATUS, read_only=True)
    content = serializers.CharField(max_length=100)
    create_time = serializers.DateTimeField(format='%Y-%m-%d %H:%M', read_only=True)
    update_time = serializers.DateTimeField(format='%Y-%m-%d %H:%M', read_only=True)

    class Meta:
        model = Letter
        fields = ['action', 'status', 'content', 'create_time', 'update_time']

    def validate(self, attrs):
        if attrs.get('action') == '1':
            user = self.context.get('request').user
            if user.letters.filter(action='1', status='0').exists():
                raise serializers.ValidationError({'content': '有未审批的申请'})
            if user.letters.filter(action='1', status='1').exists():
                raise serializers.ValidationError({'content': '申请已通过，无需再申请'})
        return attrs


class NoticeSerializer(serializers.ModelSerializer):
    create_by = serializers.StringRelatedField()
    create_time = serializers.DateTimeField(format='%Y-%m-%d')

    class Meta:
        model = Notice
        fields = ['title', 'content', 'create_by', 'create_time']


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(min_length=6, max_length=128)
    remember = serializers.BooleanField(default=False)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(request=self.context.get('request'),
                                username=username, password=password)
            if user and not user.is_active:
                raise serializers.ValidationError({'username': '账户已被封禁'})
            if not user:
                raise serializers.ValidationError({'username': '用户名或密码错误'})
        else:
            raise serializers.ValidationError({'username': '用户名或密码不能为空'})

        instance = Profile.objects.select_related('role', 'user').get(user=user)
        profile = ProfileSerializer(instance).data
        attrs['profile'] = profile
        attrs['user'] = user
        return attrs


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password1 = serializers.CharField(min_length=6, max_length=128)
    password2 = serializers.CharField(min_length=6, max_length=128)

    def validate(self, attrs):
        username = attrs.get('username')
        password1 = attrs.get('password1')
        password2 = attrs.get('password2')

        if username and password1 and password2:
            if User.objects.filter(username=username).exists():
                raise serializers.ValidationError({'username': '用户名已存在'})
            if password1 != password2:
                raise serializers.ValidationError({'password1': '两次密码不一致',
                                                   'password2': '两次密码不一致'})
        else:
            raise serializers.ValidationError({'username': '用户名或密码不能为空'})

        return attrs


class PasswordSerializer(serializers.Serializer):
    password = serializers.CharField(min_length=6, max_length=128)
    password1 = serializers.CharField(min_length=6, max_length=128)
    password2 = serializers.CharField(min_length=6, max_length=128)

    def validate(self, attrs):
        password = attrs.get('password')
        password1 = attrs.get('password1')
        password2 = attrs.get('password2')
        user = self.context.get('request').user

        if password and password1 and password2:
            if password1 != password2:
                raise serializers.ValidationError({'password1': '两次密码不一致',
                                                   'password2': '两次密码不一致'})
            if not user.check_password(password):
                raise serializers.ValidationError({'password': '原密码错误'})
        else:
            raise serializers.ValidationError({'password': '所有密码不能为空'})

        return attrs
