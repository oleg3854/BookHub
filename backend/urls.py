from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from backend.views import FrontendAppView, healthcheck
from library.views import (
    BookViewSet,
    FavoriteViewSet,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    current_user,
    register_user,
    update_profile,
)


router = DefaultRouter()
router.register(r"books", BookViewSet)
router.register(r"favorites", FavoriteViewSet, basename="favorite")


urlpatterns = [
    path("health/", healthcheck, name="healthcheck"),
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("api/register/", register_user, name="register_user"),
    path("api/user/me/", current_user, name="current_user"),
    path("api/user/update/", update_profile, name="update_profile"),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/password-reset/", PasswordResetRequestView.as_view(), name="password_reset"),
    path(
        "api/password-reset-confirm/<uidb64>/<token>/",
        PasswordResetConfirmView.as_view(),
        name="password_reset_confirm",
    ),
    re_path(
        r"^media/(?P<path>.*)$",
        serve,
        {"document_root": settings.MEDIA_ROOT},
    ),
    re_path(
        r"^(?!api/|admin/|media/|static/|health/).*$",
        FrontendAppView.as_view(),
        name="frontend",
    ),
]
