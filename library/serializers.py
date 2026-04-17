from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Book, Favorite, Review


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Review
        fields = ["id", "username", "score", "text", "created_at"]


class BookSerializer(serializers.ModelSerializer):
    average_rating = serializers.ReadOnlyField()
    reviews = ReviewSerializer(many=True, read_only=True)

    class Meta:
        model = Book
        fields = [
            "id",
            "title",
            "author",
            "description",
            "cover_image",
            "genre",
            "average_rating",
            "reviews",
            "content",
        ]


class FavoriteSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)
    book_id = serializers.PrimaryKeyRelatedField(
        queryset=Book.objects.all(),
        source="book",
        write_only=True,
    )

    class Meta:
        model = Favorite
        fields = ["id", "book", "book_id", "created_at"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def validate_username(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Логин не может быть пустым.")
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Этот логин уже занят.")
        return value

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Пользователь с таким email уже существует.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class ProfileUpdateSerializer(serializers.Serializer):
    username = serializers.CharField(required=False, max_length=150)
    email = serializers.EmailField(required=False)
    password = serializers.CharField(
        required=False,
        allow_blank=True,
        write_only=True,
    )

    def validate_username(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Логин не может быть пустым.")
        user = self.instance
        if User.objects.filter(username__iexact=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("Этот логин уже занят.")
        return value

    def validate_email(self, value):
        value = value.lower().strip()
        user = self.instance
        if User.objects.filter(email__iexact=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("Пользователь с таким email уже существует.")
        return value

    def validate_password(self, value):
        if value:
            validate_password(value)
        return value

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("Передайте хотя бы одно поле для обновления.")
        return attrs

    def update(self, instance, validated_data):
        instance.username = validated_data.get("username", instance.username)
        instance.email = validated_data.get("email", instance.email)

        password = validated_data.get("password")
        if password:
            instance.set_password(password)

        instance.save()
        return instance


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_password(self, value):
        validate_password(value)
        return value
