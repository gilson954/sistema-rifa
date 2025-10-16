import { useState, useEffect } from 'react';
import { SorteioAPI, Winner } from '../lib/api/sorteio';

export const useCampaignWinners = (campaignId: string | undefined) => {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) {
      setWinners([]);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchWinners = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await SorteioAPI.getWinners(campaignId);

        if (fetchError) {
          console.error('Error fetching winners:', fetchError);
          setError('Erro ao carregar ganhadores');
          setWinners([]);
        } else {
          setWinners(data || []);
        }
      } catch (err) {
        console.error('Exception fetching winners:', err);
        setError('Erro ao carregar ganhadores');
        setWinners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWinners();
  }, [campaignId]);

  return { winners, loading, error };
};
