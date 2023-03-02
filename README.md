# mycloud
大学毕业设计，一个美观简约，多功能的网盘web应用

### 本地运行
___
1. 安装依赖
```
pip install -r requirements.txt
```
2. 检查配置文件，修改邮箱和数据库配置
```
# mycloud/settings.py

EMAIL_HOST = 'smtp.qq.com'
EMAIL_PORT = '587'
EMAIL_HOST_USER = '******'
EMAIL_HOST_PASSWORD = '******'
EMAIL_USE_TLS = True
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'cloud',
        'HOST': '127.0.0.1',
        'PORT': '3306',
        'USER': '***',
        'PASSWORD': '******',
    }
}
```
3. 迁移数据库
```
python manage.py migrate
```
4. 执行基础sql文件
```
mysql> use cloud;
mysql> source C:/Users/..../.sql; 
```
5. 创建超级用户
```
python manage.py createsuperuser
```
6. 启动本地服务器
```
python manage.py runserver
```
### 功能模块
___
- 用户 
  - 登录和注册
  - 申请和留言 
  - 查看站点通知
  - 更改个人信息（头像，密码等）
  - 查看，修改，删除共享文件记录
  - 文件管理
    - 上传，下载文件和文件夹
    - 删除，恢复，移动文件和文件夹
    - 设置有效期，分享文件和文件夹
    - 检索文件
    - 分类排序文件
    - 预览文件
    - 接受其他分享的文件

- 普通管理员
  - 由超级管理员分配

- 超级管理员
  - 站点管理
  - 日志管理
  - 用户管理
  - 角色权限管理 
  - 发布通知
  - 留言管理
  - 申请审批

### 页面截图
___

文件  

![screen shot](https://raw.githubusercontent.com/wil-wu/mycloud/master/screenshots/storage.jpeg)  

文件详情  

![screen shot](https://raw.githubusercontent.com/wil-wu/mycloud/master/screenshots/audio.jpeg)  

个人信息  

![screen shot](https://raw.githubusercontent.com/wil-wu/mycloud/master/screenshots/profile.jpeg)  

后台  

![screen shot](https://raw.githubusercontent.com/wil-wu/mycloud/master/screenshots/admin.jpeg)