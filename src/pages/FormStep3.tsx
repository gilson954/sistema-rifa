import React from 'react';
import { Shield, FileText, Eye, AlertTriangle, CheckCircle, User, Mail, Phone, MapPin } from 'lucide-react';
import { useMultiStepForm } from '../context/MultiStepFormContext';
import { Step3Data } from '../lib/validations/formSteps';

const FormStep3: React.FC = () => {
  const { formData, updateStepData, errors } = useMultiStepForm();
  const stepData = formData.step3 as Step3Data;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      updateStepData('step3', { [name]: checked });
    } else {
      updateStepData('step3', { [name]: value });
    }
  };

  const getFieldError = (fieldName: string) => {
    return errors[fieldName] || errors[`step3.${fieldName}`];
  };

  const hasFieldError = (fieldName: string) => {
    return !!(errors[fieldName] || errors[`step3.${fieldName}`]);
  };

  return (
    <div className="space-y-6">
      {/* Resumo dos Dados */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700/50">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <span>Revisar Informações</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dados Pessoais */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
              <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span>Dados Pessoais</span>
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 dark:text-gray-400">Nome:</span>
                <span className="font-medium text-gray-900 dark:text-white">{formData.step1.nome || 'Não informado'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-3 w-3 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                <span className="font-medium text-gray-900 dark:text-white">{formData.step1.email || 'Não informado'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-3 w-3 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">Telefone:</span>
                <span className="font-medium text-gray-900 dark:text-white">{formData.step1.telefone || 'Não informado'}</span>
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span>Endereço</span>
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start space-x-2">
                <span className="text-gray-600 dark:text-gray-400">Endereço:</span>
                <span className="font-medium text-gray-900 dark:text-white">{formData.step2.endereco || 'Não informado'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 dark:text-gray-400">CEP:</span>
                <span className="font-medium text-gray-900 dark:text-white">{formData.step2.cep || 'Não informado'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 dark:text-gray-400">Cidade/Estado:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formData.step2.cidade || 'Não informado'} - {formData.step2.estado || 'XX'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 dark:text-gray-400">Contato preferido:</span>
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {formData.step2.tipoContato || 'Não selecionado'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Observações Opcionais */}
      <div>
        <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Observações (Opcional)
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          value={stepData.observacoes || ''}
          onChange={handleChange}
          rows={4}
          placeholder="Alguma informação adicional que gostaria de compartilhar..."
          className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 resize-none ${
            hasFieldError('observacoes') 
              ? 'border-red-500 error-field' 
              : 'border-gray-300 dark:border-gray-600'
          }`}
        />
        {getFieldError('observacoes') && (
          <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
            <AlertTriangle className="h-4 w-4" />
            <span>{getFieldError('observacoes')}</span>
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {(stepData.observacoes?.length || 0)}/500 caracteres
        </p>
      </div>

      {/* Termos e Condições */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
          <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <span>Termos e Condições</span>
        </h3>

        {/* Aceitar Termos */}
        <div className={`border rounded-lg p-4 ${
          hasFieldError('aceitarTermos') 
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
            : 'border-gray-200 dark:border-gray-700'
        }`}>
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              name="aceitarTermos"
              checked={stepData.aceitarTermos}
              onChange={handleChange}
              className={`w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 focus:ring-2 mt-1 ${
                hasFieldError('aceitarTermos') ? 'error-field' : ''
              }`}
            />
            <div className="flex-1">
              <span className="text-gray-700 dark:text-gray-300">
                Li e aceito os{' '}
                <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">
                  Termos de Uso
                </a>
                {' '}da plataforma *
              </span>
              {getFieldError('aceitarTermos') && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{getFieldError('aceitarTermos')}</span>
                </p>
              )}
            </div>
          </label>
        </div>

        {/* Aceitar Política de Privacidade */}
        <div className={`border rounded-lg p-4 ${
          hasFieldError('aceitarPrivacidade') 
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
            : 'border-gray-200 dark:border-gray-700'
        }`}>
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              name="aceitarPrivacidade"
              checked={stepData.aceitarPrivacidade}
              onChange={handleChange}
              className={`w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 focus:ring-2 mt-1 ${
                hasFieldError('aceitarPrivacidade') ? 'error-field' : ''
              }`}
            />
            <div className="flex-1">
              <span className="text-gray-700 dark:text-gray-300">
                Li e aceito a{' '}
                <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">
                  Política de Privacidade
                </a>
                {' '}da plataforma *
              </span>
              {getFieldError('aceitarPrivacidade') && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{getFieldError('aceitarPrivacidade')}</span>
                </p>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Status de Validação */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          <div>
            <h4 className="font-medium text-green-800 dark:text-green-200">
              Pronto para Finalizar!
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              Revise suas informações e clique em "Finalizar" para concluir o cadastro.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormStep3;