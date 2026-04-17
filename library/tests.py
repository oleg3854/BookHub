from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.test import TestCase, override_settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APIClient

from .models import Book, Favorite, Review


@override_settings(
    DEBUG=True,
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    FRONTEND_URL="http://127.0.0.1:5173",
)
class BookHubApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="reader",
            email="reader@example.com",
            password="StrongPass123!",
        )
        self.staff = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="StrongPass123!",
            is_staff=True,
        )
        self.book = Book.objects.create(
            title="Clean Architecture",
            author="Robert Martin",
            description="A practical software book.",
            genre="Программирование",
            content="Глава 1\nТекст главы",
        )

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_books_are_read_only_for_anonymous_users(self):
        response = self.client.post(
            "/api/books/",
            {
                "title": "New Book",
                "author": "Author",
                "genre": "Фантастика",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(Book.objects.count(), 1)

    def test_staff_can_create_book(self):
        self.authenticate(self.staff)

        response = self.client.post(
            "/api/books/",
            {
                "title": "Domain-Driven Design",
                "author": "Eric Evans",
                "genre": "Программирование",
                "description": "Classic architecture book",
                "content": "Chapter 1",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(Book.objects.filter(title="Domain-Driven Design").exists())

    def test_register_requires_unique_email(self):
        response = self.client.post(
            "/api/register/",
            {
                "username": "newreader",
                "email": "reader@example.com",
                "password": "StrongPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)

    def test_profile_update_returns_relogin_when_password_changes(self):
        self.authenticate(self.user)

        response = self.client.patch(
            "/api/user/update/",
            {
                "username": "reader-updated",
                "email": "reader-updated@example.com",
                "password": "EvenStronger123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["requires_relogin"])

        self.user.refresh_from_db()
        self.assertEqual(self.user.username, "reader-updated")
        self.assertEqual(self.user.email, "reader-updated@example.com")
        self.assertTrue(self.user.check_password("EvenStronger123!"))

    def test_favorite_toggle_adds_and_removes_book(self):
        self.authenticate(self.user)

        add_response = self.client.post(f"/api/books/{self.book.pk}/toggle_favorite/")
        remove_response = self.client.post(f"/api/books/{self.book.pk}/toggle_favorite/")

        self.assertEqual(add_response.status_code, 201)
        self.assertEqual(remove_response.status_code, 200)
        self.assertFalse(Favorite.objects.filter(user=self.user, book=self.book).exists())

    def test_review_endpoint_creates_and_updates_single_review(self):
        self.authenticate(self.user)

        create_response = self.client.post(
            f"/api/books/{self.book.pk}/reviews/",
            {"score": 5, "text": "Очень полезная книга"},
            format="json",
        )
        update_response = self.client.post(
            f"/api/books/{self.book.pk}/reviews/",
            {"score": 4, "text": "После перечитывания ставлю 4"},
            format="json",
        )

        self.assertEqual(create_response.status_code, 200)
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(Review.objects.filter(book=self.book, user=self.user).count(), 1)
        self.assertEqual(update_response.data["average_rating"], 4.0)

    def test_password_reset_request_sends_email_and_returns_debug_link(self):
        response = self.client.post(
            "/api/password-reset/",
            {"email": self.user.email},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("reset_path", response.data)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(response.data["reset_url"], mail.outbox[0].body)

    def test_password_reset_confirm_changes_password(self):
        uidb64 = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        response = self.client.post(
            f"/api/password-reset-confirm/{uidb64}/{token}/",
            {"password": "BrandNewPass123!"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("BrandNewPass123!"))
