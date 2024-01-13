from django.contrib import admin, messages
from django.contrib.admin.models import LogEntry
from django.utils.translation import ngettext

from pan.utils import file_size_format
from pan.models import (Profile, Role, Limit, RoleLimit,
                        FileType, GenericFile, RecycleFile, FileShare, AcceptRecord,
                        Notice, Letter, Message, Apply, AuthLog)


@admin.action(description='通过申请')
def make_pass(modeladmin, request, queryset):
    role = Role.objects.get_or_create(role_key='member', defaults={'role_name': '会员'})[0]
    profiles = list(map(lambda item: item.create_by.profile, queryset))
    rows = queryset.update(status='1', update_by=request.user)
    for p in profiles:
        p.role = role

    Profile.objects.bulk_update(profiles, ('role',))
    modeladmin.message_user(request, ngettext(
        f'已通过{rows}个申请',
        f'已通过{rows}个申请',
        rows
    ), messages.SUCCESS)


@admin.action(description='拒绝申请')
def make_not_pass(modeladmin, request, queryset):
    rows = queryset.update(status='2', update_by=request.user)
    modeladmin.message_user(request, ngettext(
        f'已拒绝{rows}个申请',
        f'已拒绝{rows}个申请',
        rows
    ), messages.SUCCESS)


# 管理员日志
@admin.register(LogEntry)
class LogEntryAdmin(admin.ModelAdmin):
    list_display = ['object_repr', 'object_id', 'action_flag', 'user', 'change_message']
    list_per_page = 12


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    fieldsets = (
        (None, {
            'fields': ('user', 'avatar', 'gender', 'role')
        }),
        ('其他信息', {
            'fields': ('create_time', 'update_by', 'update_time', 'remark')
        })
    )
    autocomplete_fields = ('user',)
    search_fields = ('user__username',)
    readonly_fields = ('create_time', 'update_by', 'update_time')
    list_select_related = ('user', 'role')
    list_display = ('user', 'role', 'gender')
    list_filter = ('gender', 'role')
    list_per_page = 10

    def save_model(self, request, obj, form, change):
        obj.update_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    fieldsets = (
        (None, {
            'fields': ('role_name', 'role_key')
        }),
        ('其他信息', {
            'fields': ('create_by', 'create_time', 'update_by', 'update_time', 'remark')
        })
    )
    readonly_fields = ('create_by', 'create_time', 'update_by', 'update_time')
    list_display = ('role_name', 'role_key')
    list_per_page = 10

    def save_model(self, request, obj, form, change):
        if obj.create_by:
            obj.update_by = request.user
        else:
            obj.create_by = request.user
            obj.update_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Limit)
class LimitAdmin(admin.ModelAdmin):
    fieldsets = (
        (None, {
            'fields': ('limit_name', 'limit_key')
        }),
        ('其他信息', {
            'fields': ('create_by', 'create_time', 'update_by', 'update_time', 'remark')
        })
    )
    readonly_fields = ('create_by', 'create_time', 'update_by', 'update_time')
    list_display = ('limit_name', 'limit_key')
    list_per_page = 10

    def save_model(self, request, obj, form, change):
        if obj.create_by:
            obj.update_by = request.user
        else:
            obj.create_by = request.user
            obj.update_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(RoleLimit)
class RoleLimitAdmin(admin.ModelAdmin):
    fieldsets = (
        (None, {
            'fields': ('role', 'limit', 'value', 'format_value')
        }),
        ('其他信息', {
            'fields': ('create_by', 'create_time', 'update_by', 'update_time', 'remark')
        })
    )
    readonly_fields = ('format_value', 'create_by', 'create_time', 'update_by', 'update_time')
    list_select_related = ('role', 'limit')
    list_display = ('role', 'limit', 'format_value')
    list_filter = ('role', 'limit')
    list_per_page = 10

    @admin.display(description='限制大小')
    def format_value(self, obj):
        return file_size_format(obj.value)

    def save_model(self, request, obj, form, change):
        if obj.create_by:
            obj.update_by = request.user
        else:
            obj.create_by = request.user
            obj.update_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(FileType)
class FileTypeAdmin(admin.ModelAdmin):
    fieldsets = (
        (None, {
            'fields': ('type_name', 'suffix')
        }),
        ('其他信息', {
            'fields': ('create_by', 'create_time', 'update_by', 'update_time', 'remark')
        })
    )
    search_fields = ('suffix',)
    readonly_fields = ('create_by', 'create_time', 'update_by', 'update_time')
    list_display = ('type_name', 'suffix')
    list_per_page = 10

    def save_model(self, request, obj, form, change):
        if obj.create_by:
            obj.update_by = request.user
        else:
            obj.create_by = request.user
            obj.update_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(GenericFile)
class GenericFile(admin.ModelAdmin):
    fieldsets = (
        (None, {
            'fields': ('file_uuid', 'file_name', 'format_type', 'format_size', 'folder', 'format_status')
        }),
        ('其他信息', {
            'fields': ('create_by', 'create_time', 'update_by', 'update_time', 'remark')
        })
    )
    search_fields = ('file_name', 'create_by__username')
    readonly_fields = ('file_uuid', 'file_name', 'format_type', 'format_size', 'folder', 'format_status',
                       'create_by', 'create_time', 'update_by', 'update_time')
    list_select_related = ('create_by', 'file_type')
    list_display = ('file_name', 'format_type', 'format_size', 'format_status', 'create_by')
    list_filter = ('file_type', 'is_del')
    list_per_page = 10

    @admin.display(ordering='file_size', description='文件大小')
    def format_size(self, obj):
        return file_size_format(obj.file_size)

    @admin.display(description='文件类型')
    def format_type(self, obj):
        return obj.file_type.suffix if obj.file_type else '文件夹'

    @admin.display(boolean=True, description='文件状态')
    def format_status(self, obj):
        return not obj.is_del

    def get_queryset(self, request):
        return super().get_queryset(request).exclude(folder=None)

    def has_add_permission(self, request):
        return False

    def save_model(self, request, obj, form, change):
        obj.update_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(RecycleFile)
