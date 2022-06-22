from rest_framework.serializers import ModelSerializer, StringRelatedField, DateTimeField

from pan.models import GenericFile, FileShare, Notice


class FileSerializer(ModelSerializer):
    file_type = StringRelatedField()
    create_time = DateTimeField(format='%Y-%m-%d %H:%M')

    class Meta:
        model = GenericFile
        fields = ['id', 'file_name', 'file_uuid', 'file_cate', 'file_type', 'file_size', 'file_path', 'create_time']


class FileShareSerializer(ModelSerializer):
    user_file = StringRelatedField()
    expire_time = DateTimeField(format='%Y-%m-%d %H:%M')
    create_time = DateTimeField(format='%Y-%m-%d %H:%M')

    class Meta:
        model = FileShare
        fields = ['id', 'secret_key', 'signature', 'user_file', 'expire_time', 'create_time', 'summary']


class FolderSerializer(ModelSerializer):

    class Meta:
        model = GenericFile
        fields = ['file_name', 'file_uuid']


class NoticeSerializer(ModelSerializer):
    create_by = StringRelatedField()
    create_time = DateTimeField(format='%Y-%m-%d')

    class Meta:
        model = Notice
        fields = ['title', 'content', 'create_by', 'create_time']
