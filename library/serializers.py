from rest_framework import serializers
from .models import Book, Favorite, Review
from django.contrib.auth.models import User

class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'username', 'score', 'text', 'created_at']

class BookSerializer(serializers.ModelSerializer):
    average_rating = serializers.ReadOnlyField()
    reviews = ReviewSerializer(many=True, read_only=True)

    class Meta:
        model = Book
        fields = [
            'id', 'title', 'author', 'description', 
            'cover_image', 'genre', 'average_rating', 'reviews','content'
        ]

class FavoriteSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)
    book_id = serializers.PrimaryKeyRelatedField(
        queryset=Book.objects.all(), source='book', write_only=True
    )

    class Meta:
        model = Favorite
        fields = ['id', 'book', 'book_id', 'created_at']