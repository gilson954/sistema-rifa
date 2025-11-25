import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingOverlayProps {
  isOpen: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isOpen, message = 'Processando sua reserva… só um instante!' }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="status"
          aria-live="polite"
          aria-label="Processando solicitação"
          className="fixed inset-0 z-[1000] bg-black/60 pointer-events-auto flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col items-center text-white/90">
            <div className="h-12 w-12 rounded-full border-4 border-white/30 border-t-white/90 animate-spin" />
            <div className="mt-4 text-lg font-medium">
              {message}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingOverlay;

