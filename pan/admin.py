from django.contrib import admin, messages
from django.contrib.admin.models import LogEntry
from django.utils.translation import ngettext
from pan.models import (Profile, Role, Limit, RoleLimit,
                        FileType, GenericFile, UserFile, UserDir, FileShare, ShareRecord,
                        Notice, Message, UserMessage, UserApproval, UserLog)


# 恢复动作
@admin.action(description='恢复所选文件')
def make_recycle(modeladmin, request, queryset):
    rows = queryset.update(del_flag='0', update_by=request.user)
    modeladmin.message_user(request, ngettext(
        f'{rows}个文件被恢复',
        f'{rows}个文件被恢复',
        rows
    ), messages.SUCCESS)


# 回收动作
@admin.action(description='回收所选文件')
def make_removed(modeladmin, request, queryset):
    rows = queryset.update(del_flag='1', update_by=request.user)
    modeladmin.message_user(request, ngettext(
        f'{rows}个文件被回收',
        f'{rows}个文件被回收',
        rows
    ), messages.SUCCESS)


@admin.action(description='通过申请')
def make_pass(modeladmin, request, queryset):
    role = Role.objects.get(role_key='member')
    profiles = list(map(lambda item: item.create_by.profile, queryset))
    rows = queryset.update(state='1', update_by=request.user)
    for p in profiles:
        p.role = role

    Profile.objects.bulk_update(profiles, ('role',))
    modeladmin.message_user(request, ngettext(
        f'已通过{rows}个申请',
        f'已通过{rows}个申请',
        rows
    ), messages.SUCCESS)


@admin.action(description='拒绝申请')
def make_notpass(modeladmin, request, queryset):
    rows = queryset.update(state='2', update_by=request.user)
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
    list_select_related = ('user',)
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
            'fields': ('role', 'limit', 'value')
        }),
        ('其他信息', {
            'fields': ('create_by', 'create_time', 'update_by', 'update_time', 'remark')
        })
    )
    readonly_fields = ('create_by', 'create_time', 'update_by', 'update_time')
    list_select_related = ('role', 'limit')
    list_display = ('role', 'limit', 'value')
    list_filter = ('role', 'limit')
    list_per_page = 10

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
    search_fields = ('file_name', 'file_path')

    def get_model_perms(self, request):
        return {}

    def get_search_results(self, request, queryset, search_term):
        if request.GET.get('model_name') == 'fileshare':
            return super().get_search_results(request, queryset, search_term)
        queryset = queryset.filter(file_cate=1)
        return super().get_search_results(request, queryset, search_term)


@admin.register(UserFile)
class UserFileAdmin(admin.ModelAdmin):
    fieldsets = (
        (None, {
            'fields': ('file_uuid', 'file_name', 'file_type', 'file_size', 'file_path', 'folder', 'del_flag')
        }),
        ('其他信息', {
            'fields': ('create_by', 'create_time', 'update_by', 'update_time', 'remark')
        })
    )
    autocomplete_fields = ('folder', )
    search_fields = ('file_name', 'create_by__username')
    readonly_fields = ('file_uuid', 'create_by', 'create_time', 'update_by', 'update_time')
    actions = [make_removed, make_recycle]
    list_select_related = ('create_by', )
    list_display = ('file_uuid', 'file_name', 'file_type', 'file_size', 'del_flag', 'create_by')
    list_filter = ('file_type', 'del_flag')
    list_per_page = 10

    def has_add_permission(self, request):
        return False

    def save_model(self, request, obj, form, change):
        if obj.create_by:
            obj.update_by = request.user
        else:
            obj.create_by = request.user
            obj.update_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(UserDir)
