import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { extractErrorMessage, publicApi } from '../api';


const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.passwordConfirm) {
      setError('Пароли не совпадают.');
      return;
    }

    try {
      await publicApi.post('register/', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      setSuccess('Регистрация прошла успешно. Теперь можно войти в аккаунт.');
      setTimeout(() => navigate('/login'), 900);
    } catch (err) {
      setError(extractErrorMessage(err, 'Ошибка при регистрации. Проверьте данные.'));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Регистрация в BookHub</h2>
        <p>Создайте аккаунт, чтобы сохранять книги и писать отзывы</p>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="filter-group">
            <label>Логин</label>
            <input
              type="text"
              name="username"
              className="side-input"
              placeholder="Ваш username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="filter-group" style={{ marginTop: '20px' }}>
            <label>Почта</label>
            <input
              type="email"
              name="email"
              className="side-input"
              placeholder="example@mail.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="filter-group" style={{ marginTop: '20px' }}>
            <label>Пароль</label>
            <input
              type="password"
              name="password"
              className="side-input"
              placeholder="Минимум 8 символов"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="filter-group" style={{ marginTop: '20px' }}>
            <label>Повторите пароль</label>
            <input
              type="password"
              name="passwordConfirm"
              className="side-input"
              placeholder="Повторите пароль"
              value={formData.passwordConfirm}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '30px' }}>
            Зарегистрироваться
          </button>
        </form>

        <p className="auth-footer" style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: '#64748b' }}>
          Уже зарегистрированы? <Link to="/login" className="auth-link" style={{ color: '#4f46e5', fontWeight: '700', textDecoration: 'none' }}>Войти</Link>
        </p>
      </div>
    </div>
  );
};


export default Register;
