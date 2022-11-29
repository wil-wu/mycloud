# mycloud
My Graduation Project
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
### 页面截图
___ 
登录  

![screen shot](https://raw.githubusercontent.com/wil-wu/mycloud/master/images/auth.png)  

文件  

![screen shot](https://raw.githubusercontent.com/wil-wu/mycloud/master/images/main.jpeg)  

文件详情  

![screen shot](https://raw.githubusercontent.com/wil-wu/mycloud/master/images/detail.jpeg)  

个人信息  

![screen shot](https://raw.githubusercontent.com/wil-wu/mycloud/master/images/info.jpeg)  

后台  

![screen shot](https://raw.githubusercontent.com/wil-wu/mycloud/master/images/admin.jpeg)