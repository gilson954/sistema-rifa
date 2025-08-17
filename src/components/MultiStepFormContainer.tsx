import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { useMultiStepForm } from '../context/MultiStepFormContext';
import { schemas } from '../lib/validations/formSteps';
import Step1 from '../pages/FormStep1';
import Step2 from '../pages/FormStep2';
import Step3 from '../pages/FormStep3';

const MultiStepFormContainer: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { 
    formData, 
    validateStep, 
    validateAllSteps, 
    resetForm, 
    setErrors, 
    getStepProgress,
    isStepValid 
  } = useMultiStepForm();

  // Configuração das etapas
  const steps = [
    { 
      component: <Step1 />, 
      name: 'step1' as keyof typeof schemas,
      title: 'Dados Pessoais',
      description: 'Informações básicas de contato'
    },
    { 
      component: <Step2 />, 
      name: 'step2' as keyof typeof schemas,
      title: 'Endereço e Preferências',
      description: 'Localização e configurações'
    },
    { 
      component: <Step3 />, 
      name: 'step3' as keyof typeof schemas,
      title: 'Confirmação',
      description: 'Revisar e aceitar termos'
    },
  ];

  const currentStep = steps[currentStepIndex];
  const progress = getStepProgress();

  const handleNext = async () => {
    // Valida a etapa atual antes de avançar
    const isValid = validateStep(currentStep.name);
    
    if (isValid) {
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      } else {
        // Última etapa: submete o formulário
        await handleSubmit();
      }
    } else {
      // Scroll para o primeiro erro visível
      setTimeout(() => {
        const firstError = document.querySelector('.error-field');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      // Limpa erros ao voltar (opcional)
      setErrors({});
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Permite navegar diretamente para uma etapa se todas as anteriores forem válidas
    let canNavigate = true;
    
    for (let i = 0; i < stepIndex; i++) {
      const stepName = steps[i].name;
      if (!isStepValid[stepName]) {
        canNavigate = false;
        break;
      }
    }
    
    if (canNavigate) {
      setCurrentStepIndex(stepIndex);
    } else {
      alert('Complete as etapas anteriores antes de prosseguir.');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Validação final de todo o formulário
      const isAllValid = validateAllSteps();
      
      if (!isAllValid) {
        alert('Por favor, corrija os erros no formulário antes de continuar.');
        setIsSubmitting(false);
        return;
      }

      // Simula envio para API
      console.log('📤 Enviando dados do formulário:', formData);
      
      // Simula delay de rede
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simula resposta da API
      const success = Math.random() > 0.2; // 80% de chance de sucesso
      
      if (success) {
        alert('✅ Formulário enviado com sucesso!');
        resetForm();
        setCurrentStepIndex(0);
      } else {
        throw new Error('Erro simulado do servidor');
      }
      
    } catch (error) {
      console.error('❌ Erro ao enviar formulário:', error);
      alert('❌ Erro ao enviar formulário. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepStatus = (stepIndex: number) => {
    const stepName = steps[stepIndex].name;
    
    if (stepIndex < currentStepIndex) {
      return isStepValid[stepName] ? 'completed' : 'error';
    } else if (stepIndex === currentStepIndex) {
      return 'current';
    } else {
      return 'pending';
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'current':
        return <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">{currentStepIndex + 1}</div>;
      default:
        return <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 text-xs font-bold">{currentStepIndex + 1}</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Progress Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Formulário Multi-Etapas</h1>
          <div className="text-sm bg-white/20 px-3 py-1 rounded-full">
            {progress.completed}/{progress.total} Concluídas
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-white/20 rounded-full h-2 mb-4">
          <div 
            className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        
        {/* Step Indicators */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            return (
              <button
                key={index}
                onClick={() => handleStepClick(index)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                  status === 'current' 
                    ? 'bg-white/20 text-white' 
                    : status === 'completed'
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'text-white/60 hover:text-white/80'
                }`}
                disabled={status === 'pending'}
              >
                {getStepIcon(status)}
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs opacity-80">{step.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6 sm:p-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {currentStep.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {currentStep.description}
          </p>
        </div>

        {/* Current Step Component */}
        <div className="mb-8">
          {currentStep.component}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleBack}
            disabled={currentStepIndex === 0}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed text-gray-900 dark:text-white rounded-lg font-medium transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </button>

          <div className="flex items-center space-x-4">
            {/* Save Draft Button (opcional) */}
            <button
              onClick={() => {
                console.log('💾 Salvando rascunho:', formData);
                alert('Rascunho salvo!');
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors duration-200"
            >
              <Save className="h-4 w-4" />
              <span>Salvar Rascunho</span>
            </button>

            {/* Next/Submit Button */}
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Enviando...</span>
                </>
              ) : currentStepIndex < steps.length - 1 ? (
                <>
                  <span>Próximo</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span>Finalizar</span>
                  <CheckCircle className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Debug Panel (apenas em desenvolvimento) */}
      {import.meta.env.DEV && (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 mb-2">
              🔧 Debug Info (Dev Only)
            </summary>
            <div className="space-y-2 text-xs">
              <div>
                <strong>Form Data:</strong>
                <pre className="bg-gray-200 dark:bg-gray-700 p-2 rounded mt-1 overflow-x-auto">
                  {JSON.stringify(formData, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Errors:</strong>
                <pre className="bg-red-100 dark:bg-red-900/20 p-2 rounded mt-1 overflow-x-auto">
                  {JSON.stringify(errors, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Step Validity:</strong>
                <pre className="bg-green-100 dark:bg-green-900/20 p-2 rounded mt-1 overflow-x-auto">
                  {JSON.stringify(isStepValid, null, 2)}
                </pre>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default MultiStepFormContainer;