from django import forms
from django.contrib.auth.validators import UnicodeUsernameValidator


# 验证表单
class UserBaseForm(forms.Form):
    username = forms.CharField(max_length=150, validators=(UnicodeUsernameValidator,))
    password = forms.CharField(min_length=6, max_length=128)
    remember = forms.BooleanField(required=False)


class InfoForm(forms.Form):
    GENDER = [
        ('0', '女'),
        ('1', '男')
    ]

    gender = forms.ChoiceField(choices=GENDER)
    email = forms.EmailField(required=False)


class PasswordForm(forms.Form):
    oldPassword = forms.CharField(min_length=6, max_length=150)
    newPassword = forms.CharField(min_length=6, max_length=150)


class AvatarForm(forms.Form):
    avatar = forms.ImageField()
