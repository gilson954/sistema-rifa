import React from 'react';

const CampaignPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Página da Campanha
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Conteúdo da campanha será carregado aqui.
        </p>
      </div>
    </div>
  );
};

export default CampaignPage;