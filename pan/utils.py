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


class DictBase(dict):

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def __getattr__(self, key):
        try:
            return self[key]
        except KeyError:
            raise AttributeError(r"'Model' object has no attribute '%s'" % key)

    def __setattr__(self, key, value):
        self[key] = value


class AjaxObj(DictBase):

    def __init__(self, code=200, msg='', data=None):
        if data is None:
            data = {}
        super().__init__(code=code, msg=msg, data=data)

    @property
    def data(self):
        return self.data

    def set_data(self, **kwargs):
        self.get('data').update(kwargs)

    def set_result(self, result):
        if not isinstance(result, list):
            raise TypeError('rows should should be list type')
        self.get('data')['results'] = result

    def set_errors(self, errors):
        if not isinstance(errors, dict):
            raise TypeError('parameter should be dict type')
        self.get('data')['errors'] = errors

    def get_response(self):
        return JsonResponse({
            'code': self.get('code', 200),
            'msg': self.get('msg', ''),
            'data': self.get('data', {})
        })
