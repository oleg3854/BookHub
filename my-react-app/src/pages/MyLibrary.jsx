import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import api, { clearStoredAuth } from '../api';
import { useFavorites } from '../context/FavoritesContext';
import { getStoredReadingProgress, READING_PROGRESS_EVENT } from '../readingProgress';


const tabs = [
  { id: 'reading', label: 'Читаю' },
  { id: 'finished', label: 'Прочитано' },
  { id: 'favorites', label: 'Избранное' },
];

const FAVORITE_REMOVAL_DELAY = 4500;

const getBookImage = (book) => book.cover_image || book.image || '';

const formatProgressDate = (dateValue) => {
  if (!dateValue) {
    return 'Недавно';
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return 'Недавно';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const LibraryBookCard = ({ book, progress, variant, onRemoveFavorite }) => {
  const isProgressCard = Boolean(progress);
  const isFavoriteCard = variant === 'favorites';
  const image = getBookImage(book);
  const targetPath = isProgressCard ? `/reader/${book.id}` : `/catalog/${book.id}`;
  const actionText = progress?.isFinished ? 'Перечитать' : isProgressCard ? 'Продолжить' : 'Открыть';
  const rating = Number.parseFloat(book.average_rating) || 0;

  const handleFavoriteClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onRemoveFavorite(book);
  };

  return (
    <Link to={targetPath} className="library-book-card">
      <div className="library-book-cover">
        {image ? (
          <img src={image} alt={book.title} />
        ) : (
          <div className="library-book-cover-placeholder">BookHub</div>
        )}

        {isFavoriteCard && (
          <button
            type="button"
            className="library-favorite-button"
            onClick={handleFavoriteClick}
            aria-label={`Убрать из избранного: ${book.title}`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill="currentColor"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="library-book-info">
        <div className="library-book-main">
          <div className="library-book-kicker">{book.genre || (variant === 'favorites' ? 'Избранное' : 'Книга')}</div>
          <h2>{book.title}</h2>
          <p>{book.author}</p>
        </div>

        {isProgressCard && (
          <div className="library-progress-block">
            <div className="library-progress-meta">
              <span>{progress.progressPercent}%</span>
              <span>{formatProgressDate(progress.updatedAt)}</span>
            </div>
            <div className="library-progress-track">
              <div style={{ width: `${progress.progressPercent}%` }} />
            </div>
            <div className="library-page-note">
              Страница {progress.page + 1} из {progress.totalPages}
            </div>
          </div>
        )}

        <div className="library-card-rating" aria-label={`Рейтинг ${rating.toFixed(1)} из 5`}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} className={star <= Math.round(rating) ? 'is-active' : ''}>★</span>
          ))}
          <strong>{rating.toFixed(1)}</strong>
        </div>

        <span className="library-card-action">{actionText}</span>
      </div>
    </Link>
  );
};

const EmptyLibraryState = ({ activeTab }) => {
  const messages = {
    reading: 'Начатые книги появятся здесь после открытия ридера.',
    finished: 'Прочитанные книги появятся здесь, когда прогресс дойдет до 100%.',
    favorites: 'Добавляйте книги в избранное из каталога.',
  };

  return (
    <div className="library-empty-state">
      <h2>Здесь пока пусто</h2>
      <p>{messages[activeTab]}</p>
      <Link to="/catalog">Перейти в каталог</Link>
    </div>
  );
};

