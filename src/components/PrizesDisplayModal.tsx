// src/components/PrizesDisplayModal.tsx
import React from 'react';
import { X, Trophy } from 'lucide-react';
import { Prize } from '../types/promotion';

interface PrizesDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  prizes: Prize[];
  campaignTitle: string;
  campaignTheme: string;
  primaryColor?: string | null;
  colorMode?: string | null;
  gradientClasses?: string | null;
  customGradientColors?: string | null;
}

const PrizesDisplayModal: React.FC<PrizesDisplayModalProps> = ({
  isOpen,
  onClose,
  prizes,
  campaignTitle,
  campaignTheme,
  primaryColor,
  colorMode,
  gradientClasses,
  customGradientColors,
}) => {
  if (!isOpen) return null;

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

  const getCustomGradientStyle = () => {
    if (!customGradientColors) return {};

    try {
      const colors = JSON.parse(customGradientColors);
      if (Array.isArray(colors) && colors.length >= 2) {
        return {
          backgroundImage: `linear-gradient(135deg, ${colors.join(', ')})`,
          backgroundSize: '200% 200%'
        };
      }
    } catch (e) {
      console.error('Error parsing custom gradient colors:', e);
    }
    return {};
  };

  const getColorStyle = () => {
    if (colorMode === 'gradient') {
      if (gradientClasses === 'custom') {
        return getCustomGradientStyle();
      }
      return {};
    }
    return primaryColor ? { backgroundColor: primaryColor } : {};
  };

  const getColorClassName = () => {
    if (colorMode === 'gradient') {
      if (gradientClasses === 'custom') {
        return 'animate-gradient-x bg-[length:200%_200%]';
      }
      return `bg-gradient-to-r ${gradientClasses} animate-gradient-x bg-[length:200%_200%]`;
    }
    return '';
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const theme = getThemeClasses(campaignTheme);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={handleOverlayClick}
    >
      <div className={`rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto ${theme.background} border ${theme.border} transform transition-all duration-300 animate-scale-in ${
        campaignTheme === 'claro' ? 'custom-scrollbar-light' : 'custom-scrollbar-dark'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${theme.border}`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl ${theme.iconBg} flex items-center justify-center`}>
              <Trophy className={`h-5 w-5 ${theme.iconColor}`} />
            </div>
            <h2 className={`text-xl font-bold ${theme.text}`}>Prêmios</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${theme.closeButtonHover} transition-colors duration-200`}
          >
            <X className={`h-5 w-5 ${theme.textSecondary}`} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className={`text-sm ${theme.textSecondary} mb-4`}>
            Prêmios do sorteio <span className="font-semibold">{campaignTitle}</span>:
          </p>

          {prizes && prizes.length > 0 ? (
            <div className="space-y-3">
              {prizes.map((prize, index) => (
                <div
                  key={prize.id}
                  className={`flex items-center space-x-3 p-4 ${theme.cardBg} rounded-xl border ${theme.border}`}
                >
                  <div className={`w-8 h-8 rounded-full ${theme.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`font-bold text-sm ${theme.iconColor}`}>{index + 1}º</span>
                  </div>
                  <p className={`font-medium ${theme.text}`}>{prize.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center p-8 ${theme.cardBg} rounded-xl border ${theme.border}`}>
              <Trophy className={`h-12 w-12 ${theme.iconColor} mx-auto mb-4`} />
              <p className={`font-medium ${theme.text}`}>Nenhum prêmio cadastrado ainda.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-5 border-t ${theme.border}`}>
          <button
            onClick={onClose}
            className={`w-full py-3 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 ${getColorClassName()}`}
            style={getColorStyle()}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrizesDisplayModal;