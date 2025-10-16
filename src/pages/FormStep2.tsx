import React from 'react';
import { MapPin, Hash, Building, Globe, Bell, MessageCircle } from 'lucide-react';
import { useMultiStepForm } from '../context/MultiStepFormContext';
import { Step2Data, formatCEP } from '../lib/validations/formSteps';

const FormStep2: React.FC = () => {
  const { formData, updateStepData, errors } = useMultiStepForm();
  const stepData = formData.step2 as Step2Data;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      updateStepData('step2', { [name]: checked });
    } else if (name === 'cep') {
      // Aplicar formatação para CEP
      const formattedCEP = formatCEP(value);
      updateStepData('step2', { [name]: formattedCEP });
    } else if (name === 'estado') {
      // Converter estado para maiúsculas
      updateStepData('step2', { [name]: value.toUpperCase() });
    } else {
      updateStepData('step2', { [name]: value });
    }
  };

  const getFieldError = (fieldName: string) => {
    return errors[fieldName] || errors[`step2.${fieldName}`];
  };

  const hasFieldError = (fieldName: string) => {
    return !!(errors[fieldName] || errors[`step2.${fieldName}`]);
  };

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  return (
    <div className="space-y-6">
      {/* Endereço */}
      <div>
        <label htmlFor="endereco" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Endereço Completo *
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            id="endereco"
            name="endereco"
            value={stepData.endereco}
            onChange={handleChange}
            placeholder="Rua, número, bairro"
            className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 ${
              hasFieldError('endereco') 
                ? 'border-red-500 error-field' 
                : 'border-gray-300 dark:border-gray-600'
            }`}
          />
        </div>
        {getFieldError('endereco') && (
          <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
            <AlertCircle className="h-4 w-4" />
            <span>{getFieldError('endereco')}</span>
          </p>
        )}
      </div>

      {/* CEP e Cidade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="cep" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            CEP *
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              id="cep"
              name="cep"
              value={stepData.cep}
              onChange={handleChange}
              placeholder="12345-678"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 ${
                hasFieldError('cep') 
                  ? 'border-red-500 error-field' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
          </div>
          {getFieldError('cep') && (
            <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle className="h-4 w-4" />
              <span>{getFieldError('cep')}</span>
            </p>
          )}
        </div>

        <div>
          <label htmlFor="cidade" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Cidade *
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              id="cidade"
              name="cidade"
              value={stepData.cidade}
              onChange={handleChange}
              placeholder="Nome da cidade"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 ${
                hasFieldError('cidade') 
                  ? 'border-red-500 error-field' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
          </div>
          {getFieldError('cidade') && (
            <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle className="h-4 w-4" />
              <span>{getFieldError('cidade')}</span>
            </p>
          )}
        </div>
      </div>

      {/* Estado */}
      <div>
        <label htmlFor="estado" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Estado *
        </label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            id="estado"
            name="estado"
            value={stepData.estado}
            onChange={handleChange}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 appearance-none ${
              hasFieldError('estado') 
                ? 'border-red-500 error-field' 
                : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <option value="">Selecione um estado</option>
            {estados.map(estado => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>
        </div>
        {getFieldError('estado') && (
          <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
            <AlertCircle className="h-4 w-4" />
            <span>{getFieldError('estado')}</span>
          </p>
        )}
      </div>

      {/* Preferências de Notificação */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Preferências de Contato
        </h3>
        
        {/* Receber Notificações */}
        <div className="mb-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="receberNotificacoes"
              checked={stepData.receberNotificacoes}
              onChange={handleChange}
              className="w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
            />
            <span className="text-gray-700 dark:text-gray-300">
              Quero receber notificações sobre atualizações
            </span>
          </label>
        </div>

        {/* Tipo de Contato */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Como prefere ser contatado? *
          </label>
          <div className="space-y-2">
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="tipoContato"
                value="email"
                checked={stepData.tipoContato === 'email'}
                onChange={handleChange}
                className="w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:ring-2"
              />
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300">Email</span>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="tipoContato"
                value="sms"
                checked={stepData.tipoContato === 'sms'}
                onChange={handleChange}
                className="w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:ring-2"
              />
              <MessageCircle className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300">SMS</span>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="tipoContato"
                value="whatsapp"
                checked={stepData.tipoContato === 'whatsapp'}
                onChange={handleChange}
                className="w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:ring-2"
              />
              <Phone className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300">WhatsApp</span>
            </label>
          </div>
          {getFieldError('tipoContato') && (
            <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle className="h-4 w-4" />
              <span>{getFieldError('tipoContato')}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const estados = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default FormStep2;