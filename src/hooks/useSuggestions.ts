import { useState, useEffect, useCallback } from 'react';
import { SuggestionsAPI, Suggestion, CreateSuggestionInput } from '../lib/api/suggestions';
import { useAuth } from '../hooks/useAuth';

export const useSuggestions = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserSuggestions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: apiError } = await SuggestionsAPI.getUserSuggestions(user.id);

    if (apiError) {
      setError('Erro ao carregar suas sugestões');
      console.error('Error fetching user suggestions:', apiError);
    } else {
      setSuggestions(data || []);
    }

    setLoading(false);
  }, [user]);

  const createSuggestion = async (data: CreateSuggestionInput) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data: suggestion, error: apiError } = await SuggestionsAPI.createSuggestion(data, user.id);

    if (apiError) {
      throw apiError;
    }

    if (suggestion) {
      setSuggestions(prev => [suggestion, ...prev]);
    }

    return suggestion;
  };

  useEffect(() => {
    fetchUserSuggestions();
  }, [fetchUserSuggestions]);

  return {
    suggestions,
    loading,
    error,
    createSuggestion,
    refetch: fetchUserSuggestions
  };
};

export const useAdminSuggestions = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllSuggestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: apiError } = await SuggestionsAPI.getAllSuggestions();

    if (apiError) {
      setError('Erro ao carregar sugestões');
      console.error('Error fetching all suggestions:', apiError);
    } else {
      setSuggestions(data || []);
    }

    setLoading(false);
  }, []);

  const updateSuggestionStatus = async (
    id: string,
    status: 'new' | 'in_progress' | 'resolved' | 'rejected'
  ) => {
    const { data: suggestion, error: apiError } = await SuggestionsAPI.updateSuggestionStatus({
      id,
      status
    });

    if (apiError) {
      throw apiError;
    }

    if (suggestion) {
      setSuggestions(prev => prev.map(s => s.id === id ? suggestion : s));
    }

    return suggestion;
  };

  const deleteSuggestion = async (id: string) => {
    const { error: apiError } = await SuggestionsAPI.deleteSuggestion(id);

    if (apiError) {
      throw apiError;
    }

    setSuggestions(prev => prev.filter(s => s.id !== id));
  };

  useEffect(() => {
    fetchAllSuggestions();
  }, [fetchAllSuggestions]);

  return {
    suggestions,
    loading,
    error,
    updateSuggestionStatus,
    deleteSuggestion,
    refetch: fetchAllSuggestions
  };
};
