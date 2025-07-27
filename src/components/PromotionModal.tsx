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
  campaignTotalTickets: number; // NOVO: Total de cotas da campanha
}

const PromotionModal: React.FC<PromotionModalProps> = ({
  isOpen,
  onClose,
  onSavePromotions,
  initialPromotions,
  originalTicketPrice,
  campaignTotalTickets, // NOVO: Recebe o total de cotas da campanha
}) => {
  const [ticketQuantity, setTicketQuantity] = useState<string>('');
  const [totalValueInput, setTotalValueInput] = useState<string>('');
  const [localPromotions, setLocalPromotions] = useState<Promotion[]>(initialPromotions);
  const [validationError, setValidationError] = useState<string>('');

  // Sincroniza as promoções locais com as iniciais quando o modal é aberto ou as props mudam
  useEffect(() => {
    setLocalPromotions(initialPromotions);
  }, [initialPromotions]);

  // Converte os valores de entrada para números para cálculos
  const parsedQuantity = parseInt(ticketQuantity) || 0;
  const parsedTotalValue = totalValueInput ? parseFloat(totalValueInput.replace(/\./g, '').replace(',', '.')) : 0;

  // Calcula o valor total original da promoção (sem desconto)
  const originalTotalValue = parsedQuantity * originalTicketPrice;
  // Verifica se a promoção é válida (valor total com desconto é menor que o original e maior que zero)
  const isValidPromotion = parsedTotalValue > 0 && parsedTotalValue < originalTotalValue;
  // Habilita o botão de adicionar se a promoção for válida e os campos preenchidos
  const isAddButtonEnabled = parsedQuantity > 0 && parsedTotalValue > 0 && isValidPromotion;

  // NOVO: Cálculo de cotas já utilizadas por promoções existentes e cotas restantes
  const totalTicketsUsedByExistingPromotions = localPromotions.reduce((sum, promo) => sum + promo.ticketQuantity, 0);
  const remainingTicketsForPromotions = campaignTotalTickets - totalTicketsUsedByExistingPromotions;

  // Validação em tempo real do valor total da promoção
  useEffect(() => {
    if (parsedQuantity > 0 && parsedTotalValue > 0) {
      if (parsedTotalValue >= originalTotalValue) {
        setValidationError('O valor com desconto não pode ser maior ou igual ao valor original.');
      } else {
        setValidationError('');
      }
    } else {
      setValidationError('');
    }
  }, [parsedQuantity, parsedTotalValue, originalTotalValue]);

  // Lida com a mudança na quantidade de bilhetes
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Permite apenas números inteiros não negativos na entrada
    if (value === '' || /^\d+$/.test(value)) {
      setTicketQuantity(value);
    }
  };

  // Lida com a mudança no valor total da promoção
  const handleTotalValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatInputCurrency(e.target.value);
    setTotalValueInput(formattedValue);
  };

  // Lida com a adição de uma nova promoção
  const handleAddPromotion = () => {
    // Limpa erros de validação anteriores
    setValidationError('');

    // NOVO: Validação da quantidade de bilhetes para a nova promoção
    if (parsedQuantity <= 0) {
      setValidationError('A quantidade de bilhetes deve ser um número inteiro positivo.');
      return;
    }

    if (parsedQuantity > remainingTicketsForPromotions) {
      setValidationError(`Não há cotas suficientes disponíveis para esta promoção. Restam ${remainingTicketsForPromotions.toLocaleString('pt-BR')} cotas.`);
      return;
    }

    // Garante que a quantidade da promoção não exceda o total de cotas da campanha
    if (parsedQuantity > campaignTotalTickets) {
      setValidationError(`A quantidade de bilhetes da promoção (${parsedQuantity.toLocaleString('pt-BR')}) não pode exceder o total de cotas da campanha (${campaignTotalTickets.toLocaleString('pt-BR')}).`);
      return;
    }

    // Validação existente do preço da promoção
    if (!isValidPromotion) {
      setValidationError('O valor total da promoção deve ser menor que o valor original e maior que zero.');
      return;
    }
    
    // Cria o novo objeto de promoção
    const newPromotion: Promotion = {
      id: Date.now().toString(),
      ticketQuantity: parsedQuantity,
      totalValue: parsedTotalValue,
      originalTotalValue: originalTotalValue,
      promotionalPricePerTicket: parsedTotalValue / parsedQuantity,
    };
    
    // Adiciona a nova promoção à lista local e salva
    const updatedPromotions = [...localPromotions, newPromotion];
    setLocalPromotions(updatedPromotions);
    onSavePromotions(updatedPromotions); // Auto-salva ao adicionar
    
    // Limpa os campos de entrada e o erro após adicionar
    setTicketQuantity('');
    setTotalValueInput('');
    setValidationError(''); 
  };

  // Lida com a exclusão de uma promoção
  const handleDeletePromotion = (id: string) => {
    const updatedPromotions = localPromotions.filter(promotion => promotion.id !== id);
    setLocalPromotions(updatedPromotions);
    onSavePromotions(updatedPromotions); // Auto-salva ao remover
  };

  // Lida com o fechamento do modal
  const handleCloseModal = () => {
    // Reseta o estado dos campos de entrada e erros ao fechar o modal
    setTicketQuantity('');
    setTotalValueInput('');
    setValidationError('');
    onClose();
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto text-white">
        {/* Cabeçalho do Modal */}
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

        {/* NOVO: Informações sobre cotas disponíveis (Funcionalidade 2) */}
        {campaignTotalTickets > 0 && (
          <div className="mb-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg text-sm text-blue-300">
            <p>Total de cotas da campanha: <span className="font-bold">{campaignTotalTickets.toLocaleString('pt-BR')}</span></p>
            <p>Cotas já usadas em promoções: <span className="font-bold">{totalTicketsUsedByExistingPromotions.toLocaleString('pt-BR')}</span></p>
            <p>Cotas restantes para novas promoções: <span className="font-bold">{remainingTicketsForPromotions.toLocaleString('pt-BR')}</span></p>
          </div>
        )}

        {/* Campos de Entrada */}
        <div className="space-y-4 mb-6">
          {/* Quantidade de Bilhetes */}
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

          {/* Valor Total */}
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

          {/* Funcionalidade 1: Exibição Persistente do Valor da Cota */}
          {/* Removido a condição para que o valor da cota seja sempre visível */}
          <div className="text-sm text-gray-300 mb-2">
            Valor cota {formatCurrency(originalTicketPrice)}
          </div>

          {/* Exibição do Cálculo Automático (se houver valores válidos) */}
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

          {/* Mensagem de Erro de Validação */}
          {validationError && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <span className="text-red-300 text-sm">{validationError}</span>
            </div>
          )}
        </div>

        {/* Botão Adicionar */}
        <button
          onClick={handleAddPromotion}
          // Desabilita o botão se não for válido ou se houver um erro de validação
          disabled={!isAddButtonEnabled || !!validationError} 
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2 mb-6"
        >
          <Plus className="h-5 w-5" />
          <span>Adicionar</span>
        </button>

        {/* Lista de Promoções Criadas */}
        {localPromotions.length > 0 && (
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">
              Promoções criadas
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {localPromotions.map((promo) => {
                // Calcula o valor original e a porcentagem de desconto para exibição
                const originalValue = promo.ticketQuantity * originalTicketPrice; 
                const discountPercentage = originalValue > 0 ? Math.round(((originalValue - promo.totalValue) / originalValue) * 100) : 0;
                
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