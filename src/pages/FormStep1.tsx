import React from 'react';
import { User, Mail, Phone } from 'lucide-react';
import { useMultiStepForm } from '../context/MultiStepFormContext';
import { Step1Data, formatPhoneNumber } from '../lib/validations/formSteps';

const FormStep1: React.FC = () => {
  const { formData, updateStepData, errors } = useMultiStepForm();
  const stepData = formData.step1 as Step1Data;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Aplicar formatação específica para telefone
    if (name === 'telefone') {
      const formattedPhone = formatPhoneNumber(value);
      updateStepData('step1', { [name]: formattedPhone });
    } else {
      updateStepData('step1', { [name]: value });
    }
  };

  const getFieldError = (fieldName: string) => {
    return errors[fieldName] || errors[`step1.${fieldName}`];
  };

  const hasFieldError = (fieldName: string) => {
    return !!(errors[fieldName] || errors[`step1.${fieldName}`]);
  };

  return (
    <div className="space-y-6">
      {/* Nome */}
      <div>
        <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nome Completo *
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            id="nome"
            name="nome"
            value={stepData.nome}
            onChange={handleChange}
            placeholder="Digite seu nome completo"
            className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 ${
              hasFieldError('nome') 
                ? 'border-red-500 error-field' 
                : 'border-gray-300 dark:border-gray-600'
            }`}
          />
        </div>
        {getFieldError('nome') && (
          <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
            <AlertCircle className="h-4 w-4" />
            <span>{getFieldError('nome')}</span>
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email *
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="email"
            id="email"
            name="email"
            value={stepData.email}
            onChange={handleChange}
            placeholder="seu@email.com"
            className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 ${
              hasFieldError('email') 
                ? 'border-red-500 error-field' 
                : 'border-gray-300 dark:border-gray-600'
            }`}
          />
        </div>
        {getFieldError('email') && (
          <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
            <AlertCircle className="h-4 w-4" />
            <span>{getFieldError('email')}</span>
          </p>
        )}
      </div>

      {/* Telefone */}
      <div>
        <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Telefone *
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="tel"
            id="telefone"
            name="telefone"
            value={stepData.telefone}
            onChange={handleChange}
            placeholder="(11) 99999-9999"
            className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 ${
              hasFieldError('telefone') 
                ? 'border-red-500 error-field' 
                : 'border-gray-300 dark:border-gray-600'
            }`}
          />
        </div>
        {getFieldError('telefone') && (
          <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
            <AlertCircle className="h-4 w-4" />
            <span>{getFieldError('telefone')}</span>
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Formato: (XX) XXXXX-XXXX
        </p>
      </div>

      {/* Dicas de Preenchimento */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-sm font-bold">💡</span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
              Dicas de Preenchimento
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Use seu nome completo como aparece nos documentos</li>
              <li>• Verifique se o email está correto - você receberá confirmações</li>
              <li>• O telefone será usado para contato sobre sua campanha</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormStep1;