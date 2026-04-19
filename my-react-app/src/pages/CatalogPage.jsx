import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import api from '../api';
import { useFavorites } from '../context/FavoritesContext';
import BookCard from '../components/BookCard';

const BookSkeleton = () => (
  <div className="skeleton-card" style={{ background: '#f8fafc', borderRadius: '24px', padding: '20px' }}>
    <div className="skeleton-image" style={{ height: '360px', background: '#e2e8f0', borderRadius: '18px' }}></div>
    <div style={{ height: '20px', background: '#e2e8f0', marginTop: '15px', width: '80%', borderRadius: '4px' }}></div>
    <div style={{ height: '15px', background: '#e2e8f0', marginTop: '10px', width: '60%', borderRadius: '4px' }}></div>
  </div>
);

const Catalog = ({ isAuth }) => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Все');
  const [selectedRating, setSelectedRating] = useState(0);
  const [showFavorites, setShowFavorites] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { favorites } = useFavorites();

  const closeFiltersOnPhone = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 640) {
      setFiltersOpen(false);
    }
  };

  useEffect(() => {
    if (!filtersOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setFiltersOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filtersOpen]);

  useEffect(() => {
    api.get('books/')
      .then(res => {
        setBooks(res.data);
        setFilteredBooks(res.data);
        setTimeout(() => setLoading(false), 600); 
      })
      .catch(err => {
        console.error("Ошибка при загрузке:", err);
        setLoading(false);
      });
  }, []);

  const genres = useMemo(() => {
    if (books.length === 0) return ['Все'];
    const uniqueGenres = [...new Set(books.map(book => book.genre).filter(Boolean))];
    return ['Все', ...uniqueGenres.sort()];
  }, [books]);

  useEffect(() => {
    const results = books.filter(book => {
      const matchesSearch = 
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesGenre = selectedGenre === 'Все' || book.genre === selectedGenre;
      
      const bookRatingValue = Math.floor(Number(book.average_rating || 0));
      const matchesRating = selectedRating === 0 || bookRatingValue === selectedRating;

      return matchesSearch && matchesGenre && matchesRating;
    });
    
    setFilteredBooks(results);
  }, [searchTerm, selectedGenre, selectedRating, books]);

  const displayBooks = useMemo(() => {
    if (showFavorites && isAuth) {
      return filteredBooks.filter(book => favorites.some(fav => fav.id === book.id));
    }
    return filteredBooks;
  }, [showFavorites, favorites, filteredBooks, isAuth]);

  return (
    <div className="layout catalog-layout">
      {filtersOpen && (
        <button
          type="button"
          className="catalog-sidebar-overlay"
          onClick={() => setFiltersOpen(false)}
          aria-label="Закрыть фильтры"
        />
      )}

      <aside className={`sidebar catalog-sidebar ${filtersOpen ? 'catalog-sidebar--open' : ''}`}>
        <div className="catalog-sidebar-header">
          <div className="sidebar-brand">BookHub</div>
          <button
            type="button"
            className="sidebar-close"
            onClick={() => setFiltersOpen(false)}
            aria-label="Закрыть фильтры"
          >
            ×
          </button>
        </div>
        
        <div className="filter-group">
          <label>Моя библиотека</label>
          <div className="side-menu">
            <button 
              className={`menu-item ${!showFavorites ? 'active' : ''}`}
              onClick={() => {
                setShowFavorites(false);
                closeFiltersOnPhone();
              }}
            >
              Весь каталог
            </button>
            {isAuth && (
              <button 
                className={`menu-item ${showFavorites ? 'active' : ''}`}
                onClick={() => {
                  setShowFavorites(true);
                  closeFiltersOnPhone();
                }}
              >
                Избранное ({favorites.length})
              </button>
            )}
          </div>
        </div>

        <div className="filter-group">
          <label>Поиск</label>
          <input 
            type="text" 
            placeholder="Название или автор" 
            className="side-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Категории</label>
          <div className="side-menu">
            {genres.map(genre => (
              <button 
                key={genre}
                className={`menu-item ${selectedGenre === genre ? 'active' : ''}`}
                onClick={() => {
                  setSelectedGenre(genre);
                  closeFiltersOnPhone();
                }}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Рейтинг</label>
          <div className="star-rating-filter" style={{ display: 'flex', gap: '5px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span 
                key={star}
                onClick={() => {
                  setSelectedRating(selectedRating === star ? 0 : star);
                  closeFiltersOnPhone();
                }}
                style={{ 
                  cursor: 'pointer', 
                  fontSize: '1.5rem', 
                  color: star <= selectedRating ? '#fbbf24' : '#e2e8f0',
                  transition: 'color 0.2s'
                }}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <h1>{showFavorites ? 'Избранные книги' : 'Каталог книг'}</h1>
          <div className="catalog-actions">
            <button
              type="button"
              className="mobile-filters-trigger"
              onClick={() => setFiltersOpen(true)}
            >
              <span className="mobile-filters-trigger__icon">☰</span>
              Фильтры
            </button>
            <div className="count-badge">Найдено: {displayBooks.length}</div>
          </div>
        </header>

        <div className="book-grid catalog-grid">
          {loading ? (
            [...Array(8)].map((_, i) => <BookSkeleton key={i} />)
          ) : displayBooks.length > 0 ? (
            displayBooks.map(book => (
              <Link to={`/catalog/${book.id}`} key={book.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <BookCard 
                  id={book.id}
                  title={book.title}
                  author={book.author}
                  genre={book.genre}
                  image={book.cover_image}
                  isAuth={isAuth}
                  average_rating={book.average_rating} 
                />
              </Link>
            ))
          ) : (
            <div className="no-results" style={{ width: '100%', textAlign: 'center', marginTop: '24px' }}>
              <h3>{showFavorites ? "В избранном пока пусто 💔" : "Ничего не найдено 🔍"}</h3>
              <p style={{ color: '#64748b' }}>Попробуйте изменить параметры фильтрации</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Catalog;
