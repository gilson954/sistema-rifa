import { createContext, useContext, useState, ReactNode } from 'react';

interface FormData {
  step1?: any;
  step2?: any;
  step3?: any;
}

interface MultiStepFormContextType {
  formData: FormData;
  updateFormData: (step: string, data: any) => void;
  resetForm: () => void;
}

const MultiStepFormContext = createContext<MultiStepFormContextType | undefined>(undefined);

export function MultiStepFormProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<FormData>({});

  const updateFormData = (step: string, data: any) => {
    setFormData(prev => ({
      ...prev,
      [step]: data
    }));
  };

  const resetForm = () => {
    setFormData({});
  };

  return (
    <MultiStepFormContext.Provider value={{ formData, updateFormData, resetForm }}>
      {children}
    </MultiStepFormContext.Provider>
  );
}

export function useMultiStepForm() {
  const context = useContext(MultiStepFormContext);
  if (!context) {
    throw new Error('useMultiStepForm must be used within MultiStepFormProvider');
  }
  return context;
}
