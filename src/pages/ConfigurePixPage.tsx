import React, { useState } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  Building, 
  User, 
  Check, 
  AlertCircle,
  Copy,
  QrCode
} from 'lucide-react';

const ConfigurePixPage = () => {
  const [pixType, setPixType] = useState<'cpf' | 'email' | 'phone' | 'random'>('cpf');
  const [pixKey, setPixKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  const pixTypes = [
    {
      id: 'cpf',
      label: 'CPF/CNPJ',
      icon: User,
      placeholder: '000.000.000-00',
      description: 'Use seu CPF ou CNPJ como chave PIX'
    },
    {
      id: 'email',
      label: 'E-mail',
      icon: CreditCard,
      placeholder: 'seu@email.com',
      description: 'Use seu e-mail como chave PIX'
    },
    {
      id: 'phone',
      label: 'Telefone',
      icon: Smartphone,
      placeholder: '(11) 99999-9999',
      description: 'Use seu telefone como chave PIX'
    },
    {
      id: 'random',
      label: 'Chave Aleatória',
      icon: QrCode,
      placeholder: 'Chave gerada automaticamente',
      description: 'Chave única gerada pelo seu banco'
    }
  ];

  const handleSave = () => {
    if (pixKey.trim()) {
      setIsConfigured(true);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(pixKey);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configure seu PIX</h1>
        <p className="text-gray-600 dark:text-gray-400">Configure sua chave PIX para receber pagamentos automaticamente</p>
      </div>

      {/* Status Card */}
      <div className={`rounded-lg p-6 border transition-colors duration-300 ${
        isConfigured 
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      }`}>
        <div className="flex items-start space-x-3">
          {isConfigured ? (
            <Check className="h-6 w-6 text-green-600 dark:text-green-400 mt-0.5" />
          ) : (
            <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          )}
          <div className="flex-1">
            <h3 className={`font-semibold ${
              isConfigured 
                ? 'text-green-900 dark:text-green-100' 
                : 'text-yellow-900 dark:text-yellow-100'
            }`}>
              {isConfigured ? 'PIX Configurado' : 'PIX Não Configurado'}
            </h3>
            <p className={`text-sm mt-1 ${
              isConfigured 
                ? 'text-green-700 dark:text-green-300' 
                : 'text-yellow-700 dark:text-yellow-300'
            }`}>
              {isConfigured 
                ? 'Sua chave PIX está configurada e você pode receber pagamentos automaticamente.'
                : 'Configure sua chave PIX para começar a receber pagamentos das suas rifas automaticamente.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Configuração da Chave PIX</h2>
        
        {/* PIX Type Selection */}
        <div className="space-y-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tipo de Chave PIX
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pixTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setPixType(type.id as any)}
                  className={`p-4 border rounded-lg text-left transition-all duration-200 ${
                    pixType === type.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-400'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      pixType === type.id
                        ? 'bg-purple-100 dark:bg-purple-800'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <IconComponent className={`h-5 w-5 ${
                        pixType === type.id
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        pixType === type.id
                          ? 'text-purple-900 dark:text-purple-100'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {type.label}
                      </h3>
                      <p className={`text-sm mt-1 ${
                        pixType === type.id
                          ? 'text-purple-700 dark:text-purple-300'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {type.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* PIX Key Input */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Chave PIX
          </label>
          <div className="relative">
            <input
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder={pixTypes.find(t => t.id === pixType)?.placeholder}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
            />
            {pixKey && (
              <button
                onClick={handleCopyKey}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              >
                <Copy className="h-5 w-5" />
              </button>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Digite sua chave PIX exatamente como está cadastrada no seu banco.
          </p>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={!pixKey.trim()}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors duration-200 ${
              pixKey.trim()
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            Salvar Configuração
          </button>
        </div>
      </div>

      {/* Information Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 transition-colors duration-300">
        <div className="flex items-start space-x-3">
          <Building className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Como funciona?</h3>
            <div className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-2">
              <p>• Quando um cliente comprar bilhetes da sua rifa, o pagamento será processado automaticamente</p>
              <p>• O dinheiro cairá diretamente na sua conta bancária vinculada à chave PIX</p>
              <p>• Você receberá uma notificação a cada pagamento recebido</p>
              <p>• Não há intermediários - o dinheiro é 100% seu</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurePixPage;