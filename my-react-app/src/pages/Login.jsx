import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { extractErrorMessage, publicApi } from '../api';
import { useFavorites } from '../context/FavoritesContext';


const Login = ({ setIsAuth, setUsername }) => {
  const [loginUsername, setLoginUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { fetchFavorites } = useFavorites();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const response = await publicApi.post('token/', {
        username: loginUsername,
        password,
      });

      localStorage.setItem('access', response.data.access);
      localStorage.setItem('refresh', response.data.refresh);
      localStorage.setItem('username', loginUsername);

      setIsAuth(true);
      setUsername(loginUsername);
      await fetchFavorites();
      navigate('/catalog');
    } catch (err) {
      setError(extractErrorMessage(err, 'Проверьте правильность логина и пароля.'));
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        width: '100%',
        minHeight: 'calc(100vh - 70px)',
        backgroundColor: '#f8fafc',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="auth-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'white',
          padding: '40px',
          borderRadius: '28px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.04)',
          border: '1px solid #f1f5f9',
          boxSizing: 'border-box',
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>
          Вход в BookHub
        </h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '32px', fontSize: '0.95rem' }}>
          Введите ваши данные, чтобы войти в систему
        </p>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="filter-group" style={{ textAlign: 'left', margin: 0 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.85rem', color: '#0f172a' }}>
              Логин
            </label>
            <input
              type="text"
              className="side-input"
              placeholder="Ваш username"
              value={loginUsername}
              onChange={(event) => setLoginUsername(event.target.value)}
              required
            />
          </div>

          <div className="filter-group" style={{ textAlign: 'left', margin: 0 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.85rem', color: '#0f172a' }}>
              Пароль
            </label>
            <input
              type="password"
              className="side-input"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <div style={{ textAlign: 'right', marginBottom: '15px' }}>
            <Link to="/forgot-password" style={{ fontSize: '14px', color: '#4f46e5', textDecoration: 'none' }}>
              Забыли пароль?
            </Link>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{
              width: '100%',
              marginTop: '10px',
              padding: '14px',
              background: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
          >
            Войти
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: '#64748b' }}>
          Еще нет аккаунта? <Link to="/register" style={{ color: '#4f46e5', fontWeight: '700', textDecoration: 'none' }}>Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
};


export default Login;
