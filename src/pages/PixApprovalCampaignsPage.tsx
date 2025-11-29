import { useEffect, useMemo, useState } from 'react';
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

  const [currentPage, setCurrentPage] = useState(1);
  const [columnsPerRow, setColumnsPerRow] = useState(1);
  const rowsPerPage = 6;
  const pageSize = rowsPerPage * columnsPerRow;
  const totalPages = Math.max(1, Math.ceil(visibleCampaigns.length / pageSize));
  const paginatedCampaigns = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return visibleCampaigns.slice(start, end);
  }, [visibleCampaigns, currentPage, pageSize]);

  useEffect(() => {
    const updateColumns = () => {
      const w = window.innerWidth;
      setColumnsPerRow(w >= 1024 ? 3 : w >= 640 ? 2 : 1);
    };
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [visibleCampaigns, columnsPerRow]);

  useEffect(() => {
    document.title = 'Aprovação de PIX - Campanhas';
  }, []);

  return (
    <div className="dashboard-page min-h-screen bg-transparent text-gray-900 dark:text-white">
      <style>
        {`
          @media (max-width: 640px) {
            ::-webkit-scrollbar {
              width: 8px;
            }
            ::-webkit-scrollbar-track {
              background: linear-gradient(to bottom, rgba(139, 92, 246, 0.05), rgba(219, 39, 119, 0.05));
              border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb {
              background: linear-gradient(to bottom, #a855f7, #ec4899, #3b82f6);
              border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(to bottom, #c084fc, #f472b6);
            }
            ::-webkit-scrollbar-thumb:active {
              background: linear-gradient(to bottom, #7c3aed, #db2777);
            }
          }
          
          @media (min-width: 641px) {
            ::-webkit-scrollbar {
              width: 12px;
            }
            ::-webkit-scrollbar-track {
              background: linear-gradient(to bottom, rgba(139, 92, 246, 0.05), rgba(219, 39, 119, 0.05));
              border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb {
              background: linear-gradient(to bottom, #a855f7, #ec4899, #3b82f6);
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
            }
            ::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(to bottom, #c084fc, #f472b6);
              box-shadow: 0 0 15px rgba(192, 132, 252, 0.6);
            }
          }
        `}
      </style>
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
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {paginatedCampaigns.map((c) => (
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
              <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`pagination-button ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Ant.
                </motion.button>
                <div className="flex items-center gap-1 flex-wrap justify-center">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <motion.button
                      key={page}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-md sm:rounded-lg font-bold text-xs sm:text-sm transition-all duration-300 ${currentPage === page ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-110' : 'bg-white/20 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                      {page}
                    </motion.button>
                  ))}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`pagination-button ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Próx.
                </motion.button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default PixApprovalCampaignsPage;
