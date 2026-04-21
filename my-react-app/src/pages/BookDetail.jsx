import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import api, { extractErrorMessage } from '../api';
import { useFavorites } from '../context/FavoritesContext';


const BookDetail = ({ isAuth }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [hover, setHover] = useState(0);

  const { favorites, toggleFavorite } = useFavorites();
  const isFavorite = favorites.some((fav) => fav.id === Number.parseInt(id, 10));

  useEffect(() => {
    api.get(`books/${id}/`)
      .then((response) => {
        setBook(response.data);
        setReviews(response.data.reviews || []);
      })
      .catch((error) => {
        console.error('Ошибка при загрузке книги:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (book?.title) {
      document.title = `${book.title} | BookHub`;
    }
  }, [book?.title]);

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!isAuth) {
      alert('Пожалуйста, войдите в систему, чтобы оставить отзыв.');
      return;
    }

    if (userRating === 0) {
      alert('Выберите оценку.');
      return;
    }

    try {
      const response = await api.post(`books/${id}/reviews/`, {
        score: userRating,
        text: reviewText,
      });

      setBook((prev) => ({ ...prev, average_rating: response.data.average_rating }));
      const newReview = response.data.review;

      setReviews((prev) => {
        const reviewIndex = prev.findIndex((review) => review.username === newReview.username);
        if (reviewIndex !== -1) {
          const updatedReviews = [...prev];
          updatedReviews[reviewIndex] = newReview;
          return updatedReviews;
        }

        return [newReview, ...prev];
      });

      setReviewText('');
      setUserRating(0);
      setHover(0);
      alert('Отзыв успешно сохранён.');
    } catch (error) {
      alert(extractErrorMessage(error, 'Не удалось сохранить отзыв.'));
    }
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Загрузка...</div>;
  if (!book) return <div style={{ padding: '100px', textAlign: 'center' }}>Книга не найдена</div>;

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', justifyContent: 'center', backgroundColor: '#fff' }}>
      <div style={{ width: '100%', maxWidth: '1100px', padding: 'clamp(20px, 4vw, 40px)' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', border: 'none', color: '#475569', cursor: 'pointer', padding: '10px 18px', borderRadius: '12px', marginBottom: '30px' }}>
          Назад
        </button>

        <div style={{ display: 'flex', gap: 'clamp(24px, 5vw, 50px)', marginBottom: '60px', flexWrap: 'wrap' }}>
          <div className="book-detail-cover-frame">
            {book.cover_image ? (
              <img src={book.cover_image} alt={book.title} className="book-detail-cover-image" />
            ) : (
              <div className="book-detail-cover-placeholder">
                Обложка отсутствует
              </div>
            )}

            {isAuth && (
              <button onClick={() => toggleFavorite(book)} className={`book-detail-favorite-button ${isFavorite ? 'book-detail-favorite-button--active' : ''}`}>
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={isFavorite ? 'white' : 'none'} stroke={isFavorite ? 'white' : '#1e293b'} strokeWidth="2.5" />
                </svg>
              </button>
            )}
          </div>

          <div style={{ flex: '1 1 320px', minWidth: '280px' }}>
            <h1 style={{ fontSize: 'clamp(2rem, 7vw, 3rem)', lineHeight: '1.08', fontWeight: '800', color: '#1e293b', marginBottom: '10px' }}>{book.title}</h1>
            <p style={{ fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', color: '#6366f1', fontWeight: '600', marginBottom: '25px' }}>{book.author}</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '35px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>⭐ {book.average_rating || 0}</span>
              <span style={{ backgroundColor: '#f1f5f9', color: '#6366f1', padding: '8px 20px', borderRadius: '12px', fontWeight: '700' }}>
                {book.genre}
              </span>
            </div>

            <p style={{ lineHeight: '1.8', color: '#475569', fontSize: '1.1rem', marginBottom: '30px' }}>
              {book.description || 'Описание отсутствует.'}
            </p>

            <Link
              to={`/reader/${book.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px 32px',
                backgroundColor: '#6366f1',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '16px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 10px 20px rgba(99, 102, 241, 0.3)',
                width: 'min(100%, 260px)',
              }}
              onMouseOver={(event) => {
                event.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(event) => {
                event.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Читать книгу
            </Link>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '40px 0' }} />

        <section style={{ maxWidth: '800px', width: '100%' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '30px' }}>Отзывы ({reviews.length})</h2>
          {isAuth ? (
            <div style={{ backgroundColor: '#f8fafc', padding: 'clamp(20px, 4vw, 30px)', borderRadius: '24px', marginBottom: '50px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Ваша оценка:</p>
              <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} onClick={() => setUserRating(star)} onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)} style={{ fontSize: '2rem', cursor: 'pointer', color: star <= (hover || userRating) ? '#fbbf24' : '#e2e8f0' }}>★</span>
                ))}
              </div>
              <textarea value={reviewText} onChange={(event) => setReviewText(event.target.value)} placeholder="Напишите ваш отзыв..." style={{ width: '100%', height: '120px', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              <button onClick={handleReviewSubmit} style={{ marginTop: '20px', padding: '14px 40px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', width: 'min(100%, 240px)' }}>
                Опубликовать
              </button>
            </div>
          ) : (
            <p style={{ color: '#64748b', marginBottom: '40px' }}>Войдите, чтобы оставить отзыв.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {reviews.map((review) => (
              <div key={review.id} style={{ padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', gap: '16px' }}>
                  <span style={{ fontWeight: 'bold' }}>{review.username}</span>
                  <span style={{ color: '#fbbf24' }}>{'★'.repeat(review.score)}</span>
                </div>
                <p style={{ margin: 0, color: '#475569' }}>{review.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};


export default BookDetail;
