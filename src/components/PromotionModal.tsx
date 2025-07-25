import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Promotion, PromotionFormData } from '../types/promotion';
import { formatCurrency, formatCurrencyInput, getCurrencyValue } from '../utils/currency';

interface PromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (promotions: Promotion[]) => void;
  originalTicketPrice: number;
  existingPromotions?: Promotion[];
}

const PromotionModal: React.FC<PromotionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  originalTicketPrice,
  existingPromotions = []
}) => {
  const [formData, setFormData] = useState<PromotionFormData>({
    ticketQuantity: '',
    totalValue: 'R$ 0,00'
  });
  
  const [promotions, setPromotions] = useState<Promotion[]>(existingPromotions);

  // Calculate promotional price per ticket
  const calculatePromotionalPrice = (quantity: number, total: number): number => {
    if (quantity === 0) return 0;
    return total / quantity;
  };

  // Get current form values as numbers
  const currentQuantity = parseInt(formData.ticketQuantity) || 0;
  const currentTotal = getCurrencyValue(formData.totalValue);
  const currentPromotionalPrice = calculatePromotionalPrice(currentQuantity, currentTotal);

  // Handle quantity input change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only numbers
    setFormData({ ...formData, ticketQuantity: value });
  };

  // Handle total value input change
  const handleTotalValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatCurrencyInput(inputValue);
    setFormData({ ...formData, totalValue: formattedValue });
  };

  // Add promotion to list
  const handleAddPromotion = () => {
    if (currentQuantity > 0 && currentTotal > 0) {
      const newPromotion: Promotion = {
        id: `promo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ticketQuantity: currentQuantity,
        totalValue: currentTotal,
        originalPricePerTicket: originalTicketPrice,
        promotionalPricePerTicket: currentPromotionalPrice,
        createdAt: new Date()
      };

      setPromotions([...promotions, newPromotion]);
      
      // Reset form
      setFormData({
        ticketQuantity: '',
        totalValue: 'R$ 0,00'
      });
    }
  };

  // Remove promotion from list
  const handleRemovePromotion = (id: string) => {
    setPromotions(promotions.filter(promo => promo.id !== id));
  };

  // Save and close modal
  const handleSave = () => {
    onSave(promotions);
    onClose();
  };

  // Close modal without saving
  const handleClose = () => {
    setPromotions(existingPromotions); // Reset to original state
    setFormData({
      ticketQuantity: '',
      totalValue: 'R$ 0,00'
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 text-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-semibold">Nova Promoção</h2>
            <p className="text-gray-400 text-sm mt-1">
              Adicione uma nova promoção para a sua campanha
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-800 rounded transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Ticket Quantity */}
            <div>
              <label className="block text-white font-medium mb-2">
                Quantidade de bilhetes
              </label>
              <input
                type="text"
                value={formData.ticketQuantity}
                onChange={handleQuantityChange}
                placeholder="Ex: 10"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
              />
            </div>

            {/* Total Value */}
            <div>
              <label className="block text-white font-medium mb-2">
                Valor total
              </label>
              <input
                type="text"
                value={formData.totalValue}
                onChange={handleTotalValueChange}
                placeholder="R$ 0,00"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
              />
            </div>

            {/* Calculation Display */}
            <div className="space-y-2">
              <div className="text-gray-300">
                Valor bilhete {formatCurrency(currentPromotionalPrice)}
              </div>
              
              {currentQuantity > 0 && currentTotal > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">
                    De {formatCurrency(originalTicketPrice * currentQuantity)}
                  </span>
                  <span className="text-green-400 font-medium">
                    Por apenas {formatCurrency(currentTotal)}
                  </span>
                </div>
              )}
            </div>

            {/* Add Button */}
            <button
              onClick={handleAddPromotion}
              disabled={currentQuantity === 0 || currentTotal === 0}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <span>Adicionar</span>
              <Plus className="h-4 w-4" />
            </button>

            {/* Promotions List */}
            {promotions.length > 0 && (
              <div>
                <h3 className="text-white font-medium mb-4">Promoções criadas</h3>
                <div className="space-y-3">
                  {promotions.map((promotion) => (
                    <div
                      key={promotion.id}
                      className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-purple-400">🎁</span>
                          <span className="text-white font-medium">
                            {promotion.ticketQuantity} Bilhetes
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-400">De </span>
                          <span className="text-red-400 line-through">
                            {formatCurrency(promotion.originalPricePerTicket * promotion.ticketQuantity)}
                          </span>
                          <span className="text-gray-400"> → Por </span>
                          <span className="text-green-400 font-medium">
                            {formatCurrency(promotion.totalValue)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemovePromotion(promotion.id)}
                        className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                        title="Remover promoção"
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

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex space-x-3">
          <button
            onClick={handleClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors duration-200"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromotionModal;