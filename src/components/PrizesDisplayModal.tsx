// src/components/PrizesDisplayModal.tsx
import React from 'react';
import { X, Trophy } from 'lucide-react';
import { Prize } from '../types/promotion';

interface PrizesDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  prizes: Prize[];
  campaignTitle: string;
  campaignTheme: string; // Adicionado para temas
}

const PrizesDisplayModal: React.FC<PrizesDisplayModalProps> = ({
  isOpen,
  onClose,
  prizes,
  campaignTitle,
  campaignTheme,
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

  const theme = getThemeClasses(campaignTheme);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className={`rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto ${theme.background} border ${theme.border} transform transition-all duration-300 animate-scale-in`}>
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
            Lista de prêmios da campanha <span className="font-semibold">{campaignTitle}</span>.
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
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition-colors duration-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrizesDisplayModal;
