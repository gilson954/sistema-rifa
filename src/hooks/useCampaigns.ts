import { useState, useEffect, useCallback } from 'react';
import { Campaign, CampaignStatus } from '../types/campaign';
import { CreateCampaignInput, UpdateCampaignInput } from '../lib/validations/campaign';
import { CampaignAPI } from '../lib/api/campaigns';
import { useAuth } from '../hooks/useAuth';

export const useCampaigns = (status?: CampaignStatus) => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
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
  }, [user, status]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const createCampaign = async (data: CreateCampaignInput) => {
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

  const updateCampaign = async (data: UpdateCampaignInput) => {
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
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      setLoading(true);
      setError(null);

      const { data, error: apiError } = await CampaignAPI.getCampaignById(id);

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

export const useCampaignByPublicId = (publicId: string) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      setLoading(true);
      setError(null);

      const { data, error: apiError } = await CampaignAPI.getCampaignByPublicId(publicId);

      if (apiError) {
        setError('Erro ao carregar campanha');
        console.error('Error fetching campaign by public_id:', apiError);
      } else {
        setCampaign(data);
      }

      setLoading(false);
    };

    if (publicId) {
      fetchCampaign();
    }
  }, [publicId]);

  return { campaign, loading, error };
};

export const useCampaignByCustomDomain = (domain: string) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      setLoading(true);
      setError(null);

      const { data, error: apiError } = await CampaignAPI.getCampaignByCustomDomain(domain);

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

    console.log('🔄 Fetching campaign data for ID:', id);

    const { data, error: apiError } = await CampaignAPI.getCampaignById(id);

    if (apiError) {
      setError('Erro ao carregar campanha');
      console.error('Error fetching campaign:', apiError);
    } else {
      setCampaign(data);
      console.log('✅ Campaign data fetched:', {
        id: data?.id,
        title: data?.title,
        status: data?.status,
        is_paid: data?.is_paid
      });
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  return { campaign, loading, error, refetch: fetchCampaign };
};
