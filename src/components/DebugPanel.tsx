import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { X, RefreshCw, Database, User, Key, AlertTriangle, CheckCircle } from 'lucide-react';

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ isOpen, onClose }) => {
  const { user, profile, session, isAuthenticated, isAuthLoading, isInitialAuthCheckDone, login } = useAuth();
  const [envVars, setEnvVars] = useState<any>({});
  const [dbTest, setDbTest] = useState<any>(null);
  const [authTest, setAuthTest] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('123456');

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
    console.log('🧪 DebugPanel: Iniciando teste de banco...');
    try {
      // Teste mais detalhado
      const { data, error, status, statusText } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      console.log('🧪 DebugPanel: Resultado do teste de banco:', {
        data,
        error,
        status,
        statusText
      });

      setDbTest({
        success: !error,
        error: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details,
        errorHint: error?.hint,
        status,
        statusText,
        data: data
      });
    } catch (err) {
      console.error('🧪 DebugPanel: Erro no teste de banco:', err);
      setDbTest({
        success: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido',
        data: null
      });
    }
  };

  const testAuth = async () => {
    console.log('🧪 DebugPanel: Iniciando teste de auth...');
    try {
      const { data, error } = await supabase.auth.getSession();
      
      console.log('🧪 DebugPanel: Resultado do teste de auth:', {
        data,
        error
      });

      setAuthTest({
        success: !error,
        error: error?.message,
        session: data.session,
        user: data.session?.user
      });
    } catch (err) {
      console.error('🧪 DebugPanel: Erro no teste de auth:', err);
      setAuthTest({
        success: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido',
        session: null,
        user: null
      });
    }
  };

  const testLogin = async () => {
    if (!testEmail || !testPassword) return;
    
    setTestLoading(true);
    console.log('🧪 DebugPanel: Testando login com:', testEmail);
    
    try {
      const result = await login(testEmail, testPassword);
      console.log('🧪 DebugPanel: Resultado do teste de login:', result);
      
      if (result.success) {
        alert('✅ Login de teste bem-sucedido!');
      } else {
        alert(`❌ Erro no login de teste: ${result.error}`);
      }
    } catch (error) {
      console.error('🧪 DebugPanel: Erro no teste de login:', error);
      alert(`💥 Erro inesperado no teste de login: ${error}`);
    } finally {
      setTestLoading(false);
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
              {dbTest?.status && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">HTTP Status:</span>
                  <span className="text-gray-900 dark:text-white">{dbTest.status}</span>
                </div>
              )}
              {dbTest?.error && (
                <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs text-red-600 dark:text-red-400">
                  <strong>Erro:</strong> {dbTest.error}<br />
                  {dbTest.errorCode && <><strong>Código:</strong> {dbTest.errorCode}<br /></>}
                  {dbTest.errorDetails && <><strong>Detalhes:</strong> {dbTest.errorDetails}<br /></>}
                  {dbTest.errorHint && <><strong>Dica:</strong> {dbTest.errorHint}</>}
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

          {/* Teste de Login */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <AlertTriangle className="text-orange-600 mr-2" size={20} />
              <h3 className="font-semibold text-gray-900 dark:text-white">Teste de Login</h3>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Email de teste"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  placeholder="Senha de teste"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <button
                onClick={testLogin}
                disabled={testLoading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
              >
                {testLoading ? 'Testando...' : 'Testar Login'}
              </button>
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

          {/* Diagnóstico e Soluções */}
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <CheckCircle className="text-blue-600 mr-2" size={20} />
              <h3 className="font-semibold text-gray-900 dark:text-white">Diagnóstico</h3>
            </div>
            <div className="text-sm space-y-2">
              {!dbTest?.success && (
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="text-red-500 mt-0.5" size={16} />
                  <div>
                    <strong className="text-red-600">Problema de Conexão com Banco:</strong>
                    <p className="text-gray-600 dark:text-gray-300">
                      Verifique se o projeto Supabase está ativo e as credenciais estão corretas.
                    </p>
                  </div>
                </div>
              )}
              
              {!authTest?.success && (
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="text-red-500 mt-0.5" size={16} />
                  <div>
                    <strong className="text-red-600">Problema de Autenticação:</strong>
                    <p className="text-gray-600 dark:text-gray-300">
                      O sistema de autenticação não está respondendo corretamente.
                    </p>
                  </div>
                </div>
              )}
              
              {dbTest?.success && authTest?.success && (
                <div className="flex items-start space-x-2">
                  <CheckCircle className="text-green-500 mt-0.5" size={16} />
                  <div>
                    <strong className="text-green-600">Sistema Funcionando:</strong>
                    <p className="text-gray-600 dark:text-gray-300">
                      Todas as conexões estão funcionando corretamente.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;