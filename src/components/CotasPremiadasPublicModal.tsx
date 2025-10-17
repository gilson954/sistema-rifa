import React, { useState } from 'react';
import { X, Award, CheckCircle, ShoppingBag, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CotaPremiada } from '../types/cotasPremiadas';

interface CotasPremiadasPublicModalProps {
  isOpen: boolean;
  onClose: () => void;
  cotasPremiadas: CotaPremiada[];
  campaignTitle: string;
  campaignTheme: string;
  totalTickets: number;
  colorMode?: string;
  primaryColor?: string;
  gradientClasses?: string;
  customGradientColors?: string;
}

const CotasPremiadasPublicModal: React.FC<CotasPremiadasPublicModalProps> = ({
  isOpen,
  onClose,
  cotasPremiadas,
  campaignTitle,
  campaignTheme,
  totalTickets,
  colorMode = 'solid',
  primaryColor = '#F59E0B',
  gradientClasses = 'from-orange-500 via-yellow-500 to-orange-600',
  customGradientColors,
}) => {
  const [showAll, setShowAll] = useState(false);

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

  const getQuotaNumberPadding = () => {
    return totalTickets.toString().length;
  };

  const formatQuotaNumber = (numero: number) => {
    return numero.toString().padStart(getQuotaNumberPadding(), '0');
  };

  const getStatusBadge = (cota: CotaPremiada) => {
    switch (cota.status) {
      case 'disponivel':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-semibold">
            <CheckCircle className="h-4 w-4" />
            <span>Disponível</span>
          </div>
        );
      case 'comprada':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-sm font-semibold">
            <ShoppingBag className="h-4 w-4" />
            <span>Comprada</span>
          </div>
        );
      case 'encontrada':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-semibold">
            <Trophy className="h-4 w-4" />
            <span>Ganhador: {cota.winner_name || 'Desconhecido'}</span>
          </div>
        );
      default:
        return null;
    }
  };

  const displayedCotas = showAll ? cotasPremiadas : cotasPremiadas.slice(0, 10);

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.2 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 },
    },
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
        duration: 0.3,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 20,
      transition: { duration: 0.2 },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: 0.1, duration: 0.3 },
    },
  };

  const cotaItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: 0.2 + i * 0.05,
        duration: 0.4,
        type: 'spring',
        damping: 20,
        stiffness: 300,
      },
    }),
  };

  const emptyStateVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        delay: 0.3,
        duration: 0.5,
        type: 'spring',
        damping: 15,
      },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: 0.4, duration: 0.3 },
    },
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 },
    },
    tap: { scale: 0.98 },
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
            className={`rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto ${theme.background} border ${theme.border} ${
              campaignTheme === 'claro' ? 'custom-scrollbar-light' : 'custom-scrollbar-dark'
            }`}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
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
                  <Award className="h-5 w-5 text-white" />
                </motion.div>
                <h2 className={`text-xl font-bold ${theme.text}`}>Cotas Premiadas</h2>
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

            <div className="p-5">
              <motion.p
                className={`text-sm ${theme.textSecondary} mb-4`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                Cotas premiadas do sorteio <span className="font-semibold">{campaignTitle}</span>:
              </motion.p>

              {cotasPremiadas && cotasPremiadas.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {displayedCotas.map((cota, index) => (
                      <motion.div
                        key={cota.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 ${theme.cardBg} rounded-xl border ${theme.border}`}
                        custom={index}
                        variants={cotaItemVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover={{
                          scale: 1.02,
                          boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                          transition: { duration: 0.2 },
                        }}
                      >
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <motion.div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getColorStyle().className}`}
                            style={getColorStyle().style}
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <span className="font-bold text-sm text-white">
                              {formatQuotaNumber(cota.numero_cota)}
                            </span>
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold ${theme.text} truncate`}>{cota.premio}</p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">{getStatusBadge(cota)}</div>
                      </motion.div>
                    ))}
                  </div>

                  {cotasPremiadas.length > 10 && (
                    <motion.div
                      className="mt-4 text-center"
                      variants={buttonVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <motion.button
                        onClick={() => setShowAll(!showAll)}
                        className="text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        {showAll ? 'Mostrar menos' : `Mostrar mais (${cotasPremiadas.length - 10})`}
                      </motion.button>
                    </motion.div>
                  )}
                </>
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
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: 'reverse',
                    }}
                  >
                    <Award className="h-8 w-8 text-white" />
                  </motion.div>
                  <p className={`font-medium ${theme.text}`}>Nenhuma cota premiada cadastrada ainda.</p>
                </motion.div>
              )}
            </div>

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

export default CotasPremiadasPublicModal;
