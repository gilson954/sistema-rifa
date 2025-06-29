import React from 'react';
import { ExternalLink, Users, Mail, DollarSign } from 'lucide-react';

const AffiliateAreaPage = () => {
  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300 min-h-[calc(100vh-176px)]">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Área do afiliado
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Gerencie seu link de afiliado, aceite convites e veja suas comissões.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Earnings */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700/50 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Total Ganho
            </h3>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            R$ 0,00
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Comissões acumuladas
          </p>
        </div>

        {/* Active Affiliations */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Afiliações Ativas
            </h3>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            0
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Organizadores parceiros
          </p>
        </div>

        {/* Pending Invites */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border border-orange-200 dark:border-orange-700/50 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Convites Pendentes
            </h3>
          </div>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            0
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Aguardando resposta
          </p>
        </div>
      </div>

      {/* Solicitações Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Solicitações
        </h2>

        {/* Empty State */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-6xl mb-4 text-orange-500">:(</div>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Você ainda não recebeu nenhum convite!
          </p>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700/50">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Como funciona o sistema de afiliados?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
              Como afiliado, você pode promover rifas de organizadores e receber comissões pelas vendas realizadas através do seu link único. 
              Quando um organizador te convida, você receberá uma solicitação aqui para aceitar ou recusar a parceria.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-300">Receba convites de organizadores</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-300">Promova rifas com seu link único</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-300">Ganhe comissões por cada venda</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateAreaPage;