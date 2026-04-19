import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: 'calc(100vh - 70px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            fontFamily: '"Inter", sans-serif',
            overflow: 'hidden',
            padding: '20px'
        }}>
            <div style={{
                textAlign: 'center',
                animation: 'fadeInUp 1s ease-out',
                maxWidth: '800px'
            }}>
                <h1 style={{
                    fontSize: 'clamp(2.5rem, 9vw, 4rem)',
                    fontWeight: '800',
                    color: '#1e293b',
                    marginBottom: '20px',
                    letterSpacing: '-2px',
                    lineHeight: '1.1'
                }}>
                    Твоя идеальная библиотека <br/>
                    <span style={{ color: '#4f46e5' }}>в одном месте.</span>
                </h1>
                
                <p style={{
                    fontSize: 'clamp(1rem, 3vw, 1.2rem)',
                    color: '#64748b',
                    marginBottom: '40px',
                    lineHeight: '1.6'
                }}>
                    Читайте любимые книги с комфортом. Настраивайте шрифты, 
                    выбирайте темы и сохраняйте прогресс там, где остановились.
                </p>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button 
                        onClick={() => navigate('/catalog')}
                        style={{
                            padding: '16px 32px',
                            fontSize: '18px',
                            fontWeight: '700',
                            backgroundColor: '#4f46e5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.4)',
                            transition: 'transform 0.2s, background 0.2s',
                            width: 'min(100%, 240px)'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        Открыть каталог
                    </button>
                    
                    <button 
                        onClick={() => navigate('/register')}
                        style={{
                            padding: '16px 32px',
                            fontSize: '18px',
                            fontWeight: '700',
                            backgroundColor: 'white',
                            color: '#1e293b',
                            border: '2px solid #e2e8f0',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            width: 'min(100%, 240px)'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = '#4f46e5';
                            e.currentTarget.style.color = '#4f46e5';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.color = '#1e293b';
                        }}
                    >
                        Присоединиться
                    </button>
                </div>
            </div>

            <div style={{
                position: 'absolute',
                width: 'min(60vw, 400px)',
                height: 'min(60vw, 400px)',
                background: 'rgba(79, 70, 229, 0.1)',
                borderRadius: '50%',
                filter: 'blur(80px)',
                top: '20%',
                right: '-100px',
                zIndex: -1
            }} />

            <style>
                {`
                    @keyframes fadeInUp {
                        from {
                            opacity: 0;
                            transform: translateY(30px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                `}
            </style>
        </div>
    );
};

export default HomePage;
