import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import api, { clearStoredAuth } from '../api';
import { useFavorites } from '../context/FavoritesContext';
import { getStoredReadingProgress, READING_PROGRESS_EVENT } from '../readingProgress';


const tabs = [
  { id: 'reading', label: 'Читаю' },
  { id: 'finished', label: 'Прочитано' },
  { id: 'favorites', label: 'Избранное' },
];

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

const LibraryBookCard = ({ book, progress, variant }) => {
  const isProgressCard = Boolean(progress);
  const image = getBookImage(book);
  const targetPath = isProgressCard ? `/reader/${book.id}` : `/catalog/${book.id}`;
  const actionText = progress?.isFinished ? 'Перечитать' : isProgressCard ? 'Продолжить' : 'Открыть';

  return (
    <Link to={targetPath} className="library-book-card">
      <div className="library-book-cover">
        {image ? (
          <img src={image} alt={book.title} />
        ) : (
          <div className="library-book-cover-placeholder">BookHub</div>
        )}
      </div>

      <div className="library-book-info">
        <div>
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
  const { favorites } = useFavorites();

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
  const favoriteBooks = favorites.map((book) => ({ book, progress: null }));

  const visibleBooks = {
    reading: readingBooks,
    finished: finishedBooks,
    favorites: favoriteBooks,
  }[activeTab];

  const tabCounters = {
    reading: readingBooks.length,
    finished: finishedBooks.length,
    favorites: favorites.length,
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
    <div className="library-page">
      <div className="library-shell">
        <header className="library-hero">
          <div>
            <p>BookHub</p>
            <h1>Мои книги</h1>
          </div>
          <Link to="/catalog">Открыть каталог</Link>
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
            <span>{favorites.length}</span>
            <p>в избранном</p>
          </div>
        </div>

        <div className="library-tabs" role="tablist" aria-label="Разделы моей библиотеки">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`library-tab ${activeTab === tab.id ? 'library-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              <span>{tabCounters[tab.id]}</span>
            </button>
          ))}
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
              />
            ))}
          </div>
        ) : (
          <EmptyLibraryState activeTab={activeTab} />
        )}
      </div>
    </div>
  );
};

export default MyLibrary;
