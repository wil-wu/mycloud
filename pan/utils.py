import hmac
import uuid
import secrets
from pathlib import Path

from django.core.signing import Signer
from django.utils import timezone, dateformat
from django.http import JsonResponse


# 全局唯一标识
def get_uuid():
    return memoryview(uuid.uuid1().bytes)[:32].hex()


# 随机密匙和签名
def get_key_signature():
    secret_key = secrets.token_hex(3)
    signature = Signer().sign(secret_key)
    return secret_key, signature


# 生成签名地址
def get_secret_path(value: bytes):
    h = hmac.new(secrets.token_bytes(3), value, 'sha1')
    return h.hexdigest()


# 生成唯一文件名
def get_unique_filename(instance, filename):
    return f"uploads/{dateformat.format(timezone.localdate(), 'Y/m/d')}/{get_uuid()}{Path(filename).suffix}"


# 计算文件夹大小
def get_dir_size(path):
    return sum(f.stat().st_size for f in path.glob('**/*') if f.is_file())


# 文件大小格式化
def file_size_format(value, fixed=2):
    if value < 1024:
        size = f'{value}B'
    elif value < 1048576:
        size = f'{round(value / 1024, fixed)}KB'
    elif value < 1073741824:
        size = f'{round(value / 1024 / 1024, fixed)}M'
    else:
        size = f'{round(value / 1024 / 1024 / 1024, fixed)}G'
    return size


class AjaxObj(dict):
    """
    自定义ajax object
    """
    def __init__(self, code=200, msg='', data=None):
        if data is None:
            data = {}
        super(AjaxObj, self).__init__()
        self.update(code=code, msg=msg, data=data)

    def set_data(self, **kwargs):
        self['data'].update(**kwargs)

    def set_result(self, result):
        if not isinstance(result, list):
            raise TypeError('result parameter should be list type')
        self['data']['result'] = result

    def set_errors(self, errors):
        if not isinstance(errors, dict):
            raise TypeError('errors parameter should be dict type')
        self['data']['errors'] = errors

    def get_response(self):
        return JsonResponse({
            'code': self['code'],
            'msg': self['msg'],
            'data': self['data']
        })
