import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Calendar, Users, ChevronLeft, ChevronRight, Ticket } from 'lucide-react';
import { CampaignAPI } from '../lib/api/campaigns';
import { Campaign } from '../types/campaign';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/currency';
import CampaignFooter from '../components/CampaignFooter';
import PhoneLoginModal from '../components/PhoneLoginModal';
import { useAuth } from '../context/AuthContext';

interface OrganizerProfile {
  id: string;
  name: string;
  avatar_url?: string;
  logo_url?: string;
  primary_color?: string;
  theme?: string;
  color_mode?: string;
  gradient_classes?: string;
  custom_gradient_colors?: string;
}

const OrganizerHomePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user, isPhoneAuthenticated } = useAuth();
  const [featuredCampaign, setFeaturedCampaign] = useState<Campaign | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [organizerProfile, setOrganizerProfile] = useState<OrganizerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const campaignsPerPage = 6;

  useEffect(() => {
    const loadOrganizerData = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        const { data: profile } = await supabase
          .from('public_profiles_view')
          .select('id, name, avatar_url, logo_url, primary_color, theme, color_mode, gradient_classes, custom_gradient_colors')
          .eq('id', userId)
          .maybeSingle();

        if (profile) {
          setOrganizerProfile(profile);
        }

        const { data: featured } = await CampaignAPI.getFeaturedCampaign(userId);
        setFeaturedCampaign(featured);

        const { data: allCampaigns } = await CampaignAPI.getOrganizerPublicCampaigns(userId, false);

        if (allCampaigns && featured) {
          const filteredCampaigns = allCampaigns.filter(c => c.id !== featured.id);
          setCampaigns(filteredCampaigns);
        } else {
          setCampaigns(allCampaigns || []);
        }
      } catch (error) {
        console.error('Error loading organizer data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrganizerData();
  }, [userId]);

  const handleCampaignClick = (publicId: string | null) => {
    if (publicId) navigate(`/c/${publicId}`);
  };

  const handleMyTicketsClick = () => {
    if (isPhoneAuthenticated) navigate('/my-tickets');
    else setIsPhoneModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const organizerTheme = organizerProfile?.theme || 'claro';

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="shadow-sm border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-20 items-center">
          <div className="flex-1" />
          <div className="flex-1 flex justify-center">
            {organizerProfile?.logo_url && (
              <img src={organizerProfile.logo_url} alt="Logo" className="h-14 w-auto object-contain" />
            )}
          </div>
          <div className="flex-1 flex justify-end">
            <button
              onClick={handleMyTicketsClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-md transition"
            >
              <Ticket className="inline-block mr-2 h-4 w-4" />
              Minhas Cotas
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {featuredCampaign && (
          <section className="mb-12">
            <div className="relative h-[400px] sm:h-[500px] rounded-2xl overflow-hidden shadow-lg">
              <img
                src={featuredCampaign.prize_image_urls?.[0] || ''}
                alt={featuredCampaign.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                <h2 className="text-white text-3xl font-bold mb-4">{featuredCampaign.title}</h2>
                <motion.button
                  className="w-[180px] bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-2 rounded-lg font-semibold shadow-md"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  Adquira Já!
                </motion.button>
              </div>
            </div>
          </section>
        )}

        {campaigns.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Mais Campanhas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md overflow-hidden cursor-pointer"
                  onClick={() => handleCampaignClick(c.public_id)}
                >
                  <img
                    src={c.prize_image_urls?.[0] || ''}
                    alt={c.title}
                    className="h-48 w-full object-cover"
                  />
                  <div className="p-4 text-center">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 truncate">{c.title}</h3>
                    <p className="text-gray-500 mb-4">{formatCurrency(c.ticket_price)}</p>
                    <motion.button
                      className="w-[160px] mx-auto bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-2 rounded-lg font-semibold shadow-md"
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      Adquira Já!
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </main>

      <CampaignFooter campaignTheme={organizerTheme} />
    </div>
  );
};

export default OrganizerHomePage;