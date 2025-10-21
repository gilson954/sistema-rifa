import React from 'react';
import { useNavigate } from 'react-router-dom';

interface CampaignFooterProps {
  campaignTheme?: string;
}

const CampaignFooter: React.FC<CampaignFooterProps> = ({ campaignTheme = 'claro' }) => {
  const navigate = useNavigate();
  
  // Footer branco no tema claro, escuro nos temas escuros
  const bgClass = campaignTheme === 'claro' ? 'bg-white' : 'bg-gray-900';
  const borderClass = campaignTheme === 'claro' ? 'border-gray-200' : 'border-gray-800';
  const textClass = campaignTheme === 'claro' ? 'text-gray-900' : 'text-white';
  
  return (
    <footer className={`${bgClass} border-t ${borderClass} py-6 mt-auto`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center space-x-2">
          <span className={`text-sm ${textClass}`}>Sistema desenvolvido por</span>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center hover:opacity-80 transition-opacity duration-200"
          >
            <img
              src="/logo-chatgpt.png"
              alt="Rifaqui"
              className="h-6 w-6 object-contain"
            />
            <span className={`ml-2 text-sm font-bold ${textClass}`}>Rifaqui</span>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default CampaignFooter;