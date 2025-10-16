import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface MultiStepFormContainerProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
}

export default function MultiStepFormContainer({
  children,
  currentStep,
  totalSteps
}: MultiStepFormContainerProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-2 rounded-full mx-1 transition-all ${
                index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-600 text-center">
          Passo {currentStep} de {totalSteps}
        </p>
      </div>

      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
      >
        {children}
      </motion.div>
    </div>
  );
}
