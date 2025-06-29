import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { X, RefreshCw, Database, User, Key } from 'lucide-react';

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ isOpen, onClose }) => {
  const { user, profile, session, isAuthenticated, isAuthLoading, isInitialAuthCheckDone } = useAuth();
  const [envVars, setEnvVars] = useState<any>({});
  const [dbTest, setDbTest] = useState<any>(null);
  const [authTest, setAuthTest] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      // Verificar variáveis de ambiente
      setEnvVars({
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
      });

      // Testar conexão com banco
      testDatabase();
      testAuth();
    }
  }, [isOpen]);

  const testDatabase = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      setDbTest({
        success: !error,
        error: error?.message,
        data: data
      });
    } catch (err) {
      setDbTest({
        success: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido',
        data: null
      });
    }
  };

  const testAuth = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      setAuthTest({
        success: !error,
        error: error?.message,
        session: data.session,
        user: data.session?.user
      });
    } catch (err) {
      setAuthTest({
        success: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido',
        session: null,
        user: null
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">🔧 Debug Panel</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Variáveis de Ambiente */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Key className="text-blue-600 mr-2" size={20} />
              <h3 className="font-semibold text-gray-900 dark:text-white">Variáveis de Ambiente</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">VITE_SUPABASE_URL:</span>
                <span className={envVars.VITE_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}>
                  {envVars.VITE_SUPABASE_URL ? '✅ Definida' : '❌ Não definida'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">VITE_SUPABASE_ANON_KEY:</span>
                <span className={envVars.VITE_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-600'}>
                  {envVars.VITE_SUPABASE_ANON_KEY ? '✅ Definida' : '❌ Não definida'}
                </span>
              </div>
              {envVars.VITE_SUPABASE_URL && (
                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                  <strong>URL:</strong> {envVars.VITE_SUPABASE_URL}
                </div>
              )}
            </div>
          </div>

          {/* Teste de Banco */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Database className="text-purple-600 mr-2" size={20} />
                <h3 className="font-semibold text-gray-900 dark:text-white">Conexão com Banco</h3>
              </div>
              <button
                onClick={testDatabase}
                className="text-blue-600 hover:text-blue-700 flex items-center text-sm"
              >
                <RefreshCw size={16} className="mr-1" />
                Testar
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Status:</span>
                <span className={dbTest?.success ? 'text-green-600' : 'text-red-600'}>
                  {dbTest?.success ? '✅ Conectado' : '❌ Erro'}
                </span>
              </div>
              {dbTest?.error && (
                <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs text-red-600 dark:text-red-400">
                  <strong>Erro:</strong> {dbTest.error}
                </div>
              )}
            </div>
          </div>

          {/* Teste de Auth */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <User className="text-green-600 mr-2" size={20} />
                <h3 className="font-semibold text-gray-900 dark:text-white">Sistema de Autenticação</h3>
              </div>
              <button
                onClick={testAuth}
                className="text-blue-600 hover:text-blue-700 flex items-center text-sm"
              >
                <RefreshCw size={16} className="mr-1" />
                Testar
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Auth Status:</span>
                <span className={authTest?.success ? 'text-green-600' : 'text-red-600'}>
                  {authTest?.success ? '✅ Funcionando' : '❌ Erro'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Sessão Ativa:</span>
                <span className={authTest?.session ? 'text-green-600' : 'text-gray-500'}>
                  {authTest?.session ? '✅ Sim' : '❌ Não'}
                </span>
              </div>
              {authTest?.error && (
                <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs text-red-600 dark:text-red-400">
                  <strong>Erro:</strong> {authTest.error}
                </div>
              )}
            </div>
          </div>

          {/* Estado do AuthContext */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Estado do AuthContext</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600 dark:text-gray-300">isAuthenticated:</span>
                  <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                    {isAuthenticated ? '✅' : '❌'}
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600 dark:text-gray-300">isAuthLoading:</span>
                  <span className={isAuthLoading ? 'text-yellow-600' : 'text-gray-500'}>
                    {isAuthLoading ? '⏳' : '✅'}
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600 dark:text-gray-300">isInitialAuthCheckDone:</span>
                  <span className={isInitialAuthCheckDone ? 'text-green-600' : 'text-yellow-600'}>
                    {isInitialAuthCheckDone ? '✅' : '⏳'}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600 dark:text-gray-300">User:</span>
                  <span className={user ? 'text-green-600' : 'text-gray-500'}>
                    {user ? '✅' : '❌'}
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600 dark:text-gray-300">Profile:</span>
                  <span className={profile ? 'text-green-600' : 'text-gray-500'}>
                    {profile ? '✅' : '❌'}
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600 dark:text-gray-300">Session:</span>
                  <span className={session ? 'text-green-600' : 'text-gray-500'}>
                    {session ? '✅' : '❌'}
                  </span>
                </div>
              </div>
            </div>
            
            {user && (
              <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                <strong>User ID:</strong> {user.id}<br />
                <strong>Email:</strong> {user.email}
              </div>
            )}
            
            {profile && (
              <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                <strong>Profile ID:</strong> {profile.id}<br />
                <strong>Name:</strong> {profile.name}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;