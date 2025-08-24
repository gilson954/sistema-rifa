import { useState, useEffect, useCallback } from 'react';
import { Campaign, CampaignStatus } from '../types/campaign';
import { CampaignAPI } from '../lib/api/campaigns';
import { useAuth } from '../context/AuthContext';

export const useCampaigns = (status?: CampaignStatus) => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: apiError } = await CampaignAPI.getUserCampaigns(user.id, status);

    if (apiError) {
      setError('Erro ao carregar campanhas');
      console.error('Error fetching campaigns:', apiError);
    } else {
      setCampaigns(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchCampaigns();
  }, [user, status]);

  const createCampaign = async (data: any) => {
    if (!user) throw new Error('Usuário não autenticado');

    setLoading(true);
    const { data: campaign, error: apiError } = await CampaignAPI.createCampaign(data, user.id);

    if (apiError) {
      setError('Erro ao criar campanha');
      throw apiError;
    }

    if (campaign) {
      setCampaigns(prev => [campaign, ...prev]);
    }

    setLoading(false);
    return campaign;
  };

  const updateCampaign = async (data: any) => {
    setLoading(true);
    const { data: campaign, error: apiError } = await CampaignAPI.updateCampaign(data);

    if (apiError) {
      setError('Erro ao atualizar campanha');
      throw apiError;
    }

    if (campaign) {
      setCampaigns(prev => prev.map(c => c.id === campaign.id ? campaign : c));
    }

    setLoading(false);
    return campaign;
  };

  const deleteCampaign = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    setLoading(true);
    const { error: apiError } = await CampaignAPI.deleteCampaign(id, user.id);

    if (apiError) {
      setError('Erro ao deletar campanha');
      throw apiError;
    }

    setCampaigns(prev => prev.filter(c => c.id !== id));
    setLoading(false);
  };

  const publishCampaign = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    setLoading(true);
    const { data: campaign, error: apiError } = await CampaignAPI.publishCampaign(id, user.id);

    if (apiError) {
      setError('Erro ao publicar campanha');
      throw apiError;
    }

    if (campaign) {
      setCampaigns(prev => prev.map(c => c.id === campaign.id ? campaign : c));
    }

    setLoading(false);
    return campaign;
  };

  return {
    campaigns,
    loading,
    error,
    fetchCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    publishCampaign
  };
};

export const useCampaign = (id: string) => {
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      setLoading(true);
      setError(null);

      const { data, error: apiError } = await CampaignAPI.getCampaignById(id, user?.id);

      if (apiError) {
        setError('Erro ao carregar campanha');
        console.error('Error fetching campaign:', apiError);
      } else {
        setCampaign(data);
      }

      setLoading(false);
    };

    if (id) {
      fetchCampaign();
    }
  }, [id]);

  return { campaign, loading, error };
};

export const useCampaignBySlug = (slug: string) => {
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      setLoading(true);
      setError(null);

      const { data, error: apiError } = await CampaignAPI.getCampaignBySlug(slug, user?.id);

      if (apiError) {
        setError('Erro ao carregar campanha');
        console.error('Error fetching campaign by slug:', apiError);
      } else {
        setCampaign(data);
      }

      setLoading(false);
    };

    if (slug) {
      fetchCampaign();
    }
  }, [slug]);

  return { campaign, loading, error };
};

export const useCampaignByCustomDomain = (domain: string) => {
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      setLoading(true);
      setError(null);

      const { data, error: apiError } = await CampaignAPI.getCampaignByCustomDomain(domain, user?.id);

      if (apiError) {
        setError('Erro ao carregar campanha por domínio personalizado');
        console.error('Error fetching campaign by custom domain:', apiError);
      } else {
        setCampaign(data);
      }

      setLoading(false);
    };

    if (domain) {
      fetchCampaign();
    }
  }, [domain]);

  return { campaign, loading, error };
};
export const useCampaignWithRefetch = (id: string) => {
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaign = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: apiError } = await CampaignAPI.getCampaignById(id, user?.id);

    if (apiError) {
      setError('Erro ao carregar campanha');
      console.error('Error fetching campaign:', apiError);
    } else {
      setCampaign(data);
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  return { campaign, loading, error, refetch: fetchCampaign };
};