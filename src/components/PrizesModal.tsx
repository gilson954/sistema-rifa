import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Prize } from '../types/promotion';

interface PrizesModalProps {
  isOpen: boolean;
  onClose: () => void;
  prizes: Prize[];
  onSavePrizes: (prizes: Prize[]) => void;
  saving?: boolean;
}

const PrizesModal: React.FC<PrizesModalProps> = ({
  isOpen,
  onClose,
  prizes,
  onSavePrizes,
  saving = false,
}) => {
  const [prizeName, setPrizeName] = useState('');
  const [localPrizes, setLocalPrizes] = useState<Prize[]>(prizes);

  // Update local prizes when props change
  React.useEffect(() => {
    setLocalPrizes(prizes);
  }, [prizes]);

  const handleAddPrize = () => {
    if (prizeName.trim()) {
      const newPrize: Prize = {
        id: Date.now().toString(),
        name: prizeName.trim(),
      };
      
      const updatedPrizes = [...localPrizes, newPrize];
      setLocalPrizes(updatedPrizes);
      onSavePrizes(updatedPrizes); // Auto-save ao adicionar
      setPrizeName('');
    }
  };

  const handleRemovePrize = (id: string) => {
    const updatedPrizes = localPrizes.filter(prize => prize.id !== id);
    setLocalPrizes(updatedPrizes);
    onSavePrizes(updatedPrizes); // Auto-save ao remover
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddPrize();
    }
  };

  const handleCloseModal = () => {
    setPrizeName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto text-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Novo prêmio</h2>
          <button
            onClick={handleCloseModal}
            className="p-1 rounded-full hover:bg-gray-700 transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-6">
          Adicione um novo prêmio para a sua campanha
        </p>

        {/* Prize Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Qual será o prêmio?
          </label>
          <input
            type="text"
            value={prizeName}
            onChange={(e) => setPrizeName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ex: um celular novo modelo S-20"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
          />
        </div>

        {/* Add Button */}
        <button
          onClick={handleAddPrize}
          disabled={!prizeName.trim() || saving}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2 mb-6"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <span>Adicionar</span>
              <Plus className="h-5 w-5" />
            </>
          )}
        </button>

        {/* Prizes List */}
        {localPrizes.length > 0 && (
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">
              Prêmios criados
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {localPrizes.map((prize, index) => (
                <div
                  key={prize.id}
                  className="flex items-center justify-between bg-gray-800 p-3 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-200">
                      <span className="font-bold text-purple-400">{index + 1}°</span>
                      <span className="ml-2">{prize.name}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemovePrize(prize.id)}
                    disabled={saving}
                    className="p-1 text-red-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    title="Remover prêmio"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrizesModal;