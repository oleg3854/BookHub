from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from library.views import BookViewSet, FavoriteViewSet, register_user, update_profile
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import views as auth_views

from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()
router.register(r'books', BookViewSet)
router.register(r'favorites', FavoriteViewSet, basename='favorite') 

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)), # Теперь здесь будут и /api/books/, и /api/favorites/
    path('api/register/', register_user),
    path('api/user/update/', update_profile),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/password-reset/', auth_views.PasswordResetView.as_view(), name='password_reset'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)