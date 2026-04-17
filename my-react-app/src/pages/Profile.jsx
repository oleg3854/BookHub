import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api, { clearStoredAuth, extractErrorMessage } from '../api';
import { useFavorites } from '../context/FavoritesContext';


const Profile = ({ setUsername, setIsAuth }) => {
  const [formData, setFormData] = useState({
    username: localStorage.getItem('username') || '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { clearFavorites } = useFavorites();

  useEffect(() => {
    api.get('user/me/')
      .then(({ data }) => {
        setFormData((prev) => ({
          ...prev,
          username: data.username || prev.username,
          email: data.email || '',
        }));
      })
      .catch(() => {
        clearStoredAuth();
        setIsAuth(false);
        setUsername('');
        clearFavorites();
        navigate('/login');
      });
  }, [clearFavorites, navigate, setIsAuth, setUsername]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await api.patch('user/update/', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      const updatedUser = response.data.user;
      localStorage.setItem('username', updatedUser.username);
      setUsername(updatedUser.username);

      if (response.data.requires_relogin) {
        clearStoredAuth();
        clearFavorites();
        setIsAuth(false);
        setUsername('');
        navigate('/login');
        return;
      }

      setSuccess('Профиль успешно обновлён.');
      setFormData((prev) => ({ ...prev, password: '' }));
    } catch (err) {
      setError(extractErrorMessage(err, 'Ошибка обновления данных.'));
    }
  };

  const handleLogout = () => {
    clearStoredAuth();
    clearFavorites();
    setIsAuth(false);
    setUsername('');
    navigate('/login');
  };

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: 'calc(100vh - 70px)', backgroundColor: '#f8fafc' }}>
      <div
        className="auth-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'white',
          padding: '40px',
          borderRadius: '28px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.04)',
          border: '1px solid #f1f5f9',
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: '24px', fontWeight: '800', color: '#0f172a' }}>
          Настройки профиля
        </h2>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.85rem' }}>Ваш логин</label>
            <input
              type="text"
              name="username"
              className="side-input"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.85rem' }}>Email</label>
            <input
              type="email"
              name="email"
              className="side-input"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.85rem' }}>Новый пароль</label>
            <input
              type="password"
              name="password"
              className="side-input"
              placeholder="Оставьте пустым, если не меняете"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              background: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Сохранить изменения
          </button>
        </form>

        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            marginTop: '16px',
            padding: '12px',
            background: 'none',
            border: '1px solid #ef4444',
            color: '#ef4444',
            borderRadius: '12px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Выйти из системы
        </button>
      </div>
    </div>
  );
};


export default Profile;
