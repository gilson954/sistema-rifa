import React from 'react';
import { Trash2, Clock, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useCampaignCleanup } from '../hooks/useCampaignCleanup';

interface CampaignCleanupStatusProps {
  className?: string;
}

const CampaignCleanupStatus: React.FC<CampaignCleanupStatusProps> = ({ className = '' }) => {
  const { 
    isRunning, 
    lastCleanup, 
    cleanupLogs, 
    error, 
    runCleanup 
  } = useCampaignCleanup();

  const handleManualCleanup = async () => {
    const result = await runCleanup();
    if (result) {
      console.log('Manual cleanup completed:', result);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const recentCleanupLogs = cleanupLogs
    .filter(log => ['cleanup_complete', 'cleanup_start', 'campaign_deleted'].includes(log.operation_type))
    .slice(0, 5);

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Trash2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Limpeza Automática
          </h3>
        </div>
        
        <button
          onClick={handleManualCleanup}
          disabled={isRunning}
          className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg text-sm font-medium transition-colors duration-200"
        >
          <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Executando...' : 'Executar Agora'}</span>
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Última Limpeza
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {lastCleanup ? formatDate(lastCleanup.toISOString()) : 'Nunca executada'}
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Status do Sistema
          </div>
          <div className="flex items-center space-x-2">
            {error ? (
              <>
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-red-600 dark:text-red-400 font-medium">Erro</span>
              </>
            ) : isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                <span className="text-blue-600 dark:text-blue-400 font-medium">Executando</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400 font-medium">Ativo</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-red-700 dark:text-red-300 text-sm font-medium">
              Erro na Limpeza
            </span>
          </div>
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Recent Activity */}
      {recentCleanupLogs.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Atividade Recente
          </h4>
          <div className="space-y-2">
            {recentCleanupLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                {getStatusIcon(log.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white truncate">
                    {log.message || log.operation_type}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(log.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Sistema Automático:</strong> Campanhas expiradas há mais de 2 dias são automaticamente removidas do sistema a cada 30 minutos.
        </p>
      </div>
    </div>
  );
};

export default CampaignCleanupStatus;