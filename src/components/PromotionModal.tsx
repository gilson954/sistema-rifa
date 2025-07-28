import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatInputCurrency } from '../utils/currency';
import { Promotion } from '../types/promotion';

interface PromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePromotions: (promotions: Promotion[]) => void;
  initialPromotions: Promotion[];
  originalTicketPrice: number; // Preço original da cota (ex: 0.10)
  campaignTotalTickets: number; // Total de cotas da campanha
}

const PromotionModal: React.FC<PromotionModalProps> = ({
  isOpen,
  onClose,
  onSavePromotions,
  initialPromotions,
  originalTicketPrice,
  campaignTotalTickets,
}) => {
  const [ticketQuantity, setTicketQuantity] = useState<string>('');
  const [discountedValueInput, setDiscountedValueInput] = useState<string>('');
  const [localPromotions, setLocalPromotions] = useState<Promotion[]>(initialPromotions);
  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
    setLocalPromotions(initialPromotions);
  }, [initialPromotions]);

  // Parse values for calculations
  const parsedQuantity = parseInt(ticketQuantity) || 0;
  const parsedDiscountedValue = discountedValueInput ? parseFloat(discountedValueInput.replace(/\./g, '').replace(',', '.')) : 0;

  // Calculations
  const originalTotalValue = parsedQuantity * originalTicketPrice;
  const fixedDiscountAmount = originalTotalValue - parsedDiscountedValue;
  const isValidPromotion = parsedDiscountedValue > 0 && parsedDiscountedValue < originalTotalValue;
  const isAddButtonEnabled = parsedQuantity > 0 && parsedDiscountedValue > 0 && isValidPromotion;

  // NOVO: Conjunto de quantidades de bilhetes já utilizadas por promoções existentes
  // Usado para garantir a unicidade da quantidade de bilhetes por promoção
  const usedTicketQuantities = useMemo(() => {
    const quantities = new Set<number>();
    localPromotions.forEach(promo => quantities.add(promo.ticketQuantity));
    return quantities;
  }, [localPromotions]);

  // Cálculo de cotas já utilizadas por promoções existentes e cotas restantes
  const totalTicketsUsedByExistingPromotions = localPromotions.reduce((sum, promo) => sum + promo.ticketQuantity, 0);
  const remainingTicketsForPromotions = campaignTotalTickets - totalTicketsUsedByExistingPromotions;

  // Validação em tempo real dos campos de entrada
  useEffect(() => {
    let currentError = '';

    // 1. Validação básica de entrada (quantidade deve ser um inteiro positivo)
    if (parsedQuantity <= 0 && ticketQuantity !== '') {
      currentError = 'A quantidade de bilhetes deve ser um número inteiro positivo.';
    }

    // 2. Validação de unicidade da quantidade de bilhetes (NOVO REQUISITO)
    // Impede a criação de promoções com a mesma quantidade de cotas já utilizada
    if (currentError === '' && parsedQuantity > 0 && usedTicketQuantities.has(parsedQuantity)) {
      currentError = `Já existe uma promoção com ${parsedQuantity.toLocaleString('pt-BR')} bilhetes. Escolha uma quantidade diferente.`;
    }

    // 3. Validação do valor do desconto
    if (currentError === '' && parsedQuantity > 0 && parsedDiscountedValue > 0) {
      if (parsedDiscountedValue >= originalTotalValue) {
        currentError = 'O valor com desconto não pode ser maior ou igual ao valor original.';
      }
    }

    // 4. Validação da quantidade em relação ao total de cotas da campanha
    if (currentError === '' && parsedQuantity > 0 && parsedQuantity > campaignTotalTickets) {
      currentError = `A quantidade de bilhetes da promoção (${parsedQuantity.toLocaleString('pt-BR')}) não pode exceder o total de cotas da campanha (${campaignTotalTickets.toLocaleString('pt-BR')}).`;
    }

    // 5. Validação da quantidade em relação às cotas restantes disponíveis
    if (currentError === '' && parsedQuantity > 0 && parsedQuantity > remainingTicketsForPromotions) {
      currentError = `Não há cotas suficientes disponíveis para esta promoção. Restam ${remainingTicketsForPromotions.toLocaleString('pt-BR')} cotas.`;
    }

    setValidationError(currentError);
  }, [parsedQuantity, parsedDiscountedValue, originalTotalValue, usedTicketQuantities, campaignTotalTickets, remainingTicketsForPromotions, ticketQuantity]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow positive integers
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) > 0)) {
      setTicketQuantity(value);
    }
  };

  const handleDiscountedValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatInputCurrency(e.target.value);
    setDiscountedValueInput(formattedValue);
  };

  const handleAddPromotion = () => {
    // Se houver qualquer erro de validação, não permite adicionar
    if (!!validationError || !isAddButtonEnabled) {
      return;
    }
    
    // Cria o novo objeto de promoção
    const newPromotion: Promotion = {
      id: Date.now().toString(),
      ticketQuantity: parsedQuantity,
      discountedTotalValue: parsedDiscountedValue,
      fixedDiscountAmount: fixedDiscountAmount,
    };
    
    // Adiciona a nova promoção à lista local e salva
    const updatedPromotions = [...localPromotions, newPromotion];
    setLocalPromotions(updatedPromotions);
    onSavePromotions(updatedPromotions); // Auto-salva ao adicionar
    
    // Limpa os campos de entrada após adicionar
    setTicketQuantity('');
    setDiscountedValueInput('');
    // validationError será limpo automaticamente pelo useEffect quando os inputs forem limpos
  };

  const handleDeletePromotion = (id: string) => {
    const updatedPromotions = localPromotions.filter(promotion => promotion.id !== id);
    setLocalPromotions(updatedPromotions);
    onSavePromotions(updatedPromotions); // Auto-salva ao remover
  };

  const handleCloseModal = () => {
    // Reseta o estado dos campos de entrada e erros ao fechar o modal
    setTicketQuantity('');
    setDiscountedValueInput('');
    setValidationError('');
    onClose();
  };

  if (!isOpen) return null;

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

        {/* Informações sobre cotas disponíveis */}
        {campaignTotalTickets > 0 && (
          <div className="mb-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg text-sm text-blue-300">
            <p>Total de cotas da campanha: <span className="font-bold">{campaignTotalTickets.toLocaleString('pt-BR')}</span></p>
            <p>Cotas já usadas em promoções: <span className="font-bold">{totalTicketsUsedByExistingPromotions.toLocaleString('pt-BR')}</span></p>
            <p>Cotas restantes para novas promoções: <span className="font-bold">{remainingTicketsForPromotions.toLocaleString('pt-BR')}</span></p>
          </div>
        )}

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
              Valor final com desconto
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                R$
              </span>
              <input
                type="text"
                value={discountedValueInput}
                onChange={handleDiscountedValueChange}
                placeholder="0,00"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
              />
            </div>
          </div>

          {/* Funcionalidade 1: Exibição Persistente do Valor da Cota */}
          <div className="text-sm text-gray-300 mb-2">
            Valor cota {formatCurrency(originalTicketPrice)}
          </div>

          {/* Automatic Calculation Display */}
          {parsedQuantity > 0 && parsedDiscountedValue > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300">
                De {formatCurrency(originalTotalValue)}
              </span>
              <span className="text-green-400 font-bold">
                Por apenas {formatCurrency(parsedDiscountedValue)}
              </span>
            </div>
          )}

          {/* Fixed Discount Amount Display */}
          {parsedQuantity > 0 && parsedDiscountedValue > 0 && fixedDiscountAmount > 0 && (
            <div className="bg-green-900/20 border border-green-800 rounded-lg p-3">
              <div className="text-sm text-green-300">
                <span className="font-medium">Desconto fixo aplicado:</span> {formatCurrency(fixedDiscountAmount)}
              </div>
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
          disabled={!isAddButtonEnabled || !!validationError}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2 mb-6"
        >
          <Plus className="h-5 w-5" />
          <span>Adicionar</span>
        </button>

        {/* Promotions List */}
        {localPromotions.length > 0 && (
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">
              Promoções criadas
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {localPromotions.map((promo) => {
                const originalValue = promo.ticketQuantity * originalTicketPrice;
                const discountPercentage = originalValue > 0 ? Math.round((promo.fixedDiscountAmount / originalValue) * 100) : 0;
                
                return (
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
                          {formatCurrency(originalValue)}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="text-gray-400">Por:</span>
                        <span className="text-green-400 font-bold">
                          {formatCurrency(promo.discountedTotalValue)}
                        </span>
                      </div>
                      <div className="text-xs text-green-300 mt-1">
                        Desconto: {formatCurrency(promo.fixedDiscountAmount)} ({discountPercentage}%)
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePromotion(promo.id)}
                      className="p-1 text-red-400 hover:text-red-500 transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionModal;