import React from 'react';
import { Users, UserPlus, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AffiliationsPage = () => {
  const navigate = useNavigate();

  const handleOrganizerClick = () => {
    navigate('/dashboard/affiliations/manage');
  };

  const handleAffiliateClick = () => {
    navigate('/dashboard/affiliations/area');
  };

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300 min-h-[calc(100vh-176px)]">
      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column - É organizador? */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              É organizador?
            </h2>
            
            <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Aqui aparecem os usuários que possuem afiliação com você.
            </p>
            
            <button 
              onClick={handleOrganizerClick}
              className="bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2 mx-auto"
            >
              <span>Clique aqui!</span>
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>

          {/* Empty State for Organizer */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-600">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nenhum afiliado encontrado
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - É afiliado? */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              É afiliado?
            </h2>
            
            <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Aqui aparecem os usuários que você possui afiliação.
            </p>
            
            <button 
              onClick={handleAffiliateClick}
              className="bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2 mx-auto"
            >
              <span>Clique aqui!</span>
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>

          {/* Empty State for Affiliate */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-600">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nenhuma afiliação encontrada
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 transition-colors duration-300">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Como funcionam as afiliações?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              O sistema de afiliações permite que você trabalhe em parceria com outros usuários. 
              Como organizador, você pode ter afiliados que ajudam a promover suas rifas. 
              Como afiliado, você pode promover rifas de outros organizadores e receber comissões pelas vendas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliationsPage;