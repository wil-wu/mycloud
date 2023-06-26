import os
import hmac
import uuid
import secrets
import zipfile
from io import BytesIO
from pathlib import Path

from django.core.signing import Signer


# 全局唯一标识
def get_uuid():
    return memoryview(uuid.uuid1().bytes)[:32].hex()


# 随机密匙和签名
def get_key_signature():
    secret_key = secrets.token_hex(3)
    signature = Signer().sign(secret_key)
    return secret_key, signature


# 生成签名地址
def get_secret_path(msg):
    h = hmac.new(secrets.token_bytes(3), msg, 'sha1')
    return h.hexdigest()


# 生成唯一文件名
def get_unique_filename(instance, filename):
    return f"uploads/{instance.user.id}/{get_uuid()}{Path(filename).suffix}"


# 计算文件夹大小
def get_dir_size(path):
    return sum(f.stat().st_size for f in path.glob('**/*') if f.is_file())


# 压缩文件夹并返回字节对象
def make_archive_bytes(dir_path):
    buffer = BytesIO()
    dl = len(str(dir_path.parent)) + 1

    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zipper:
        for basedir, subdir, files in os.walk(dir_path):
            base = Path(basedir)
            parent = Path(basedir[dl:])
            zipper.writestr(str(parent) + '/', '')
            for file in files:
                zipper.write(base / file, parent / file)
            for folder in subdir:
                zipper.writestr(str(parent / folder) + '/', '')

    buffer.seek(0)
    return buffer


# 文件大小格式化
def file_size_format(value, fixed=2):
    if value < 1024:
        size = f'{value} B'
    elif value < 1048576:
        size = f'{round(value / 1024, fixed)} KB'
    elif value < 1073741824:
        size = f'{round(value / 1024 / 1024, fixed)} MB'
    else:
        size = f'{round(value / 1024 / 1024 / 1024, fixed)} GB'
    return size


class AjaxData(dict):
    """
    ajax 结果集
    """
    def __init__(self, code=200, msg='', data=None, errors=None):
        assert type(code) == int
        assert type(msg) == str
        if data is not None:
            assert isinstance(data, dict)
        if errors is not None:
            assert isinstance(errors, dict)
        super().__init__(code=code, msg=msg, data=data, errors=errors)
