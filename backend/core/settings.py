import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()
BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
DEBUG = os.getenv('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = [h.strip() for h in os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',') if h.strip()]
INSTALLED_APPS = [
    'daphne','django.contrib.admin','django.contrib.auth','django.contrib.contenttypes','django.contrib.sessions','django.contrib.messages','django.contrib.staticfiles',
    'rest_framework','rest_framework_simplejwt','corsheaders','drf_spectacular','channels','accounts','events','chat','geo',
]
MIDDLEWARE = ['corsheaders.middleware.CorsMiddleware','django.middleware.security.SecurityMiddleware','django.contrib.sessions.middleware.SessionMiddleware','django.middleware.common.CommonMiddleware','django.middleware.csrf.CsrfViewMiddleware','django.contrib.auth.middleware.AuthenticationMiddleware','django.contrib.messages.middleware.MessageMiddleware','django.middleware.clickjacking.XFrameOptionsMiddleware']
ROOT_URLCONF='core.urls'
ASGI_APPLICATION='core.asgi.application'
WSGI_APPLICATION='core.wsgi.application'
CHANNEL_LAYERS={'default': {'BACKEND': 'channels.layers.InMemoryChannelLayer'}}
TEMPLATES=[{'BACKEND':'django.template.backends.django.DjangoTemplates','DIRS':[],'APP_DIRS':True,'OPTIONS':{'context_processors':['django.template.context_processors.request','django.contrib.auth.context_processors.auth','django.contrib.messages.context_processors.messages']}}]

# For production, replace the following with your PostgreSQL configuration and ensure environment variables are set appropriately.
# DATABASES={
#   'default': {
# 	    'ENGINE':'django.db.backends.postgresql',
#    	'NAME':os.getenv('POSTGRES_DB','transcendence'),
# 	    'USER':os.getenv('POSTGRES_USER','postgres'),
# 	    'PASSWORD':os.getenv('POSTGRES_PASSWORD','postgres'),
# 	    'HOST':os.getenv('POSTGRES_HOST','localhost'),
# 	    'PORT':os.getenv('POSTGRES_PORT','5432')}}

# For development, we use SQLite for simplicity. In production, switch to PostgreSQL or another robust database system.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}
AUTH_USER_MODEL='accounts.User'
AUTH_PASSWORD_VALIDATORS=[{'NAME':'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},{'NAME':'django.contrib.auth.password_validation.MinimumLengthValidator'},{'NAME':'django.contrib.auth.password_validation.CommonPasswordValidator'},{'NAME':'django.contrib.auth.password_validation.NumericPasswordValidator'}]
LANGUAGE_CODE='en-us'
TIME_ZONE='Europe/Vienna'
USE_I18N=True
USE_TZ=True
STATIC_URL='static/'
STATIC_ROOT = BASE_DIR / "staticfiles"
DEFAULT_AUTO_FIELD='django.db.models.BigAutoField'
CORS_ALLOWED_ORIGINS=[o.strip() for o in os.getenv('CORS_ALLOWED_ORIGINS','http://localhost:5173').split(',') if o.strip()]
REST_FRAMEWORK={'DEFAULT_AUTHENTICATION_CLASSES':('rest_framework_simplejwt.authentication.JWTAuthentication',),'DEFAULT_PERMISSION_CLASSES':('rest_framework.permissions.IsAuthenticatedOrReadOnly',),'DEFAULT_SCHEMA_CLASS':'drf_spectacular.openapi.AutoSchema'}
SIMPLE_JWT={'ACCESS_TOKEN_LIFETIME':timedelta(hours=2),'REFRESH_TOKEN_LIFETIME':timedelta(days=7),'AUTH_HEADER_TYPES':('Bearer',)}
SPECTACULAR_SETTINGS={'TITLE':'Transcendence Sports MVP API','DESCRIPTION':'Sports events, RSVPs and event chat backend for Transcendence MVP.','VERSION':'0.1.0'}
GEO_PROVIDER=os.getenv('GEO_PROVIDER','auto')
MAPTILER_API_KEY=os.getenv('MAPTILER_API_KEY','')
GEOAPIFY_API_KEY=os.getenv('GEOAPIFY_API_KEY','')
NOMINATIM_USER_AGENT=os.getenv('NOMINATIM_USER_AGENT','ft-transcendence/1.0')
GEO_CACHE_TTL_DAYS=int(os.getenv('GEO_CACHE_TTL_DAYS','30'))
GEO_DEBUG=os.getenv('GEO_DEBUG','False') == 'True'