class UserDirAdmin(admin.ModelAdmin):
    fieldsets = (
        (None, {
            'fields': ('file_uuid', 'file_name', 'file_size', 'file_path', 'folder', 'del_flag')
        }),
        ('其他信息', {
            'fields': ('create_by', 'create_time', 'update_by', 'update_time', 'remark')
        })
    )
    autocomplete_fields = ('folder',)
    search_fields = ('file_name', 'create_by__username')
    readonly_fields = ('file_uuid', 'create_by', 'create_time', 'update_by', 'update_time')
    actions = [make_removed, make_recycle]
    list_select_related = ('create_by',)
    list_display = ('file_uuid', 'file_name', 'file_size', 'del_flag', 'create_by')
    list_filter = ('del_flag', )
    list_per_page = 10

    def has_add_permission(self, request):
        return False

    def save_model(self, request, obj, form, change):
        if obj.create_by:
            obj.update_by = request.user
        else:
            obj.create_by = request.user
            obj.update_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(FileShare)
class FileShareAdmin(admin.ModelAdmin):
    fieldsets = (
        (None, {
            'fields': ('secret_key', 'signature', 'expire_time', 'user_file', 'summary')
        }),
        ('其他信息', {
            'fields': ('create_time', 'update_by', 'update_time', 'remark')
        })
    )
    autocomplete_fields = ('user_file',)
    search_fields = ('user_file__create_by__username', 'user_file__file_name')
    readonly_fields = ('secret_key', 'signature', 'create_time', 'update_by', 'update_time')
    list_select_related = ('user_file',)
    list_display = ('signature', 'user_file', 'expire_time')
    list_filter = ('user_file__file_type', 'user_file__file_cate')
    list_per_page = 10

    def has_add_permission(self, request):
        return False

    def save_model(self, request, obj, form, change):
        obj.update_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(ShareRecord)
class ShareRecordAdmin(admin.ModelAdmin):
    fieldsets = (
        (None, {
            'fields': ('file_share', 'recipient', 'anonymous')
        }),
        ('其他信息', {
            'fields': ('create_time', 'update_by', 'update_time', 'remark')
        })
    )
    search_fields = ('recipient__username', 'file_share__user_file__file_name')
    readonly_fields = ('create_time', 'update_by', 'update_time')
    list_select_related = ('file_share', 'recipient')
    list_display = ('file_share', 'recipient', 'anonymous')
    list_filter = ('file_share__user_file__file_type', 'file_share__user_file__file_cate')
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
    search_fields = ('create_by__username', 'notice_title')
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


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):

    def get_model_perms(self, request):
        return {}


@admin.register(UserMessage)
class UserMessageAdmin(admin.ModelAdmin):
    fieldsets = (
        (None, {
            'fields': ('content',)
        }),
        ('其他信息', {
            'fields': ('create_by', 'create_time', 'update_by', 'update_time', 'remark')
        })
    )
    search_fields = ('create_by__username',)
    readonly_fields = ('create_by', 'create_time', 'update_by', 'update_time')
    list_select_related = ('create_by',)
    list_display = ('create_by', 'create_time')
    list_per_page = 10

    def has_add_permission(self, request):
        return False

    def save_model(self, request, obj, form, change):
        obj.update_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(UserApproval)
class UserApprovalAdmin(admin.ModelAdmin):
    fieldsets = (
        (None, {
            'fields': ('state', 'content')
        }),
        ('其他信息', {
            'fields': ('create_by', 'create_time', 'update_by', 'update_time', 'remark')
        })
    )
    search_fields = ('create_by__username',)
    readonly_fields = ('create_by', 'create_time', 'update_by', 'update_time')
    actions = (make_pass, make_notpass)
    list_select_related = ('create_by',)
    list_display = ('create_by', 'state', 'create_time')
    list_per_page = 10

    def has_add_permission(self, request):
        return False

    def save_model(self, request, obj, form, change):
        obj.update_by = request.user
        super().save_model(request, obj, form, change)

        profile = obj.create_by.profile
        if obj.state == '1':
            profile.role = Role.objects.get(role_key='member')
            profile.save()
        else:
            profile.role = Role.objects.get(role_key='common')
            profile.save()


@admin.register(UserLog)
class UserLogAdmin(admin.ModelAdmin):
    list_display = ('username', 'ipaddress', 'browser', 'os', 'action', 'action_time')
    list_filter = ('action',)
    list_per_page = 15

    def has_add_permission(self, request):
        return False
