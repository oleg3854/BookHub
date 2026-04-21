import React from 'react';
import { useFavorites } from '../context/FavoritesContext';

function BookCard({ id, title, author, genre, image, isAuth, average_rating }) {
  const { favorites, toggleFavorite } = useFavorites();
  
  const isFavorite = favorites.some((fav) => fav.id === id);
  
  const numRating = parseFloat(average_rating) || 0;

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({ id, title, author, genre, image, average_rating });
  };

  return (
    <div className="book-card" style={{
      borderRadius: '24px',
      backgroundColor: '#fff',
      boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid #f1f5f9',
      position: 'relative',
      overflow: 'hidden',
      height: '100%',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-10px)';
      e.currentTarget.style.boxShadow = '0 15px 45px rgba(0,0,0,0.1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.05)';
    }}
    >
      <div className="book-card-cover">
        {image ? (
          <img
            src={image}
            alt={title}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'grid',
              placeItems: 'center',
              background: 'linear-gradient(135deg, #e2e8f0, #f8fafc)',
              color: '#64748b',
              fontWeight: '700',
            }}
          >
            Нет обложки
          </div>
        )}
        
        <div style={{
          position: 'absolute', top: '15px', left: '15px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '6px 14px', borderRadius: '12px',
          fontSize: '0.75rem', color: '#6366f1', fontWeight: '800', zIndex: 2
        }}>
          {genre}
        </div>

        {isAuth && (
          <button 
            onClick={handleFavoriteClick}
            style={{
              position: 'absolute', top: '15px', right: '15px',
              width: '42px', height: '42px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', border: 'none',
              backgroundColor: isFavorite ? '#4f46e5' : 'rgba(255, 255, 255, 0.95)',
              boxShadow: isFavorite ? '0 4px 15px rgba(79, 102, 241, 0.4)' : '0 2px 10px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              zIndex: 10, padding: 0
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path 
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill={isFavorite ? "white" : "none"} 
                stroke={isFavorite ? "white" : "#1e293b"} 
                strokeWidth="2.5"
              />
            </svg>
          </button>
        )}
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        <h3 style={{ 
          margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: '800', color: '#1e293b',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', minHeight: '2.6rem', lineHeight: '1.3'
        }}>
          {title}
        </h3>
        <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>
          {author}
        </p>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'auto' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} style={{ 
              color: star <= Math.round(numRating) ? '#fbbf24' : '#e2e8f0', 
              fontSize: '18px' 
            }}>★</span>
          ))}
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', marginLeft: '6px', fontWeight: '700' }}>
            {numRating.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default BookCard;
