// src/components/PrizesDisplayModal.tsx
import React from 'react';
import { X, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prize } from '../types/promotion';

interface PrizesDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  prizes: Prize[];
  campaignTitle: string;
  campaignTheme: string;
}

const PrizesDisplayModal: React.FC<PrizesDisplayModalProps> = ({
  isOpen,
  onClose,
  prizes,
  campaignTitle,
  campaignTheme,
}) => {
  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'claro':
        return {
          background: 'bg-white',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-gray-50',
          border: 'border-gray-200',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          closeButtonHover: 'hover:bg-gray-100',
        };
      case 'escuro':
      case 'escuro-preto':
        return {
          background: 'bg-gray-900',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-gray-800',
          border: 'border-gray-700',
          iconBg: 'bg-yellow-900/30',
          iconColor: 'text-yellow-400',
          closeButtonHover: 'hover:bg-gray-700',
        };
      default:
        return {
          background: 'bg-white',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-gray-50',
          border: 'border-gray-200',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          closeButtonHover: 'hover:bg-gray-100',
        };
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const theme = getThemeClasses(campaignTheme);

  // Variantes de animação
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.9,
      y: 20
    },
    visible: { 
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
        duration: 0.3
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.9,
      y: 20,
      transition: { duration: 0.2 }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { delay: 0.1, duration: 0.3 }
    }
  };

  const prizeItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: 0.2 + (i * 0.08),
        duration: 0.4,
        type: "spring",
        damping: 20,
        stiffness: 300
      }
    })
  };

  const emptyStateVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        delay: 0.3,
        duration: 0.5,
        type: "spring",
        damping: 15
      }
    }
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { delay: 0.4, duration: 0.3 }
    },
    hover: { 
      scale: 1.02,
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.98 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleOverlayClick}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div 
            className={`rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto ${theme.background} border ${theme.border} ${
              campaignTheme === 'claro' ? 'custom-scrollbar-light' : 'custom-scrollbar-dark'
            }`}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <motion.div 
              className={`flex items-center justify-between p-5 border-b ${theme.border}`}
              variants={headerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="flex items-center space-x-3">
                <motion.div 
                  className={`w-10 h-10 rounded-xl ${theme.iconBg} flex items-center justify-center`}
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                >
                  <Trophy className={`h-5 w-5 ${theme.iconColor}`} />
                </motion.div>
                <h2 className={`text-xl font-bold ${theme.text}`}>Prêmios</h2>
              </div>
              <motion.button
                onClick={onClose}
                className={`p-2 rounded-lg ${theme.closeButtonHover} transition-colors duration-200`}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <X className={`h-5 w-5 ${theme.textSecondary}`} />
              </motion.button>
            </motion.div>

            {/* Body */}
            <div className="p-5">
              <motion.p 
                className={`text-sm ${theme.textSecondary} mb-4`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                Prêmios do sorteio <span className="font-semibold">{campaignTitle}</span>:
              </motion.p>

              {prizes && prizes.length > 0 ? (
                <div className="space-y-3">
                  {prizes.map((prize, index) => (
                    <motion.div
                      key={prize.id}
                      className={`flex items-center space-x-3 p-4 ${theme.cardBg} rounded-xl border ${theme.border}`}
                      custom={index}
                      variants={prizeItemVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover={{ 
                        scale: 1.03,
                        boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                        transition: { duration: 0.2 }
                      }}
                    >
                      <motion.div 
                        className={`w-8 h-8 rounded-full ${theme.iconBg} flex items-center justify-center flex-shrink-0`}
                        whileHover={{ scale: 1.2, rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <span className={`font-bold text-sm ${theme.iconColor}`}>{index + 1}º</span>
                      </motion.div>
                      <p className={`font-medium ${theme.text}`}>{prize.name}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  className={`text-center p-8 ${theme.cardBg} rounded-xl border ${theme.border}`}
                  variants={emptyStateVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  >
                    <Trophy className={`h-12 w-12 ${theme.iconColor} mx-auto mb-4`} />
                  </motion.div>
                  <p className={`font-medium ${theme.text}`}>Nenhum prêmio cadastrado ainda.</p>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <motion.div 
              className={`p-5 border-t ${theme.border}`}
              variants={buttonVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.button
                onClick={onClose}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition-colors duration-200"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                Fechar
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PrizesDisplayModal;