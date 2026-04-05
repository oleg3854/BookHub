from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator
from django.contrib.auth.models import User
from django.db.models import Avg

class Book(models.Model):
    GENRE_CHOICES = [
        ('Классика', 'Классика'),
        ('Роман', 'Роман'),
        ('Фантастика', 'Фантастика'),
        ('Фэнтези', 'Фэнтези'),
        ('Детектив', 'Детектив'),
        ('Триллер', 'Триллер'),
        ('Психологический триллер', 'Психологический триллер'),
        ('Ужасы', 'Ужасы'),
        ('Мистика', 'Мистика'),
        ('Приключения', 'Приключения'),
        ('Поэзия', 'Поэзия'),
        ('Детская литература', 'Детская литература'),
        
        ('Психология', 'Психология'),
        ('Саморазвитие', 'Саморазвитие'),
        ('Наука', 'Наука'),
        ('Научпоп', 'Научно-популярная литература'),
        ('Программирование', 'Программирование'),
        ('Бизнес', 'Бизнес'),
        ('Экономика', 'Экономика'),
        ('Политика', 'Политика'),
        ('История', 'История'),
        ('Философия', 'Философия'),
        ('Искусство', 'Искусство'),
        ('Биография', 'Биография и мемуары'),
        ('Публицистика', 'Публицистика')
    ]

    title = models.CharField(max_length=200, verbose_name="Название")
    author = models.CharField(max_length=100, verbose_name="Автор")
    description = models.TextField(verbose_name="Описание", blank=True)
    
    cover_image = models.ImageField(
        upload_to='covers/', 
        verbose_name="Обложка", 
        blank=True, 
        null=True
    )
    
    genre = models.CharField(
        max_length=100, 
        choices=GENRE_CHOICES, 
        default="Классика", 
        verbose_name="Жанр"
    )

    content = models.TextField(
        verbose_name="Текст книги", 
        blank=True, 
        default="Текст этой книги скоро появится..."
    )

    @property
    def average_rating(self):
        result = self.reviews.aggregate(Avg('score'))['score__avg']
        return round(result, 1) if result else 0.0

    def __str__(self):
        return self.title

class Review(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    score = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name="Оценка"
    )
    text = models.TextField(verbose_name="Текст отзыва", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('book', 'user')

    def __str__(self):
        return f"{self.user.username} - {self.book.title} ({self.score})"

class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_favorites')
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'book')

    def __str__(self):
        return f"{self.user.username} добавил в избранное {self.book.title}"