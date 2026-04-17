from django.contrib import admin

from .models import Book, Favorite, Review


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "genre", "average_rating")
    list_filter = ("genre",)
    search_fields = ("title", "author")


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("book", "user", "score", "created_at")
    list_filter = ("score", "created_at")
    search_fields = ("book__title", "user__username")


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ("book", "user", "created_at")
    search_fields = ("book__title", "user__username")
