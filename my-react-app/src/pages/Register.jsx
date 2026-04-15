import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:8000/api/register/', formData);
      alert('Регистрация прошла успешно!');
      navigate('/login');
    } catch (err) {
      console.error(err);
      alert('Ошибка при регистрации. Проверьте данные.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Вход в BookHub</h2>
        <p>Введите ваши данные, чтобы войти в систему</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="filter-group">
            <label>Логин</label>
            <input 
              type="text" 
              className="side-input" 
              placeholder="Ваш username"
              style={{paddingLeft: '40px'}}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required 
            />
            <span style={{position: 'absolute', left: '14px', bottom: '12px', opacity: 0.5}}>👤</span>
          </div>

          <div className="filter-group" style={{ marginTop: '20px' }}>
            <label>Почта</label>
            <input 
              type="email" 
              className="side-input" 
              placeholder="example@mail.com"
              style={{paddingLeft: '40px'}}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required 
            />
            <span style={{position: 'absolute', left: '14px', bottom: '12px', opacity: 0.5}}>✉️</span>
          </div>
          
          <div className="filter-group" style={{ marginTop: '20px' }}>
            <label>Пароль</label>
            <input 
              type="password" 
              className="side-input" 
              placeholder="••••••••"
              style={{paddingLeft: '40px'}}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required 
            />
            <span style={{position: 'absolute', left: '14px', bottom: '12px', opacity: 0.5}}>🔒</span>
          </div>
          
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '30px' }}>
            Зарегистрироваться
          </button>
        </form>
        
        <p className="auth-footer">
          Уже зарегистрированы? <Link to="/login" className="auth-link" style={{color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none'}}>Войти</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;