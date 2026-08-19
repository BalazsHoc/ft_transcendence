import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
DEBUG = os.getenv('DEBUG', 'True') == 'True'
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
if not DEBUG and SECRET_KEY in ('', 'dev-secret-key', 'change-me-in-production'):
    from django.core.exceptions import ImproperlyConfigured
    raise ImproperlyConfigured('Set a strong SECRET_KEY in .env when DEBUG is False.')
ALLOWED_HOSTS = [h.strip() for h in os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',') if h.strip()]
INSTALLED_APPS = [
    'daphne','django.contrib.admin','django.contrib.auth','django.contrib.contenttypes','django.contrib.sessions','django.contrib.messages','django.contrib.staticfiles',
    'rest_framework','rest_framework_simplejwt','corsheaders','drf_spectacular','channels','accounts','events','chat','geo','groups','social','notifications','public_api',
]
MIDDLEWARE = ['corsheaders.middleware.CorsMiddleware','django.middleware.security.SecurityMiddleware','django.contrib.sessions.middleware.SessionMiddleware','django.middleware.common.CommonMiddleware','django.middleware.csrf.CsrfViewMiddleware','django.contrib.auth.middleware.AuthenticationMiddleware','django.contrib.messages.middleware.MessageMiddleware','django.middleware.clickjacking.XFrameOptionsMiddleware']
ROOT_URLCONF='core.urls'
ASGI_APPLICATION='core.asgi.application'
WSGI_APPLICATION='core.wsgi.application'
CHANNEL_LAYERS={'default': {'BACKEND': 'channels.layers.InMemoryChannelLayer'}}
TEMPLATES=[{'BACKEND':'django.template.backends.django.DjangoTemplates','DIRS':[],'APP_DIRS':True,'OPTIONS':{'context_processors':['django.template.context_processors.request','django.contrib.auth.context_processors.auth','django.contrib.messages.context_processors.messages']}}]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("POSTGRES_DB", "transcendence"),
        "USER": os.getenv("POSTGRES_USER", "postgres"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD", "postgres"),
        "HOST": os.getenv("POSTGRES_HOST", "127.0.0.1"),
        "PORT": os.getenv("POSTGRES_PORT", "5432"),
    }
}
FIXTURE_DIRS = [BASE_DIR / "fixtures"]
AUTH_USER_MODEL='accounts.User'
AUTH_PASSWORD_VALIDATORS=[{'NAME':'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},{'NAME':'django.contrib.auth.password_validation.MinimumLengthValidator'},{'NAME':'django.contrib.auth.password_validation.CommonPasswordValidator'},{'NAME':'django.contrib.auth.password_validation.NumericPasswordValidator'}]
LANGUAGE_CODE='en-us'
TIME_ZONE='Europe/Vienna'
USE_I18N=True
USE_TZ=True
STATIC_URL='static/'
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL='/media/'
MEDIA_ROOT = BASE_DIR / "media"
DEFAULT_AUTO_FIELD='django.db.models.BigAutoField'
CORS_ALLOWED_ORIGINS=[o.strip() for o in os.getenv('CORS_ALLOWED_ORIGINS','http://localhost:5173').split(',') if o.strip()]
CSRF_TRUSTED_ORIGINS=[o.strip() for o in os.getenv('CSRF_TRUSTED_ORIGINS','').split(',') if o.strip()]
SECURE_PROXY_SSL_HEADER=('HTTP_X_FORWARDED_PROTO', 'https')
if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
# HTTPS redirect stays on nginx. Django must keep serving HTTP on :8000
# so container healthchecks and the proxy can reach Daphne.
REST_FRAMEWORK={'DEFAULT_AUTHENTICATION_CLASSES':('rest_framework_simplejwt.authentication.JWTAuthentication',),'DEFAULT_PERMISSION_CLASSES':('rest_framework.permissions.IsAuthenticatedOrReadOnly',),'DEFAULT_SCHEMA_CLASS':'drf_spectacular.openapi.AutoSchema','DEFAULT_THROTTLE_RATES':{'public_api':os.getenv('PUBLIC_API_RATE','60/minute'),'public_api_ip':os.getenv('PUBLIC_API_IP_RATE','120/minute')}}
SIMPLE_JWT={'ACCESS_TOKEN_LIFETIME':timedelta(hours=2),'REFRESH_TOKEN_LIFETIME':timedelta(days=7),'AUTH_HEADER_TYPES':('Bearer',)}
SPECTACULAR_SETTINGS={'TITLE':'Transcendence Sports MVP API','DESCRIPTION':'Authenticated application API plus a read-only, API-key protected public API.','VERSION':'0.1.0'}
GEO_PROVIDER=os.getenv('GEO_PROVIDER','auto')
MAPTILER_API_KEY=os.getenv('MAPTILER_API_KEY','')
MAPTILER_LIGHT_MAP_ID=os.getenv('MAPTILER_LIGHT_MAP_ID','dataviz-v4-light')
MAPTILER_DARK_MAP_ID=os.getenv('MAPTILER_DARK_MAP_ID','dataviz-dark')
GEOAPIFY_API_KEY=os.getenv('GEOAPIFY_API_KEY','')
NOMINATIM_USER_AGENT=os.getenv('NOMINATIM_USER_AGENT','ft-transcendence/1.0')
GEO_CACHE_TTL_DAYS=int(os.getenv('GEO_CACHE_TTL_DAYS','30'))
GEO_DEBUG=os.getenv('GEO_DEBUG','False') == 'True'