const MyLibrary = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('access');
  const [books, setBooks] = useState([]);
  const [progressRecords, setProgressRecords] = useState(() => getStoredReadingProgress());
  const [activeTab, setActiveTab] = useState('reading');
  const [loading, setLoading] = useState(Boolean(token));
  const [pendingFavoriteRemovals, setPendingFavoriteRemovals] = useState({});
  const removalTimers = useRef(new Map());
  const { favorites, toggleFavorite } = useFavorites();

  useEffect(() => () => {
    removalTimers.current.forEach((timerId) => clearTimeout(timerId));
    removalTimers.current.clear();
  }, []);

  useEffect(() => {
    const refreshProgress = () => {
      setProgressRecords(getStoredReadingProgress());
    };

    refreshProgress();
    window.addEventListener('storage', refreshProgress);
    window.addEventListener(READING_PROGRESS_EVENT, refreshProgress);

    return () => {
      window.removeEventListener('storage', refreshProgress);
      window.removeEventListener(READING_PROGRESS_EVENT, refreshProgress);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    let isMounted = true;

    api.get('books/')
      .then(({ data }) => {
        if (isMounted) {
          setBooks(data);
        }
      })
      .catch((error) => {
        console.error('Ошибка загрузки книг для библиотеки:', error);

        if (error.response?.status === 401) {
          clearStoredAuth();
          navigate('/login');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [navigate, token]);

  const booksById = useMemo(() => {
    const nextBooksById = new Map();
    books.forEach((book) => nextBooksById.set(book.id, book));
    favorites.forEach((book) => nextBooksById.set(book.id, book));
    return nextBooksById;
  }, [books, favorites]);

  const progressBooks = useMemo(() => (
    progressRecords
      .map((progress) => {
        const book = booksById.get(progress.bookId);

        return {
          progress,
          book: {
            id: progress.bookId,
            title: book?.title || progress.title || `Книга #${progress.bookId}`,
            author: book?.author || progress.author || 'Автор не указан',
            genre: book?.genre || progress.genre || '',
            cover_image: book?.cover_image || progress.cover_image || '',
            average_rating: book?.average_rating || progress.average_rating || 0,
          },
        };
      })
      .filter((item) => Number.isInteger(item.book.id))
  ), [booksById, progressRecords]);

  const readingBooks = progressBooks.filter(({ progress }) => !progress.isFinished);
  const finishedBooks = progressBooks.filter(({ progress }) => progress.isFinished);
  const visibleFavoriteBooks = favorites.filter((book) => !pendingFavoriteRemovals[book.id]);
  const favoriteBooks = visibleFavoriteBooks.map((book) => ({ book, progress: null }));

  const visibleBooks = {
    reading: readingBooks,
    finished: finishedBooks,
    favorites: favoriteBooks,
  }[activeTab];

  const tabCounters = {
    reading: readingBooks.length,
    finished: finishedBooks.length,
    favorites: visibleFavoriteBooks.length,
  };

  const pendingFavoriteRemovalItems = Object.values(pendingFavoriteRemovals);

  const dismissPendingRemoval = (bookId) => {
    const timerId = removalTimers.current.get(bookId);
    if (timerId) {
      clearTimeout(timerId);
      removalTimers.current.delete(bookId);
    }

    setPendingFavoriteRemovals((prev) => {
      const next = { ...prev };
      delete next[bookId];
      return next;
    });
  };

  const scheduleFavoriteRemoval = (book) => {
    if (pendingFavoriteRemovals[book.id]) {
      return;
    }

    setPendingFavoriteRemovals((prev) => ({
      ...prev,
      [book.id]: { book, status: 'pending' },
    }));

    const timerId = window.setTimeout(async () => {
      removalTimers.current.delete(book.id);
      setPendingFavoriteRemovals((prev) => ({
        ...prev,
        [book.id]: { book, status: 'deleting' },
      }));

      await toggleFavorite(book);

      setPendingFavoriteRemovals((prev) => {
        const next = { ...prev };
        delete next[book.id];
        return next;
      });
    }, FAVORITE_REMOVAL_DELAY);

    removalTimers.current.set(book.id, timerId);
  };

  if (!token) {
    return (
      <div className="library-page">
        <div className="library-auth-state">
          <h1>Мои книги</h1>
          <p>Войдите в аккаунт, чтобы видеть начатые, прочитанные и избранные книги.</p>
          <div>
            <Link to="/login">Войти</Link>
            <Link to="/register">Регистрация</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="layout library-layout">
      <aside className="sidebar library-sidebar">
        <div className="filter-group">
          <label>Моя библиотека</label>
          <div className="side-menu">
            <Link to="/catalog" className="menu-item">
              Весь каталог
            </Link>
            <button type="button" className="menu-item active">
              Мои книги
            </button>
          </div>
        </div>

        <div className="filter-group">
          <label>Разделы</label>
          <div className="side-menu">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`menu-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                <span>{tabCounters[tab.id]}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="main-content library-main-content">
        <div className="library-shell">
        <header className="library-hero">
          <div>
            <p>BookHub</p>
            <h1>Мои книги</h1>
          </div>
        </header>

        <div className="library-stats">
          <div>
            <span>{readingBooks.length}</span>
            <p>читаю</p>
          </div>
          <div>
            <span>{finishedBooks.length}</span>
            <p>прочитано</p>
          </div>
          <div>
            <span>{visibleFavoriteBooks.length}</span>
            <p>в избранном</p>
          </div>
        </div>

        {loading ? (
          <div className="library-loading">Загрузка...</div>
        ) : visibleBooks.length > 0 ? (
          <div className="library-grid">
            {visibleBooks.map(({ book, progress }) => (
              <LibraryBookCard
                key={`${activeTab}-${book.id}`}
                book={book}
                progress={progress}
                variant={activeTab}
                onRemoveFavorite={scheduleFavoriteRemoval}
              />
            ))}
          </div>
        ) : (
          <EmptyLibraryState activeTab={activeTab} />
        )}
        </div>
      </main>

      {pendingFavoriteRemovalItems.length > 0 && (
        <div className="library-removal-toasts" aria-live="polite">
          {pendingFavoriteRemovalItems.map(({ book, status }) => (
            <div className="library-removal-toast" key={book.id}>
              <div className="library-removal-toast__icon" aria-hidden="true">
                <span />
              </div>
              <div className="library-removal-toast__content">
                <div className="library-removal-toast__title">
                  {status === 'deleting' ? 'Удаляем из избранного' : 'Книга удалена из избранного'}
                </div>
                <div className="library-removal-toast__book">{book.title}</div>
                <div className="library-removal-toast__progress">
                  <span className={status === 'deleting' ? 'is-deleting' : ''} />
                </div>
              </div>
              <button
                type="button"
                className="library-removal-toast__undo"
                onClick={() => dismissPendingRemoval(book.id)}
                disabled={status === 'deleting'}
              >
                Отменить
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyLibrary;
