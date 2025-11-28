import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCampaigns } from '../hooks/useCampaigns';
import { QrCode, ArrowRight, Ticket, Calendar } from 'lucide-react';

const PixApprovalCampaignsPage = () => {
  const navigate = useNavigate();
  const { campaigns, loading } = useCampaigns();

  const visibleCampaigns = useMemo(() => {
    return (campaigns || []).filter(c => c.status === 'active' || c.status === 'completed' || c.status === 'draft');
  }, [campaigns]);

  useEffect(() => {
    document.title = 'Aprovação de PIX - Campanhas';
  }, []);

  return (
    <div className="min-h-screen text-gray-900 dark:text-white">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <QrCode className="h-5 w-5" />
          <h1 className="text-xl sm:text-2xl font-bold">Aprovação de PIX manual</h1>
        </div>

        <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-200/20 dark:border-gray-700/30 p-4">
          {loading ? (
            <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          ) : visibleCampaigns.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">Nenhuma campanha disponível.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {visibleCampaigns.map((c) => (
                  <motion.button
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/dashboard/pix-approval/${c.id}`)}
                    className="w-full text-left bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200/30 dark:border-gray-700/30 p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        {c.prize_image_urls && c.prize_image_urls.length > 0 ? (
                          <img src={c.prize_image_urls[0]} alt="Prêmio" className="h-full w-full object-cover" />
                        ) : (
                          <Ticket className="h-6 w-6 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{c.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          {c.total_tickets} cotas • R$ {Number(c.ticket_price || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-500" />
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PixApprovalCampaignsPage;
