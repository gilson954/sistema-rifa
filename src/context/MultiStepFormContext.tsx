import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { ZodSchema, ZodError } from 'zod';
import { FullFormData, schemas } from '../lib/validations/formSteps';

interface MultiStepFormContextType {
  formData: FullFormData;
  errors: Record<string, string>;
  isStepValid: Record<string, boolean>;
  updateStepData: (stepName: keyof typeof schemas, data: Record<string, unknown>) => void;
  validateStep: (stepName: keyof typeof schemas) => boolean;
  validateAllSteps: () => boolean;
  resetForm: () => void;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  clearStepErrors: (stepName: keyof typeof schemas) => void;
  getStepProgress: () => { completed: number; total: number; percentage: number };
}

const MultiStepFormContext = createContext<MultiStepFormContextType | undefined>(undefined);

interface MultiStepFormProviderProps {
  children: React.ReactNode;
  initialData: FullFormData;
}

export const MultiStepFormProvider: React.FC<MultiStepFormProviderProps> = ({ 
  children, 
  initialData 
}) => {
  const [formData, setFormData] = useState<FullFormData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isStepValid, setIsStepValid] = useState<Record<string, boolean>>({});

  const updateStepData = useCallback((stepName: keyof typeof schemas, data: Record<string, unknown>) => {
    setFormData(prev => ({
      ...prev,
      [stepName]: { ...prev[stepName] as Record<string, unknown>, ...data }
    }));
    
    // Limpa erros dos campos que foram atualizados
    setErrors(prev => {
      const newErrors = { ...prev };
      for (const key in data) {
        const errorKey = `${stepName}.${key}`;
        if (newErrors[errorKey]) {
          delete newErrors[errorKey];
        }
        // Também limpa erros sem prefixo de etapa
        if (newErrors[key]) {
          delete newErrors[key];
        }
      }
      return newErrors;
    });
  }, []);

  const validateStep = useCallback((stepName: keyof typeof schemas): boolean => {
    const schema: ZodSchema = schemas[stepName];
    if (!schema) {
      console.warn(`Schema for step '${stepName}' not found.`);
      return true;
    }

    try {
      schema.parse(formData[stepName]);
      
      // Limpa erros desta etapa
      setErrors(prev => {
        const newErrors = { ...prev };
        Object.keys(newErrors).forEach(key => {
          if (key.startsWith(`${stepName}.`)) {
            delete newErrors[key];
          }
        });
        return newErrors;
      });
      
      // Marca esta etapa como válida
      setIsStepValid(prev => ({ ...prev, [stepName]: true }));
      
      return true;
    } catch (err) {
      if (err instanceof ZodError) {
        const newErrors: Record<string, string> = {};
        
        err.errors.forEach(error => {
          if (error.path.length > 0) {
            // Cria chave de erro com prefixo da etapa
            const errorKey = `${stepName}.${error.path[0]}`;
            newErrors[errorKey] = error.message;
            // Também adiciona sem prefixo para compatibilidade
            newErrors[error.path[0] as string] = error.message;
          }
        });
        
        setErrors(prev => ({ ...prev, ...newErrors }));
      }
      
      // Marca esta etapa como inválida
      setIsStepValid(prev => ({ ...prev, [stepName]: false }));
      
      return false;
    }
  }, [formData]);

  const validateAllSteps = useCallback((): boolean => {
    let allValid = true;
    const stepNames = Object.keys(schemas) as (keyof typeof schemas)[];
    
    stepNames.forEach(stepName => {
      const isValid = validateStep(stepName);
      if (!isValid) {
        allValid = false;
      }
    });
    
    return allValid;
  }, [validateStep]);

  const clearStepErrors = useCallback((stepName: keyof typeof schemas) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`${stepName}.`)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  }, []);

  const getStepProgress = useCallback(() => {
    const stepNames = Object.keys(schemas) as (keyof typeof schemas)[];
    const completedSteps = stepNames.filter(stepName => isStepValid[stepName]).length;
    const totalSteps = stepNames.length;
    const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    
    return {
      completed: completedSteps,
      total: totalSteps,
      percentage
    };
  }, [isStepValid]);

  const resetForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setIsStepValid({});
  }, [initialData]);

  const value = useMemo(() => ({
    formData,
    errors,
    isStepValid,
    updateStepData,
    validateStep,
    validateAllSteps,
    resetForm,
    setErrors,
    clearStepErrors,
    getStepProgress,
  }), [
    formData,
    errors,
    isStepValid,
    updateStepData,
    validateStep,
    validateAllSteps,
    resetForm,
    clearStepErrors,
    getStepProgress,
  ]);

  return (
    <MultiStepFormContext.Provider value={value}>
      {children}
    </MultiStepFormContext.Provider>
  );
};

export const useMultiStepForm = () => {
  const context = useContext(MultiStepFormContext);
  if (context === undefined) {
    throw new Error('useMultiStepForm must be used within a MultiStepFormProvider');
  }
  return context;
};
