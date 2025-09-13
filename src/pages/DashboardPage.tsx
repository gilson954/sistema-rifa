import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, PlusCircle } from 'lucide-react';
import { useCampaigns } from '../hooks/useCampaigns';
import { Campaign } from '../types';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { campaigns, isLoading, error } = useCampaigns();

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const totalPages = campaigns ? Math.ceil(campaigns.length / pageSize) : 1;

  const paginatedCampaigns = campaigns
    ? campaigns.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : [];

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (isLoading) {
    return <div className="p-6">Carregando campanhas...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Erro ao carregar campanhas.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Minhas Campanhas</h1>
        <button
          onClick={() => navigate('/campaigns/create')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          <PlusCircle size={18} />
          Nova Campanha
        </button>
      </div>

      {/* Lista de campanhas */}
      <div className="grid gap-4">
        {paginatedCampaigns.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400">
            Nenhuma campanha encontrada.
          </div>
        ) : (
          paginatedCampaigns.map((campaign: Campaign) => (
            <div
              key={campaign.id}
              className="rounded-lg p-4 border bg-white dark:bg-gray-900 shadow-sm flex justify-between items-center"
            >
              <div>
                <h2 className="text-lg font-semibold">{campaign.title}</h2>
                <p className="text-sm text-gray-500">
                  Criada em {new Date(campaign.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => navigate(`/campaigns/${campaign.id}`)}
                className="flex items-center gap-1 text-primary hover:underline"
              >
                Ver Detalhes <ArrowRight size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Mostrando{' '}
            {((currentPage - 1) * pageSize) + 1} a{' '}
            {Math.min(currentPage * pageSize, campaigns?.length || 0)} de{' '}
            {campaigns?.length || 0} campanhas
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg border bg-gray-50 dark:bg-gray-800 disabled:opacity-50"
            >
              Anterior
            </button>
            <span>{currentPage} de {totalPages}</span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-lg border bg-gray-50 dark:bg-gray-800 disabled:opacity-50"
            >
              Próximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
