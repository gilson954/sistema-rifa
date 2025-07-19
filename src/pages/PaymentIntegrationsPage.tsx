import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PaymentIntegrationsPage = () => {
  const navigate = useNavigate();
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('cpf');
  const [isPaymentConfigured, setIsPaymentConfigured] = useState(false);

  // Check if payment is configured on component mount
  useEffect(() => {
    const configured = localStorage.getItem('isPaymentConfigured');
    if (configured) {
      try {
        setIsPaymentConfigured(JSON.parse(configured));
      } catch (error) {
        console.error('Error parsing payment configuration status:', error);
      }
    }
  }, []);

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const handlePixConfiguration = () => {
    setIsPixModalOpen(true);
  };

  const handleSavePixConfiguration = () => {
    if (pixKey.trim()) {
      // Save PIX configuration
      console.log('PIX Key:', pixKey, 'Type:', pixKeyType);
      
      // Mark payment as configured
      setIsPaymentConfigured(true);
      localStorage.setItem('isPaymentConfigured', 'true');
      
      setIsPixModalOpen(false);
      setPixKey('');
      setPixKeyType('cpf');
    }
  };

  const handleClosePixModal = () => {
    setIsPixModalOpen(false);
    setPixKey('');
    setPixKeyType('cpf');
  };

  const formatPixKey = (value: string, type: string) => {
    // Remove all non-numeric characters for CPF/CNPJ
    if (type === 'cpf' || type === 'cnpj') {
      const numbers = value.replace(/\D/g, '');
      
      if (type === 'cpf') {
        // Format CPF: 000.000.000-00
        return numbers
          .slice(0, 11)
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d{1,2})/, '$1-$2');
      } else {
        // Format CNPJ: 00.000.000/0000-00
        return numbers
          .slice(0, 14)
          .replace(/(\d{2})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1/$2')
          .replace(/(\d{4})(\d{1,2})/, '$1-$2');
      }
    }
    
    // For email and phone, return as is
    return value;
  };

  const handlePixKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatPixKey(value, pixKeyType);
    setPixKey(formattedValue);
  };

  const getPixKeyPlaceholder = (type: string) => {
    switch (type) {
      case 'cpf':
        return '000.000.000-00';
      case 'cnpj':
        return '00.000.000/0000-00';
      case 'email':
        return 'seu@email.com';
      case 'phone':
        return '(11) 99999-9999';
      case 'random':
        return 'Chave aleatória';
      default:
        return '';
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300">
        {/* Header */}
        <div className="flex items-center space-x-4 p-6 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={handleGoBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
          <h1 className="text-xl font-medium text-gray-900 dark:text-white">
            Métodos de pagamentos
          </h1>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* PIX Manual Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              PIX manual
            </h2>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200">
              <div className="flex items-center space-x-4 min-w-0 flex-1">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">₽</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-base font-medium text-gray-900 dark:text-white">PIX</span>
                    {isPaymentConfigured && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        <Check className="w-3 h-3 mr-1" />
                        Configurado
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate px-1">
                    Receba pagamentos via PIX de forma manual
                  </p>
                </div>
              </div>
              <button 
                onClick={handlePixConfiguration}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                {isPaymentConfigured ? 'Editar' : 'Configurar'}
              </button>
            </div>
          </div>

          {/* Baixa automática Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Baixa automática
            </h2>
            
            <div className="space-y-4">
              {/* Fluxsis */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200">
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">FX</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate px-1">Fluxsis</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate px-1">
                      Gateway de pagamento completo
                    </p>
                  </div>
                </div>
                <button className="w-full sm:w-auto bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
                  Configurar
                </button>
              </div>

              {/* Pay2m */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200">
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">P2</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate px-1">Pay2m</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate px-1">
                      Soluções de pagamento digital
                    </p>
                  </div>
                </div>
                <button className="w-full sm:w-auto bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
                  Configurar
                </button>
              </div>

              {/* Paggue */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200">
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">PG</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate px-1">Paggue</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate px-1">
                      Plataforma de pagamentos online
                    </p>
                  </div>
                </div>
                <button className="w-full sm:w-auto bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
                  Configurar
                </button>
              </div>

              {/* Mercado Pago */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200">
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">MP</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate px-1">Mercado Pago</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate px-1">
                      Solução completa de pagamentos
                    </p>
                  </div>
                </div>
                <button className="w-full sm:w-auto bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
                  Configurar
                </button>
              </div>

              {/* Efí Bank */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200">
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">EF</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate px-1">Efí Bank</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate px-1">
                      Banco digital com soluções de pagamento
                    </p>
                  </div>
                </div>
                <button className="w-full sm:w-auto bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
                  Configurar
                </button>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6 transition-colors duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Precisa de ajuda?
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  Nossa equipe está pronta para ajudar você a configurar seus métodos de pagamento. 
                  Entre em contato conosco para suporte personalizado.
                </p>
              </div>
              <button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
                Falar com Suporte
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PIX Configuration Modal */}
      {isPixModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configurar PIX
              </h2>
              <button
                onClick={handleClosePixModal}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Configure sua chave PIX para receber pagamentos
            </p>

            <div className="space-y-4">
              {/* PIX Key Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de chave PIX
                </label>
                <select
                  value={pixKeyType}
                  onChange={(e) => {
                    setPixKeyType(e.target.value);
                    setPixKey(''); // Clear the key when type changes
                  }}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                >
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="email">E-mail</option>
                  <option value="phone">Telefone</option>
                  <option value="random">Chave aleatória</option>
                </select>
              </div>

              {/* PIX Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chave PIX
                </label>
                <input
                  type="text"
                  value={pixKey}
                  onChange={handlePixKeyChange}
                  placeholder={getPixKeyPlaceholder(pixKeyType)}
                  className="w-full bg-white dark:bg-gray-700 border border-purple-500 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                />
              </div>
            </div>

            <button
              onClick={handleSavePixConfiguration}
              disabled={!pixKey.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 mt-6"
            >
              <span>Salvar configuração</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentIntegrationsPage;