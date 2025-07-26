import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Prize } from '../types/promotion';
import { CampaignAPI } from '../lib/api/campaigns';

interface PrizesModalProps {
  isOpen: boolean;
  onClose: () => void;
  prizes: Prize[];
  onSavePrizes: (prizes: Prize[]) => void;
  campaignId: string;
}

const PrizesModal: React.FC<PrizesModalProps> = ({
  isOpen,
  onClose,
  prizes,
  onSavePrizes,
  campaignId,
}) => {
  const [prizeName, setPrizeName] = useState('');
  const [localPrizes, setLocalPrizes] = useState<Prize[]>(prizes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  // Update local prizes when props change
  React.useEffect(() => {
    setLocalPrizes(prizes);
  }, [prizes]);

  /**
   * Validates prize data before saving
   */
  const validatePrizeData = (name: string): string | null => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return 'Nome do prêmio é obrigatório';
    }
    
    if (trimmedName.length < 3) {
      return 'Nome do prêmio deve ter pelo menos 3 caracteres';
    }
    
    if (trimmedName.length > 200) {
      return 'Nome do prêmio deve ter no máximo 200 caracteres';
    }
    
    // Check for duplicates
    const isDuplicate = localPrizes.some(prize => 
      prize.name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (isDuplicate) {
      return 'Este prêmio já foi adicionado';
    }
    
    return null;
  };

  /**
   * Saves prizes to Supabase database
   */
  const savePrizesToDatabase = async (updatedPrizes: Prize[]): Promise<boolean> => {
    if (!campaignId) {
      console.error('Campaign ID is required for saving prizes');
      setError('ID da campanha não encontrado');
      return false;
    }

    try {
      setSaving(true);
      setError('');
      
      console.log('Saving prizes to database:', {
        campaignId,
        prizesCount: updatedPrizes.length,
        prizes: updatedPrizes
      });

      // Update campaign with new prizes data
      const { data, error: updateError } = await CampaignAPI.updateCampaign({
        id: campaignId,
        prizes: updatedPrizes
      });

      if (updateError) {
        console.error('Supabase update error:', updateError);
        throw new Error(updateError.message || 'Erro ao salvar prêmios');
      }

      if (!data) {
        throw new Error('Nenhum dado retornado do servidor');
      }

      console.log('Prizes saved successfully:', data);
      
      // Update parent component state
      onSavePrizes(updatedPrizes);
      
      return true;
    } catch (error) {
      console.error('Error saving prizes:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao salvar prêmios';
      setError(errorMessage);
      return false;
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handles adding a new prize
   */
  const handleAddPrize = async () => {
    // Validate input
    const validationError = validatePrizeData(prizeName);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (prizeName.trim()) {
      const trimmedName = prizeName.trim();
      
      const newPrize: Prize = {
        id: Date.now().toString(),
        name: trimmedName,
      };
      
      const updatedPrizes = [...localPrizes, newPrize];
      
      // Save to database
      const success = await savePrizesToDatabase(updatedPrizes);
      
      if (success) {
        setLocalPrizes(updatedPrizes);
        setPrizeName('');
        setError('');
      }
    }
  };

  /**
   * Handles removing a prize
   */
  const handleRemovePrize = async (id: string) => {
    const updatedPrizes = localPrizes.filter(prize => prize.id !== id);
    
    // Save to database
    const success = await savePrizesToDatabase(updatedPrizes);
    
    if (success) {
      setLocalPrizes(updatedPrizes);
      setError('');
    }
  };

  /**
   * Handles Enter key press for quick adding
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddPrize();
    }
  };

  /**
   * Handles modal close with cleanup
   */
  const handleCloseModal = () => {
    setPrizeName('');
    setError('');
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

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 mb-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
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
            className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200 ${
              error ? 'border-red-500' : 'border-gray-700'
            }`}
            disabled={saving}
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

        {/* Success Message */}
        {localPrizes.length > 0 && !saving && !error && (
          <div className="mt-4 p-3 bg-green-900/20 border border-green-800 rounded-lg">
            <p className="text-green-300 text-sm text-center">
              ✅ {localPrizes.length} prêmio{localPrizes.length !== 1 ? 's' : ''} salvo{localPrizes.length !== 1 ? 's' : ''} com sucesso!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrizesModal;