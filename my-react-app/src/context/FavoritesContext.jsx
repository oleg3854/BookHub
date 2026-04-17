import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import api, { clearStoredAuth } from '../api';


const FavoritesContext = createContext();


export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);

  const fetchFavorites = useCallback(async () => {
    const token = localStorage.getItem('access');

    if (!token) {
      setFavorites([]);
      return;
    }

    try {
      const response = await api.get('favorites/');
      setFavorites(response.data.map((item) => item.book));
    } catch (error) {
      console.error('Ошибка загрузки избранного с сервера:', error);
      if (error.response?.status === 401) {
        clearStoredAuth();
      }
      setFavorites([]);
    }
  }, []);

  const clearFavorites = () => {
    setFavorites([]);
  };

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const toggleFavorite = async (book) => {
    const token = localStorage.getItem('access');
    if (!token) {
      alert('Войдите в аккаунт, чтобы сохранять книги.');
      return;
    }

    try {
      await api.post(`books/${book.id}/toggle_favorite/`);

      setFavorites((prev) => {
        const exists = prev.some((favoriteBook) => favoriteBook.id === book.id);
        return exists
          ? prev.filter((favoriteBook) => favoriteBook.id !== book.id)
          : [book, ...prev];
      });
    } catch (error) {
      console.error('Ошибка синхронизации избранного:', error);
      alert('Не удалось обновить избранное.');
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, fetchFavorites, clearFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
};


export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
