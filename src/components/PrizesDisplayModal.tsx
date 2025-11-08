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
  colorMode?: string;
  primaryColor?: string;
  gradientClasses?: string;
  customGradientColors?: string;
}

const PrizesDisplayModal: React.FC<PrizesDisplayModalProps> = ({
  isOpen,
  onClose,
  prizes,
  campaignTitle,
  campaignTheme,
  colorMode = 'solid',
  primaryColor = '#F59E0B',
  gradientClasses = 'from-orange-500 via-yellow-500 to-orange-600',
  customGradientColors,
}) => {
  const getCustomGradientStyle = () => {
    if (!customGradientColors) return null;
    try {
      const colors = JSON.parse(customGradientColors);
      if (Array.isArray(colors) && colors.length >= 2) {
        if (colors.length === 2) {
          return `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`;
        } else if (colors.length === 3) {
          return `linear-gradient(90deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`;
        }
      }
    } catch (error) {
      console.error('Error parsing custom gradient colors:', error);
    }
    return null;
  };

  const getColorStyle = (forText: boolean = false) => {
    if (colorMode === 'gradient') {
      const isCustom = gradientClasses === 'custom';
      const customStyle = getCustomGradientStyle();

      if (isCustom && customStyle) {
        return {
          style: {
            background: customStyle,
            backgroundSize: '200% 200%',
            ...(forText && {
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }),
          },
          className: 'animate-gradient-x bg-[length:200%_200%]',
        };
      } else {
        return {
          style: {},
          className: `bg-gradient-to-r ${gradientClasses} animate-gradient-x bg-[length:200%_200%]`,
        };
      }
    } else {
      return {
        style: { backgroundColor: primaryColor },
        className: '',
      };
    }
  };

  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'claro':
        return {
          background: 'bg-white',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-gray-50',
          border: 'border-gray-200',
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600',
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
          iconBg: 'bg-orange-900/30',
          iconColor: 'text-orange-400',
          closeButtonHover: 'hover:bg-gray-700',
        };
    case 'escuro-cinza':
      return {
        background: 'bg-[#1A1A1A]',
        text: 'text-white',
        textSecondary: 'text-gray-400',
        cardBg: 'bg-[#2C2C2C]',
        border: 'border-gray-700',
        iconBg: 'bg-orange-900/30',
        iconColor: 'text-orange-400',
        closeButtonHover: 'hover:bg-[#3C3C3C]',
      };
      default:
        return {
          background: 'bg-white',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-gray-50',
          border: 'border-gray-200',
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600',
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
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${getColorStyle().className}`}
                  style={getColorStyle().style}
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                >
                  <Trophy className="h-5 w-5 text-white" />
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
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getColorStyle().className}`}
                        style={getColorStyle().style}
                        whileHover={{ scale: 1.2, rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <span className="font-bold text-sm text-white">{index + 1}º</span>
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
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${getColorStyle().className}`}
                    style={getColorStyle().style}
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
                    <Trophy className="h-8 w-8 text-white" />
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
                className={`w-full text-white py-3 rounded-xl font-semibold transition-all duration-200 ${getColorStyle().className}`}
                style={getColorStyle().style}
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