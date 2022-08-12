# mycloud
My Graduation Project  

[演示网站 tiny cloud](https://cloudself.net)
### 本地运行
1. 安装依赖
```
pip install -r requirements.txt
```
2. 检查配置文件，修改数据库配置
```
# mycloud/settings.py

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'cloud',
        'HOST': '127.0.0.1',
        'PORT': '3306',
        'USER': 'root',
        'PASSWORD': 'your password',
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