class RecycleFileAdmin(admin.ModelAdmin):
    fieldsets = (
        (None, {
            'fields': ('origin',)
        }),
        ('其他信息', {
            'fields': ('create_by', 'create_time', 'update_by', 'update_time', 'remark')
        })
    )
    search_fields = ('origin__file_name', 'create_by__username')
    readonly_fields = ('origin', 'create_by', 'create_time', 'update_by', 'update_time')
    list_select_related = ('origin', 'create_by')
    list_display = ('origin', 'create_by', 'create_time')
    list_per_page = 10

    def get_queryset(self, request):
        return super().get_queryset(request).exclude(origin=None)

    def has_add_permission(self, request):
        return False

    def save_model(self, request, obj, form, change):
        obj.update_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(FileShare)
class FileShareAdmin(admin.ModelAdmin):
    fieldsets = (
        (None, {
            'fields': ('secret_key', 'signature', 'expire_time', 'file', 'summary')
        }),
        ('其他信息', {
            'fields': ('create_by', 'create_time', 'update_by', 'update_time', 'remark')
        })
    )
    search_fields = ('create_by__username', 'file__file_name')
    readonly_fields = ('secret_key', 'signature', 'expire_time', 'file', 'summary',
                       'create_by', 'create_time', 'update_by', 'update_time')
    list_select_related = ('file',)
    list_display = ('file', 'create_time', 'expire_time')
    list_filter = ('file__file_type',)
    list_per_page = 10

    def has_add_permission(self, request):
        return False

    def save_model(self, request, obj, form, change):
        obj.update_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(AcceptRecord)
class AcceptRecordAdmin(admin.ModelAdmin):
    fieldsets = (
        (None, {
            'fields': ('file_share', 'anonymous')
        }),
        ('其他信息', {
            'fields': ('create_by', 'create_time', 'update_by', 'update_time', 'remark')
        })
    )
    search_fields = ('create_by__username',)
    readonly_fields = ('file_share', 'anonymous', 'create_by', 'create_time', 'update_by', 'update_time')
    list_select_related = ('file_share', 'create_by')
    list_display = ('file_share', 'create_by', 'anonymous')
    list_filter = ('file_share__file__file_type',)
    list_per_page = 10

    def has_add_permission(self, request):
        return False

    def save_model(self, request, obj, form, change):
        obj.update_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Notice)
class NoticeAdmin(admin.ModelAdmin):
    fieldsets = (
        (None, {
            'fields': ('title', 'content')
        }),
        ('其他信息', {
            'fields': ('create_by', 'create_time', 'update_by', 'update_time', 'remark')
        })
    )
    search_fields = ('create_by__username', 'title')
    readonly_fields = ('create_by', 'create_time', 'update_by', 'update_time')
    list_select_related = ('create_by',)
    list_display = ('title', 'create_by')
    list_per_page = 10

    def save_model(self, request, obj, form, change):
        if obj.create_by:
            obj.update_by = request.user
        else:
            obj.create_by = request.user
            obj.update_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Letter)
class LetterAdmin(admin.ModelAdmin):

    def has_module_permission(self, request):
        return False

    def get_model_perms(self, request):
        return {}


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    fieldsets = (
        (None, {
            'fields': ('content',)
        }),
        ('其他信息', {
            'fields': ('create_by', 'create_time', 'update_by', 'update_time', 'remark')
        })
    )
    search_fields = ('create_by__username',)
    readonly_fields = ('content', 'create_by', 'create_time', 'update_by', 'update_time')
    list_select_related = ('create_by',)
    list_display = ('create_by', 'create_time')
    list_per_page = 10

    def has_add_permission(self, request):
        return False

    def save_model(self, request, obj, form, change):
        obj.update_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Apply)
class ApplyAdmin(admin.ModelAdmin):
    fieldsets = (
        (None, {
            'fields': ('status', 'content')
        }),
        ('其他信息', {
            'fields': ('create_by', 'create_time', 'update_by', 'update_time', 'remark')
        })
    )
    search_fields = ('create_by__username',)
    readonly_fields = ('content', 'create_by', 'create_time', 'update_by', 'update_time')
    actions = (make_pass, make_not_pass)
    list_select_related = ('create_by',)
    list_filter = ('status',)
    list_display = ('create_by', 'status', 'create_time')
    list_per_page = 10

    def has_add_permission(self, request):
        return False

    def save_model(self, request, obj, form, change):
        obj.update_by = request.user
        super().save_model(request, obj, form, change)

        profile = obj.create_by.profile
        if obj.status == '1':
            profile.role = Role.objects.get_or_create(role_key='member', defaults={'role_name': '会员'})[0]
            profile.save()
        else:
            profile.role = Role.objects.get_or_create(role_key='common', defaults={'role_name': '普通用户'})[0]
            profile.save()


@admin.register(AuthLog)
class AuthLogAdmin(admin.ModelAdmin):
    fields = ('username', 'ipaddress', 'browser', 'os', 'action', 'auth_time', 'msg')
    search_fields = ('username',)
    readonly_fields = ('username', 'ipaddress', 'browser', 'os', 'action', 'auth_time')
    list_display = ('username', 'ipaddress', 'browser', 'os', 'action', 'auth_time')
    list_filter = ('action',)
    list_per_page = 15

    def has_add_permission(self, request):
        return False
