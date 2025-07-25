import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatInputCurrency } from '../utils/currency';
import { Promotion } from '../types/promotion';

interface PromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePromotions: (promotions: Promotion[]) => void;
  initialPromotions: Promotion[];
  originalTicketPrice: number; // Preço original da cota (ex: 0.10)
}

const PromotionModal: React.FC<PromotionModalProps> = ({
  isOpen,
  onClose,
  onSavePromotions,
  initialPromotions,
  originalTicketPrice,
}) => {
  const [ticketQuantity, setTicketQuantity] = useState<string>('');
  const [totalValueInput, setTotalValueInput] = useState<string>('');
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);
  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
    setPromotions(initialPromotions);
  }, [initialPromotions]);

  // Parse values for calculations
  const parsedQuantity = parseInt(ticketQuantity) || 0;
  const parsedTotalValue = totalValueInput ? parseFloat(totalValueInput.replace(/\./g, '').replace(',', '.')) : 0;

  // Calculations
  const originalTotalValue = parsedQuantity * originalTicketPrice;
  const isValidPromotion = parsedTotalValue > 0 && parsedTotalValue < originalTotalValue;
  const isAddButtonEnabled = parsedQuantity > 0 && parsedTotalValue > 0 && isValidPromotion;

  // Validation error message
  useEffect(() => {
    if (parsedQuantity > 0 && parsedTotalValue > 0) {
      if (parsedTotalValue >= originalTotalValue) {
        setValidationError('O valor com desconto não pode ser maior que o valor original.');
      } else {
        setValidationError('');
      }
    } else {
      setValidationError('');
    }
  }, [parsedQuantity, parsedTotalValue, originalTotalValue]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow positive integers
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) > 0)) {
      setTicketQuantity(value);
    }
  };

  const handleTotalValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatInputCurrency(e.target.value);
    setTotalValueInput(formattedValue);
  };

  const handleAddPromotion = () => {
    if (isAddButtonEnabled) {
      const newPromotion: Promotion = {
        id: Date.now().toString(),
        ticketQuantity: parsedQuantity,
        totalValue: parsedTotalValue,
        originalTotalValue: originalTotalValue,
        promotionalPricePerTicket: parsedTotalValue / parsedQuantity,
      };
      
      setPromotions(prev => [...prev, newPromotion]);
      setTicketQuantity('');
      setTotalValueInput('');
      setValidationError('');
    }
  };

  const handleDeletePromotion = (id: string) => {
    setPromotions(prev => prev.filter(promo => promo.id !== id));
  };

  const handleCloseModal = () => {
    onSavePromotions(promotions);
    onClose();
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto text-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Nova Promoção</h2>
          <button
            onClick={handleCloseModal}
            className="p-1 rounded-full hover:bg-gray-700 transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-6">
          Adicione uma nova promoção para a sua campanha
        </p>

        {/* Fields */}
        <div className="space-y-4 mb-6">
          {/* Ticket Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Quantidade de bilhetes
            </label>
            <input
              type="text"
              value={ticketQuantity}
              onChange={handleQuantityChange}
              placeholder="Ex: 10"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
            />
          </div>

          {/* Total Value */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Valor total
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                R$
              </span>
              <input
                type="text"
                value={totalValueInput}
                onChange={handleTotalValueChange}
                placeholder="0,00"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
              />
            </div>
          </div>

          {/* Dynamic Ticket Value Display */}
          <div className="text-sm text-gray-300">
            Valor cota {formatCurrency(originalTicketPrice)}
          </div>

          {/* Automatic Calculation Display */}
          {parsedQuantity > 0 && parsedTotalValue > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300">
                De {formatCurrency(originalTotalValue)}
              </span>
              <span className="text-green-400 font-bold">
                Por apenas {formatCurrency(parsedTotalValue)}
              </span>
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <span className="text-red-300 text-sm">{validationError}</span>
            </div>
          )}
        </div>

        {/* Add Button */}
        <button
          onClick={handleAddPromotion}
          disabled={!isAddButtonEnabled}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2 mb-6"
        >
          <Plus className="h-5 w-5" />
          <span>Adicionar</span>
        </button>

        {/* Promotions List */}
        {promotions.length > 0 && (
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">
              Promoções criadas
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {promotions.map((promo) => (
                <div
                  key={promo.id}
                  className="flex items-center justify-between bg-gray-800 p-3 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 text-sm text-gray-200">
                      <span className="text-purple-400">🎁</span>
                      <span className="font-bold">{promo.ticketQuantity}</span>
                      <span>Bilhetes</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm mt-1">
                      <span className="text-gray-400">De:</span>
                      <span className="line-through text-gray-400">
                        {formatCurrency(promo.originalTotalValue)}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="text-gray-400">Por:</span>
                      <span className="text-green-400 font-bold">
                        {formatCurrency(promo.totalValue)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePromotion(promo.id)}
                    className="p-1 text-red-400 hover:text-red-500 transition-colors duration-200"
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

export default PromotionModal;