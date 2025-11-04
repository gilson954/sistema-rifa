import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react'; // Ícone de spinner do Lucide React

interface LoadingSpinnerProps {
  isLoading: boolean;
  message?: string;
  spinnerColor?: string;
  textColor?: string;
  overlayColor?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  isLoading,
  message = "Estamos gerando seu pedido, aguarde...",
  spinnerColor = "#FFFFFF", // Branco
  textColor = "#FFFFFF",    // Branco
  overlayColor = "rgba(0, 0, 0, 0.7)", // Preto semi-transparente
}) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: overlayColor }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          aria-live="polite"
          aria-busy="true"
          role="status"
        >
          <motion.div
            className="flex flex-col items-center justify-center p-8 rounded-2xl shadow-2xl"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }} // Fundo escuro com blur
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <motion.div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ color: spinnerColor }}
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              role="progressbar"
              aria-label="Carregando"
            >
              <Loader2 className="h-12 w-12" /> {/* Ícone do spinner */}
            </motion.div>
            <motion.p
              className="mt-6 text-lg font-semibold text-center"
              style={{ color: textColor }}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {message}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingSpinner;
