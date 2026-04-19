import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { extractErrorMessage, publicApi } from '../api';


const ResetPasswordConfirm = () => {
    const { uidb64, token } = useParams();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState('');
    const [isError, setIsError] = useState(false);

    const handleReset = async (event) => {
        event.preventDefault();

        if (newPassword !== confirmPassword) {
            setStatus('Пароли не совпадают.');
            setIsError(true);
            return;
        }

        try {
            await publicApi.post(`password-reset-confirm/${uidb64}/${token}/`, {
                password: newPassword,
            });
            setStatus('Пароль успешно изменен! Теперь можно войти.');
            setIsError(false);
            setTimeout(() => navigate('/login'), 1800);
        } catch (err) {
            setStatus(extractErrorMessage(err, 'Ошибка. Ссылка устарела или неверна.'));
            setIsError(true);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 70px)', background: '#f8fafc', padding: '20px' }}>
            <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '350px' }}>
                <h2 style={{ textAlign: 'center' }}>Новый пароль</h2>
                <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input
                        type="password"
                        placeholder="Введите новый пароль"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Повторите пароль"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                        required
                    />
                    <button type="submit" style={{ padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
                        Обновить пароль
                    </button>
                </form>
                {status && (
                    <p style={{ marginTop: '20px', textAlign: 'center', color: isError ? '#dc2626' : '#4f46e5' }}>
                        {status}
                    </p>
                )}
            </div>
        </div>
    );
};


export default ResetPasswordConfirm;
