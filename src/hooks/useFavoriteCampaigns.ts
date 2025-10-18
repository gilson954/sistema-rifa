import { useState, useEffect, useCallback } from 'react';
import { FavoritesAPI } from '../lib/api/favorites';
import { Campaign } from '../types/campaign';
import { useAuth } from '../context/AuthContext';

export const useFavoriteCampaigns = () => {
  const { isPhoneAuthenticated, phoneUser } = useAuth();
  const [favorites, setFavorites] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customerPhone = phoneUser?.phone;

  // Carregar favoritos quando o usuário estiver autenticado
  const loadFavorites = useCallback(async () => {
    if (!isPhoneAuthenticated || !customerPhone) {
      setFavorites([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: apiError } = await FavoritesAPI.getFavorites(customerPhone);

      if (apiError) {
        setError('Erro ao carregar campanhas favoritas');
        console.error('Error loading favorites:', apiError);
      } else {
        setFavorites(data || []);
      }
    } catch (err) {
      console.error('Exception loading favorites:', err);
      setError('Erro inesperado ao carregar favoritas');
    } finally {
      setLoading(false);
    }
  }, [isPhoneAuthenticated, customerPhone]);

  // Verificar se uma campanha é favorita
  const isFavorite = useCallback((campaignId: string): boolean => {
    return favorites.some(fav => fav.id === campaignId);
  }, [favorites]);

  // Adicionar aos favoritos
  const addFavorite = useCallback(async (campaignId: string) => {
    if (!customerPhone) {
      throw new Error('Usuário não autenticado');
    }

    const { error: apiError } = await FavoritesAPI.addFavorite(customerPhone, campaignId);

    if (apiError) {
      throw new Error('Erro ao adicionar favorito');
    }

    // Recarregar lista
    await loadFavorites();
  }, [customerPhone, loadFavorites]);

  // Remover dos favoritos
  const removeFavorite = useCallback(async (campaignId: string) => {
    if (!customerPhone) {
      throw new Error('Usuário não autenticado');
    }

    const { error: apiError } = await FavoritesAPI.removeFavorite(customerPhone, campaignId);

    if (apiError) {
      throw new Error('Erro ao remover favorito');
    }

    // Recarregar lista
    await loadFavorites();
  }, [customerPhone, loadFavorites]);

  // Toggle favorito
  const toggleFavorite = useCallback(async (campaignId: string) => {
    if (!customerPhone) {
      throw new Error('Usuário não autenticado');
    }

    const { error: apiError } = await FavoritesAPI.toggleFavorite(customerPhone, campaignId);

    if (apiError) {
      throw new Error('Erro ao atualizar favorito');
    }

    // Recarregar lista
    await loadFavorites();
  }, [customerPhone, loadFavorites]);

  // Carregar favoritos ao montar ou quando o usuário mudar
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return {
    favorites,
    loading,
    error,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    reloadFavorites: loadFavorites
  };
};
