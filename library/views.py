from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Book, Favorite, Review
from .serializers import (
    BookSerializer,
    FavoriteSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    ReviewSerializer,
    UserSerializer,
)


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.is_staff


class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all().prefetch_related("reviews__user")
    serializer_class = BookSerializer
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def toggle_favorite(self, request, pk=None):
        book = self.get_object()
        favorite, created = Favorite.objects.get_or_create(user=request.user, book=book)

        if not created:
            favorite.delete()
            return Response({"status": "removed"}, status=status.HTTP_200_OK)

        return Response({"status": "added"}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def reviews(self, request, pk=None):
        book = self.get_object()
        score = request.data.get("score")
        text = request.data.get("text", "")

        if score is None:
            return Response(
                {"error": "Оценка обязательна."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            score = int(score)
            if not 1 <= score <= 5:
                raise ValueError
        except ValueError:
            return Response(
                {"error": "Оценка должна быть числом от 1 до 5."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        review, created = Review.objects.update_or_create(
            book=book,
            user=request.user,
            defaults={"score": score, "text": text},
        )

        return Response(
            {
                "message": "Отзыв сохранён." if created else "Отзыв обновлён.",
                "average_rating": book.average_rating,
                "review": ReviewSerializer(review).data,
            },
            status=status.HTTP_200_OK,
        )


class FavoriteViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Favorite.objects.filter(user=self.request.user)
            .select_related("book")
            .prefetch_related("book__reviews__user")
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    return Response(UserSerializer(request.user).data)


@api_view(["POST"])
@permission_classes([AllowAny])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()

    return Response(
        {
            "message": "Пользователь успешно создан.",
            "user": UserSerializer(user).data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_profile(request):
    serializer = ProfileUpdateSerializer(
        request.user,
        data=request.data,
        partial=True,
    )
    serializer.is_valid(raise_exception=True)
    password_changed = bool(serializer.validated_data.get("password"))
    user = serializer.save()

    return Response(
        {
            "message": "Профиль успешно обновлён.",
            "requires_relogin": password_changed,
            "user": UserSerializer(user).data,
        },
        status=status.HTTP_200_OK,
    )


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        user = User.objects.filter(email__iexact=email).first()
        response_data = {
            "message": "Если аккаунт с таким email существует, инструкция уже отправлена."
        }

        if not user:
            return Response(response_data, status=status.HTTP_200_OK)

        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_path = f"/reset-password/{uidb64}/{token}"
        reset_url = f"{settings.FRONTEND_URL}{reset_path}"

        send_mail(
            subject="BookHub: восстановление пароля",
            message=(
                "Вы запросили сброс пароля.\n\n"
                f"Перейдите по ссылке, чтобы задать новый пароль:\n{reset_url}\n\n"
                "Если это были не вы, просто проигнорируйте письмо."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        if settings.DEBUG:
            response_data["reset_path"] = reset_path
            response_data["reset_url"] = reset_url

        return Response(response_data, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, uidb64, token):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user_id = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"error": "Ссылка для сброса пароля недействительна."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {"error": "Ссылка для сброса пароля устарела или уже использована."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data["password"])
        user.save(update_fields=["password"])

        return Response(
            {"message": "Пароль успешно изменён."},
            status=status.HTTP_200_OK,
        )
