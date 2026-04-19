import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { extractErrorMessage, publicApi } from '../api';


const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage('');

        try {
            const response = await publicApi.post('password-reset/', { email });
            setMessage(response.data.message);
            setIsError(false);
        } catch (err) {
            setMessage(extractErrorMessage(err, 'Ошибка! Проверьте правильность введенного email.'));
            setIsError(true);
        }
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: 'calc(100vh - 70px)', background: '#f8fafc', padding: '20px',
        }}>
            <div style={{
                background: 'white', padding: '40px', borderRadius: '16px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '420px',
            }}>
                <h2 style={{ textAlign: 'center', color: '#1e293b' }}>Восстановление доступа</h2>
                <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
                    Введите email, указанный при регистрации, и мы отправим вам ссылку для смены пароля.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input
                        type="email"
                        placeholder="your@email.com"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '16px' }}
                    />

                    <button type="submit" style={{
                        padding: '14px', borderRadius: '10px', border: 'none',
                        background: '#4f46e5', color: 'white', fontWeight: 'bold', cursor: 'pointer',
                    }}>
                        Отправить ссылку
                    </button>
                </form>

                {message && (
                    <div style={{
                        marginTop: '20px',
                        textAlign: 'center',
                        color: isError ? '#ef4444' : '#10b981',
                        fontWeight: '500',
                    }}>
                        <p style={{ margin: 0 }}>{message}</p>
                    </div>
                )}

                <button
                    onClick={() => navigate('/login')}
                    style={{ marginTop: '20px', width: '100%', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                >
                    ← Вернуться к входу
                </button>
            </div>
        </div>
    );
};


export default ForgotPassword;
