import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { formatCurrency, parseCurrency, formatInputCurrency } from '../utils/currency';
import { Promotion } from '../types/promotion';

interface PromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePromotions: (promotions: Promotion[]) => void;
  initialPromotions: Promotion[];
  originalTicketPrice: number; // Original ticket price (e.g., 0.10)
}

const PromotionModal: React.FC<PromotionModalProps> = ({
  isOpen,
  onClose,
  onSavePromotions,
  initialPromotions,
  originalTicketPrice,
}) => {
  const [ticketQuantity, setTicketQuantity] = useState<number | ''>('');
  const [totalValueInput, setTotalValueInput] = useState<string>('');
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);

  useEffect(() => {
    setPromotions(initialPromotions);
  }, [initialPromotions]);

  if (!isOpen) return null;

  const parsedTotalValue = parseCurrency(`R$ ${totalValueInput}`);
  const isAddButtonEnabled = ticketQuantity > 0 && parsedTotalValue > 0;

  // Dynamic calculations for display
  const calculatedOriginalTotalValue = (ticketQuantity || 0) * originalTicketPrice;
  const calculatedPromotionalPricePerTicket =
    ticketQuantity > 0 ? parsedTotalValue / (ticketQuantity as number) : 0;

  const handleAddPromotion = () => {
    if (ticketQuantity && parsedTotalValue > 0) {
      const newPromotion: Promotion = {
        id: Date.now().toString(), // Simple ID for demo purposes
        ticketQuantity: ticketQuantity as number,
        totalValue: parsedTotalValue,
        originalTotalValue: calculatedOriginalTotalValue,
        promotionalPricePerTicket: calculatedPromotionalPricePerTicket,
      };
      setPromotions((prev) => [...prev, newPromotion]);
      setTicketQuantity('');
      setTotalValueInput('');
    }
  };

  const handleDeletePromotion = (id: string) => {
    setPromotions((prev) => prev.filter((promo) => promo.id !== id));
  };

  const handleCloseModal = () => {
    onSavePromotions(promotions); // Save promotions when closing
    onClose();
  };

  const handleTotalValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatInputCurrency(e.target.value);
    setTotalValueInput(formattedValue);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md text-white">
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
              type="number"
              value={ticketQuantity}
              onChange={(e) => setTicketQuantity(parseInt(e.target.value) || '')}
              placeholder="Ex: 10"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
              min="1"
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

          {/* Automatic Calculation Display */}
          <div className="bg-gray-800 p-4 rounded-lg space-y-2">
            <p className="text-sm text-gray-300">
              Valor bilhete {formatCurrency(originalTicketPrice)}
            </p>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300">
                De {formatCurrency(calculatedOriginalTotalValue)}
              </span>
              <span className="text-green-400 font-bold">
                Por apenas {formatCurrency(parsedTotalValue)}
              </span>
            </div>
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={handleAddPromotion}
          disabled={!isAddButtonEnabled}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <span>Adicionar</span>
          <Plus className="h-5 w-5" />
        </button>

        {/* Promotions List */}
        {promotions.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">
              Promoções criadas
            </h3>
            <div className="space-y-3">
              {promotions.map((promo) => (
                <div
                  key={promo.id}
                  className="flex items-center justify-between bg-gray-800 p-3 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate">
                      <span className="font-bold">{promo.ticketQuantity}</span> Bilhetes — De{' '}
                      <span className="line-through">
                        {formatCurrency(promo.originalTotalValue)}
                      </span>{' '}
                      → Por{' '}
                      <span className="text-green-400 font-bold">
                        {formatCurrency(promo.totalValue)}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeletePromotion(promo.id)}
                    className="p-1 text-red-400 hover:text-red-500 transition-colors duration-200"
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
  );
};

export default PromotionModal;