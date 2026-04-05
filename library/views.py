from django.contrib.auth.models import User
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from .models import Book, Review, Favorite
from .serializers import BookSerializer, ReviewSerializer, FavoriteSerializer
from django.db.models import Avg
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all().prefetch_related('reviews__user')
    serializer_class = BookSerializer

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_favorite(self, request, pk=None):
        book = self.get_object()
        favorite, created = Favorite.objects.get_or_create(user=request.user, book=book)
        
        if not created:
            favorite.delete()
            return Response({'status': 'removed'}, status=status.HTTP_200_OK)
            
        return Response({'status': 'added'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reviews(self, request, pk=None):
        book = self.get_object()
        user = request.user
        score = request.data.get('score')
        text = request.data.get('text', '')

        if score is None:
            return Response({'error': 'Оценка обязательна'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            score = int(score)
            if not (1 <= score <= 5):
                raise ValueError
        except ValueError:
            return Response({'error': 'Оценка должна быть числом от 1 до 5'}, status=status.HTTP_400_BAD_REQUEST)

        review_obj, created = Review.objects.update_or_create(
            book=book, 
            user=user,
            defaults={'score': score, 'text': text}
        )

        return Response({
            'message': 'Отзыв сохранен' if created else 'Отзыв обновлен',
            'average_rating': book.average_rating,
            'review': ReviewSerializer(review_obj).data
        }, status=status.HTTP_200_OK)

class FavoriteViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)

@api_view(['POST'])
def register_user(request):
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email')
    
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Логин занят'}, status=status.HTTP_400_BAD_REQUEST)
    
    user = User.objects.create_user(username=username, password=password, email=email)
    return Response({'message': 'Пользователь создан'}, status=status.HTTP_201_CREATED)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    new_username = request.data.get('username')
    new_password = request.data.get('password')

    if not new_username:
        return Response({'error': 'Имя пользователя не может быть пустым'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=new_username).exclude(pk=user.pk).exists():
        return Response({'error': 'Этот логин уже занят'}, status=status.HTTP_400_BAD_REQUEST)

    user.username = new_username
    
    if new_password:
        user.set_password(new_password)
    
    user.save()
    return Response({'message': 'Профиль успешно обновлен'}, status=status.HTTP_200_OK)

