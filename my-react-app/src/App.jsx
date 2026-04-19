import React, { useEffect, useState } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';

import api, { clearStoredAuth } from './api';
import './App.css';
import BookDetail from './pages/BookDetail';
import Catalog from './pages/CatalogPage';
import ForgotPassword from './pages/ForgotPassword';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Reader from './pages/Reader';
import Register from './pages/Register';
import ResetPasswordConfirm from './pages/ResetPasswordConfirm';
import { FavoritesProvider } from './context/FavoritesContext';


function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [username, setUsername] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem('access');
    const savedUsername = localStorage.getItem('username');

    if (!token) {
      return undefined;
    }

    if (savedUsername) {
      setIsAuth(true);
      setUsername(savedUsername);
    }

    api.get('user/me/')
      .then(({ data }) => {
        if (!isMounted) {
          return;
        }

        setIsAuth(true);
        setUsername(data.username);
        localStorage.setItem('username', data.username);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        clearStoredAuth();
        setIsAuth(false);
        setUsername('');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    clearStoredAuth();
    setIsAuth(false);
    setUsername('');
    setMenuOpen(false);
    window.location.href = '/';
  };

  const closeMobileMenu = () => {
    setMenuOpen(false);
  };

  return (
    <FavoritesProvider>
      <BrowserRouter>
        <header className="app-header">
          <div className="app-brand-row">
            <Link to="/" className="app-brand" onClick={closeMobileMenu}>
              BookHub
            </Link>

            <button
              type="button"
              className={`nav-toggle ${menuOpen ? 'nav-toggle--open' : ''}`}
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={menuOpen}
            >
              <span className="nav-toggle-line" />
              <span className="nav-toggle-line" />
              <span className="nav-toggle-line" />
            </button>
          </div>

          <nav className={`app-nav ${menuOpen ? 'app-nav--open' : ''}`}>
            <div className="app-nav-links">
              <Link to="/" className="app-nav-link" onClick={closeMobileMenu}>
                Главная
              </Link>
              <Link to="/catalog" className="app-nav-link" onClick={closeMobileMenu}>
                Каталог
              </Link>
            </div>

            {isAuth ? (
              <div className="auth-actions auth-actions--signed">
                <Link to="/profile" className="profile-link" onClick={closeMobileMenu}>
                  Привет, <strong>{username}</strong>!
                </Link>

                <button type="button" onClick={handleLogout} className="logout-button">
                  Выйти
                </button>
              </div>
            ) : (
              <div className="auth-actions">
                <Link to="/login" className="ghost-link" onClick={closeMobileMenu}>
                  Войти
                </Link>
                <Link to="/register" className="primary-link" onClick={closeMobileMenu}>
                  Регистрация
                </Link>
              </div>
            )}
          </nav>
        </header>

        <main className="main-app-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<Catalog isAuth={isAuth} />} />
            <Route path="/reader/:id" element={<Reader />} />
            <Route
              path="/catalog/:id"
              element={(
                <div className="detail-wrapper">
                  <BookDetail isAuth={isAuth} />
                </div>
              )}
            />
            <Route path="/login" element={<Login setIsAuth={setIsAuth} setUsername={setUsername} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile setUsername={setUsername} setIsAuth={setIsAuth} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:uidb64/:token" element={<ResetPasswordConfirm />} />
          </Routes>
        </main>
      </BrowserRouter>
    </FavoritesProvider>
  );
}


export default App;
