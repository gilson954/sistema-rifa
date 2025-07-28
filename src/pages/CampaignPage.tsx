import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Shield, Share2, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { useParams, useLocation } from 'react-router-dom';
import QuotaGrid from '../components/QuotaGrid';
import QuotaSelector from '../components/QuotaSelector';
import { useCampaign } from '../hooks/useCampaigns';
import { supabase } from '../lib/supabase';
import { Promotion, Prize } from '../types/promotion';

interface Prize {
  id: string;
  name: string;
}

const CampaignPage = () => {
  const { campaignId } = useParams();
  const location = useLocation();
  const [selectedQuotas, setSelectedQuotas] = useState<number[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'available' | 'reserved' | 'purchased' | 'my-numbers'>('all');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [showPrizesModal, setShowPrizesModal] = useState(false);
  const [primaryColor, setPrimaryColor] = useState<string | null>(null);
  const [campaignTheme, setCampaignTheme] = useState<string>('claro');
  const [organizerName, setOrganizerName] = useState<string>('Organizador');

  const { campaign, loading: campaignLoading } = useCampaign(campaignId || '');
  
  // Funções para obter classes de tema adaptativas
  const getCardBackgroundClasses = (theme: string) => {
    switch (theme) {
      case 'claro':
        return 'bg-white border-gray-200';
      case 'escuro':
        return 'bg-gray-900 border-gray-800';
      case 'escuro-preto':
        return 'bg-gray-900 border-gray-800';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getInnerElementBackgroundClasses = (theme: string) => {
    switch (theme) {
      case 'claro':
        return 'bg-gray-50 border-gray-200';
      case 'escuro':
        return 'bg-gray-800 border-gray-700';
      case 'escuro-preto':
        return 'bg-gray-800 border-gray-700';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextClasses = (theme: string) => {
    switch (theme) {
      case 'claro':
        return {
          primary: 'text-gray-900',
          secondary: 'text-gray-600',
          muted: 'text-gray-500'
        };
      case 'escuro':
      case 'escuro-preto':
        return {
          primary: 'text-white',
          secondary: 'text-gray-300',
          muted: 'text-gray-400'
        };
      default:
        return {
          primary: 'text-gray-900',
          secondary: 'text-gray-600',
          muted: 'text-gray-500'
        };
    }
  };

  // Combine real campaign data with preview data if available
  // Prioritize real campaign data for public viewing, but allow previewData to override specific fields
  const campaignData = {
    // Use real campaign data as base
    ...campaign,
    // Override with previewData if present (for preview of unsaved changes)
    ...(location.state?.previewData || {}),
    // Explicitly ensure description comes from campaign if not in previewData
    description: location.state?.previewData?.description || campaign?.description || '',
    // Ensure images are handled correctly, combining existing and new
    images: location.state?.previewData?.prize_image_urls || campaign?.prize_image_urls || [
      // Fallback mock images if no images are available
      'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/2047905/pexels-photo-2047905.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    // Ensure prizes come from campaign or previewData
    prizes: location.state?.previewData?.prizes || campaign?.prizes || [] as Prize[],
    // Ensure promotions come from campaign or previewData
    promotions: location.state?.previewData?.promotions || campaign?.promotions || [],
    // Ensure other fields like title, ticketPrice, totalTickets, etc. are correctly sourced
    title: location.state?.previewData?.title || campaign?.title || 'Setup Gamer',
    ticketPrice: location.state?.previewData?.ticket_price || campaign?.ticket_price || 1.00,
    totalTickets: location.state?.previewData?.total_tickets || campaign?.total_tickets || 100,
    minTicketsPerPurchase: location.state?.previewData?.min_tickets_per_purchase || campaign?.min_tickets_per_purchase || 1,
    maxTicketsPerPurchase: location.state?.previewData?.max_tickets_per_purchase || campaign?.max_tickets_per_purchase || 1000,
    drawMethod: location.state?.previewData?.draw_method || campaign?.draw_method || 'Loteria Federal',
    showPercentage: location.state?.previewData?.show_percentage || campaign?.show_percentage || false,
    soldTickets: location.state?.previewData?.sold_tickets || campaign?.sold_tickets || 0,
    organizer: {
      name: organizerName,
      verified: true
    },
    model: (location.state?.previewData?.campaign_model || campaign?.campaign_model || 'manual') as 'manual' | 'automatic',
    // Mock reserved/purchased quotas for demonstration if not coming from DB
    reservedQuotas: campaign?.reserved_quotas || [5, 12, 23, 45, 67, 89, 134, 156, 178, 199],
    purchasedQuotas: campaign?.purchased_quotas || [1, 3, 8, 15, 22, 34, 56, 78, 91, 123],
  };

  // Buscar cor principal do organizador da campanha
  useEffect(() => {
    const fetchOrganizerSettings = async () => {
      if (campaignData.user_id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('primary_color, theme, name')
            .eq('id', campaignData.user_id)
            .single();

          if (error) {
            console.error('Error fetching organizer settings:', error);
          } else if (data) {
            if (data.primary_color) {
              setPrimaryColor(data.primary_color);
            }
            if (data.theme) {
              setCampaignTheme(data.theme);
            }
            if (data.name) {
              setOrganizerName(data.name);
            }
          }
        } catch (error) {
          console.error('Error fetching organizer settings:', error);
        }
      }
    };

    fetchOrganizerSettings();
  }, [campaignData.user_id]);

  // --- SISTEMA DE APLICAÇÃO AUTOMÁTICA DE PROMOÇÕES ---

  /**
   * Ordena as promoções pela quantidade de bilhetes para definir as faixas de aplicação
   * Performance: useMemo garante que a ordenação só aconteça quando as promoções mudarem
   */
  const sortedPromotions = useMemo(() => {
    if (!campaignData.promotions || campaignData.promotions.length === 0) {
      return [];
    }
    
    // Filtra promoções válidas e ordena por quantidade crescente
    return [...campaignData.promotions]
      .filter(promo => promo.ticketQuantity > 0 && promo.discountedTotalValue > 0)
      .sort((a, b) => a.ticketQuantity - b.ticketQuantity);
  }, [campaignData.promotions]);

  /**
   * Calcula qual promoção deve ser aplicada baseada na quantidade atual de cotas
   * Regra: Aplica a promoção com maior ticketQuantity que seja <= currentQuantity
   * 
   * Exemplo:
   * - Promoção A: 100 cotas → Aplica de 100 a 299 cotas
   * - Promoção B: 300 cotas → Aplica de 300 a 10.000.000 cotas
   */
  const getApplicablePromotion = useCallback((currentQuantity: number): Promotion | null => {
    if (!sortedPromotions || sortedPromotions.length === 0 || currentQuantity <= 0) {
      return null;
    }

    // Encontra a melhor promoção aplicável
    let bestPromotion: Promotion | null = null;

    for (const promo of sortedPromotions) {
      if (currentQuantity >= promo.ticketQuantity) {
        bestPromotion = promo; // Continua procurando por uma promoção melhor
      } else {
        break; // Como está ordenado, não há mais promoções aplicáveis
      }
    }

    return bestPromotion;
  }, [sortedPromotions]);

  /**
   * Calcula o valor total considerando promoções aplicáveis
   * Aplica valor promocional para o bloco de cotas da promoção e preço original para cotas excedentes
   */
  const calculateTotalWithPromotion = useMemo(() => {
    const currentQuantity = campaignData.model === 'automatic' ? quantity : selectedQuotas.length;
    const applicablePromotion = getApplicablePromotion(currentQuantity);

    if (applicablePromotion) {
      // Calcula o valor total: valor promocional + cotas excedentes com preço original
      const promotionBlockCost = applicablePromotion.discountedTotalValue;
      const excessTickets = currentQuantity - applicablePromotion.ticketQuantity;
      const excessCost = excessTickets > 0 ? excessTickets * campaignData.ticketPrice : 0;
      
      return promotionBlockCost + excessCost;
    }
    
    // Caso contrário, retorna o valor normal (quantidade * preço original)
    return currentQuantity * campaignData.ticketPrice;
  }, [quantity, selectedQuotas.length, campaignData.model, campaignData.ticketPrice, getApplicablePromotion]);

  /**
   * Calcula informações sobre a promoção aplicada (para exibição na UI)
   */
  const promotionInfo = useMemo(() => {
    const currentQuantity = campaignData.model === 'automatic' ? quantity : selectedQuotas.length;
    const applicablePromotion = getApplicablePromotion(currentQuantity);

    if (!applicablePromotion) {
      return null;
    }

    const originalTotal = currentQuantity * campaignData.ticketPrice;
    
    // Calcula o valor promocional: valor da promoção + cotas excedentes com preço original
    const promotionBlockCost = applicablePromotion.discountedTotalValue;
    const excessTickets = currentQuantity - applicablePromotion.ticketQuantity;
    const excessCost = excessTickets > 0 ? excessTickets * campaignData.ticketPrice : 0;
    const promotionalTotal = promotionBlockCost + excessCost;
    
    const savings = originalTotal - promotionalTotal;
    const discountPercentage = Math.round((savings / originalTotal) * 100);

    return {
      promotion: applicablePromotion,
      originalTotal,
      promotionalTotal,
      savings,
      discountPercentage
    };
  }, [quantity, selectedQuotas.length, campaignData.model, campaignData.ticketPrice, getApplicablePromotion]);

  // --- FIM DO SISTEMA DE PROMOÇÕES ---

  // Initialize quantity with minimum tickets per purchase
  React.useEffect(() => {
    if (campaignData.model === 'automatic') {
      setQuantity(campaignData.minTicketsPerPurchase);
    }
  }, [campaignData.minTicketsPerPurchase, campaignData.model]);

  if (campaignLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const handleQuotaSelect = (quotaNumber: number) => {
    setSelectedQuotas(prev => {
      if (prev.includes(quotaNumber)) {
        // Remove da seleção se já estiver selecionada
        return prev.filter(q => q !== quotaNumber);
      } else {
        // Adiciona à seleção se não estiver selecionada
        return [...prev, quotaNumber];
      }
    });
  };

  const handleFilterChange = (filter: 'all' | 'available' | 'reserved' | 'purchased' | 'my-numbers') => {
    setActiveFilter(filter);
  };

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
  };

  const handleMainImageClick = () => {
    setIsLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setIsLightboxOpen(false);
  };

  const handlePreviousImage = () => {
    setCurrentImageIndex(prev => 
      prev === 0 ? campaignData.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => 
      prev === campaignData.images.length - 1 ? 0 : prev + 1
    );
  };

  const handlePromotionClick = (promo: any) => {
    console.log('Promoção clicada:', promo);
    
    if (campaignData.model === 'automatic') {
      // Para modelo automático: atualiza a quantidade no seletor
      setQuantity(promo.ticketQuantity);
      
      // Scroll suave para o seletor de cotas para mostrar a atualização
      const quotaSelector = document.querySelector('.quota-selector');
      if (quotaSelector) {
        quotaSelector.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
      
      // Feedback visual opcional - você pode adicionar uma notificação toast aqui
      console.log(`Quantidade atualizada para ${promo.ticketQuantity} bilhetes`);
      
    } else if (campaignData.model === 'manual') {
      // Para modelo manual: seleciona automaticamente as primeiras cotas disponíveis
      const availableQuotas = [];
      
      // Encontra as primeiras cotas disponíveis
      for (let i = 0; i < campaignData.totalTickets && availableQuotas.length < promo.ticketQuantity; i++) {
        const quotaNumber = i;
        const isAvailable = !campaignData.reservedQuotas.includes(quotaNumber) && 
                           !campaignData.purchasedQuotas.includes(quotaNumber) &&
                           !selectedQuotas.includes(quotaNumber);
        
        if (isAvailable) {
          availableQuotas.push(quotaNumber);
        }
      }
      
      // Adiciona as cotas encontradas à seleção
      if (availableQuotas.length > 0) {
        setSelectedQuotas(prev => [...prev, ...availableQuotas]);
        
        // Scroll para a grade de cotas
        const quotaGrid = document.querySelector('.quota-grid');
        if (quotaGrid) {
          quotaGrid.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
        
        console.log(`${availableQuotas.length} cotas selecionadas automaticamente`);
      } else {
        // Não há cotas suficientes disponíveis
        console.warn('Não há cotas suficientes disponíveis para esta promoção');
        // Aqui você poderia mostrar uma mensagem de erro para o usuário
      }
    }
  };

  const formatCurrency = (value: number) => {
    // Verificação de segurança para valores inválidos
    if (value === null || value === undefined || isNaN(value)) {
      return 'R$ 0,00';
    }
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  // Função para obter as classes de fundo baseadas no tema
  const getThemeBackgroundClasses = (theme: string) => {
    switch (theme) {
      case 'claro':
        return 'bg-gray-50';
      case 'escuro':
        return 'bg-gray-950';
      case 'escuro-preto':
        return 'bg-black';
      default:
        return 'bg-gray-50'; // Fallback para tema claro
    }
  };

  const currentImage = campaignData.images[currentImageIndex];
  return (
    <div 
      className={`min-h-screen ${getThemeBackgroundClasses(campaignTheme)} transition-colors duration-300`}
      style={{ '--primary-color': primaryColor || '#3B82F6' } as React.CSSProperties}
    >
      {/* Demo Banner */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 py-4 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-2 text-yellow-800 dark:text-yellow-200">
            <span className="text-lg">🔒</span>
            <div className="text-center">
              <div className="font-semibold">Modo de Demonstração</div>
              <div className="text-sm">Para liberar sua campanha e iniciar sua divulgação, conclua o pagamento.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Campaign Images Gallery */}
        <div className="relative mb-8">
          {/* Main Image */}
          <div className="relative rounded-2xl overflow-hidden shadow-xl group cursor-pointer" onClick={handleMainImageClick}>
            <img
              src={currentImage}
              alt={campaignData.title}
              className="w-full h-64 sm:h-80 lg:h-96 object-cover"
            />
            
            {/* Zoom Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white dark:bg-gray-900 rounded-full p-3 shadow-lg">
                <ZoomIn className="h-6 w-6 text-gray-900 dark:text-white" />
              </div>
            </div>
            
            {/* Navigation Arrows (only show if multiple images) */}
            {campaignData.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviousImage();
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            
            {/* Image Counter */}
            {campaignData.images.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {campaignData.images.length}
              </div>
            )}
            
            {/* Price Tag */}
            <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-900 px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-white">Participe por apenas</span>
                <span 
                  className="font-bold text-lg"
                  style={{ color: primaryColor || '#3B82F6' }}
                >
                  R$ {campaignData.ticketPrice.toFixed(2).replace('.', ',')}
                </span>
                {promotionInfo && (
                  <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                    OFERTA
                  </span>
                )}
                <span className="text-lg">🔥</span>
              </div>
            </div>
          </div>
          
          {/* Thumbnails Strip (only show if multiple images) */}
          {campaignData.images.length > 1 && (
            <div className="mt-4 flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
              {campaignData.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => handleThumbnailClick(index)}
                  className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    index === currentImageIndex
                      ? 'border-purple-500 opacity-100 ring-2 ring-purple-200 dark:ring-purple-800'
                      : 'border-gray-300 dark:border-gray-600 opacity-70 hover:opacity-90 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${campaignData.title} - Imagem ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Campaign Title */}
        <h1 className={`text-3xl sm:text-4xl font-bold ${getTextClasses(campaignTheme).primary} mb-6 text-center transition-colors duration-300`}>
          {campaignData.title}
        </h1>

        {/* Organizer Info */}
        <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center space-x-3 px-6 py-3 rounded-lg shadow-md border transition-colors duration-300 ${getCardBackgroundClasses(campaignTheme)}`}>
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: primaryColor || '#3B82F6' }}
            >
              {campaignData.organizer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className={`text-sm ${getTextClasses(campaignTheme).secondary}`}>Organizado por:</div>
              <div className="flex items-center space-x-2">
                <span className={`font-semibold ${getTextClasses(campaignTheme).primary}`}>{campaignData.organizer.name}</span>
                {campaignData.organizer.verified && (
                  <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                    <Shield className="h-3 w-3" />
                    <span>Suporte</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {campaignData.promotions && campaignData.promotions.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sortedPromotions.map((promo) => {
                // Calcular porcentagem de desconto
                const originalValue = promo.ticketQuantity * campaignData.ticketPrice;
                const discountPercentage = Math.round((promo.fixedDiscountAmount / originalValue) * 100);
                
                return (
                  <button
                    key={promo.id}
                    onClick={() => handlePromotionClick(promo)}
                    className={`relative text-white rounded-lg p-4 hover:brightness-90 transition-all duration-200 border ${getTextClasses(campaignTheme).muted === 'text-gray-500' ? 'border-gray-300' : 'border-gray-600'} group`}
                    style={{ backgroundColor: primaryColor || '#3B82F6' }}
                  >
                    {/* Badge de desconto */}
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      –{discountPercentage}%
                    </div>
                    
                    {/* Texto principal */}
                    <div className="text-center">
                      <div className="text-sm font-semibold">
                        {promo.ticketQuantity} cotas por {formatCurrency(promo.discountedTotalValue)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Purchase Section */}
        <div>
          {campaignData.model === 'manual' ? (
            <div className={`rounded-2xl shadow-xl p-6 sm:p-8 border transition-colors duration-300 ${getCardBackgroundClasses(campaignTheme)}`}>
              <QuotaGrid
                totalQuotas={campaignData.totalTickets}
                selectedQuotas={selectedQuotas}
                onQuotaSelect={handleQuotaSelect}
                activeFilter={activeFilter}
                onFilterChange={handleFilterChange}
                mode="manual"
                reservedQuotas={campaignData.reservedQuotas}
                purchasedQuotas={campaignData.purchasedQuotas}
                campaignTheme={campaignTheme}
                primaryColor={primaryColor}
              />
              
              {/* Contador e Lista de Cotas Selecionadas */}
              {selectedQuotas.length > 0 && (
                <div className="mt-6 space-y-4">
                  {/* Contador X/Y */}
                  <div className="text-center">
                    <span className={`text-lg font-semibold ${getTextClasses(campaignTheme).primary}`}>
                      {selectedQuotas.length}/{campaignData.totalTickets}
                    </span>
                  </div>
                  
                  {/* Lista de Cotas Selecionadas */}
                  <div className={`p-4 rounded-lg border ${getInnerElementBackgroundClasses(campaignTheme)}`}>
                    <div className="text-center">
                      <div 
                        className="text-sm mb-2"
                        style={{ color: primaryColor || '#3B82F6' }}
                      >
                        Meus N°: {selectedQuotas
                          .sort((a, b) => a - b)
                          .map(quota => quota.toString().padStart(campaignData.totalTickets.toString().length, '0'))
                          .join(', ')}
                      </div>
                      {/* Exibição do preço com promoção aplicada */}
                      {promotionInfo && (
                        <div className={`text-sm ${getTextClasses(campaignTheme).secondary} mb-2`}>
                          <span className="line-through">R$ {(selectedQuotas.length * campaignData.ticketPrice).toFixed(2).replace('.', ',')}</span>
                          <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                            Economia: {formatCurrency(promotionInfo.savings)}
                          </span>
                        </div>
                      )}
                      <div className={`text-xl font-bold ${getTextClasses(campaignTheme).primary} mb-4`}>
                        Total: R$ {(promotionInfo ? promotionInfo.promotionalTotal : selectedQuotas.length * campaignData.ticketPrice).toFixed(2).replace('.', ',')}
                      </div>
                      <button 
                        className="w-full text-white py-3 rounded-lg font-bold hover:brightness-90 transition-all duration-200"
                        style={{ backgroundColor: primaryColor || '#3B82F6' }}
                      >
                        RESERVAR COTAS SELECIONADAS
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <QuotaSelector
                ticketPrice={campaignData.ticketPrice}
                minTicketsPerPurchase={campaignData.minTicketsPerPurchase}
                maxTicketsPerPurchase={campaignData.maxTicketsPerPurchase}
                onQuantityChange={handleQuantityChange}
                initialQuantity={quantity}
                mode="automatic"
                promotionInfo={promotionInfo}
                primaryColor={primaryColor}
                campaignTheme={campaignTheme}
              />
            </div>
          )}
        </div>

        {/* Prizes Button */}
        <div className="flex justify-center mb-8">
          <button 
            onClick={() => setShowPrizesModal(true)}
            className="text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 shadow-md hover:brightness-90"
            style={{ backgroundColor: primaryColor || '#3B82F6' }}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <span className="text-black text-sm">🏆</span>
            </div>
            <span>Prêmios</span>
          </button>
        </div>

        {/* Progress Percentage */}
        {campaignData.showPercentage && (
          <div className="flex justify-center mb-8">
            <div className="w-full max-w-md mx-auto">
              <div className={`rounded-2xl p-6 border transition-colors duration-300 shadow-lg ${getCardBackgroundClasses(campaignTheme)}`}>
                {/* Progress Text */}
                <div className="text-center mb-4">
                  <div className={`text-2xl font-bold ${getTextClasses(campaignTheme).primary} mb-1`}>
                    {Math.round((campaignData.soldTickets / campaignData.totalTickets) * 100)}% concluído
                  </div>
                </div>
                
                {/* Progress Bar Container */}
                <div className="relative">
                  {/* Background Track */}
                  <div className={`w-full h-4 rounded-full overflow-hidden shadow-inner ${campaignTheme === 'claro' ? 'bg-gray-200' : 'bg-gray-700'}`}>
                    {/* Progress Fill */}
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                      style={{ 
                        width: `${Math.round((campaignData.soldTickets / campaignData.totalTickets) * 100)}%`,
                        minWidth: Math.round((campaignData.soldTickets / campaignData.totalTickets) * 100) > 0 ? '8px' : '0px',
                        backgroundColor: primaryColor || '#3B82F6'
                      }}
                    >
                      {/* Shine Effect */}
                      <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* Progress Indicator Dot */}
                  {Math.round((campaignData.soldTickets / campaignData.totalTickets) * 100) > 0 && (
                    <div 
                      className={`absolute top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full shadow-lg transition-all duration-1000 ease-out ${campaignTheme === 'claro' ? 'bg-white' : 'bg-gray-900'}`}
                      style={{ 
                        left: `calc(${Math.round((campaignData.soldTickets / campaignData.totalTickets) * 100)}% - 12px)`,
                        maxLeft: 'calc(100% - 24px)',
                        borderColor: primaryColor || '#3B82F6',
                        borderWidth: '4px'
                      }}
                    >
                      <div 
                        className="w-full h-full rounded-full animate-pulse"
                        style={{ backgroundColor: primaryColor || '#3B82F6' }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Description Section - REPOSITIONED AFTER PURCHASE SECTION */}
        {campaignData.description && campaignData.description.trim() && (
          <div className={`mb-8 rounded-lg p-6 border transition-colors duration-300 ${getCardBackgroundClasses(campaignTheme)}`}>
            <h2 className={`text-xl font-bold ${getTextClasses(campaignTheme).primary} mb-4 flex items-center`}>
              <span className="mr-2">📜</span>
              Descrição / Regulamento
            </h2>
            {/* Debug log to check description content */}
            {console.log('Descrição recebida por CampaignPage:', campaignData.description)}
            <div
              className={`leading-relaxed prose prose-sm max-w-none ${getTextClasses(campaignTheme).secondary} ${campaignTheme !== 'claro' ? 'dark:prose-invert' : ''}`}
              dangerouslySetInnerHTML={{ __html: campaignData.description }}
            />
          </div>
        )}

        {/* Share Section */}
        <div className={`rounded-2xl shadow-xl p-6 sm:p-8 border transition-colors duration-300 mt-8 ${getCardBackgroundClasses(campaignTheme)}`}>
          <h2 className={`text-xl font-bold ${getTextClasses(campaignTheme).primary} mb-6 text-center`}>
            Compartilhar
          </h2>
          
          <div className="flex justify-center space-x-4">
            {/* Facebook */}
            <button className="w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors duration-200">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
            
            {/* Telegram */}
            <button className="w-12 h-12 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors duration-200">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </button>
            
            {/* WhatsApp */}
            <button className="w-12 h-12 bg-green-500 hover:bg-green-600 rounded-lg flex items-center justify-center transition-colors duration-200">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
            </button>
            
            {/* X (Twitter) */}
            <button className="w-12 h-12 bg-black hover:bg-gray-800 rounded-lg flex items-center justify-center transition-colors duration-200">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Payment and Draw Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
          {/* Payment Method */}
          <div className={`${getCardBackgroundClasses(campaignTheme)} rounded-lg p-6 transition-colors duration-300`}>
            <h3 className={`font-semibold ${getTextClasses(campaignTheme).primary} mb-3`}>MÉTODO DE PAGAMENTO</h3>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">₽</span>
              </div>
              <span className={getTextClasses(campaignTheme).secondary}>PIX</span>
            </div>
          </div>

          {/* Draw Method */}
          <div className={`${getCardBackgroundClasses(campaignTheme)} rounded-lg p-6 transition-colors duration-300`}>
            <h3 className={`font-semibold ${getTextClasses(campaignTheme).primary} mb-3`}>SORTEIO</h3>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🎲</span>
              </div>
              <span className={getTextClasses(campaignTheme).secondary}>{campaignData.drawMethod.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          {/* Close Button */}
          <button
            onClick={handleCloseLightbox}
            className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all duration-200"
          >
            <X className="h-6 w-6" />
          </button>
          
          {/* Image Counter */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
            {currentImageIndex + 1} / {campaignData.images.length}
          </div>
          
          {/* Main Lightbox Image */}
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <img
              src={currentImage}
              alt={`${campaignData.title} - Imagem ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Navigation Arrows (only show if multiple images) */}
            {campaignData.images.length > 1 && (
              <>
                <button
                  onClick={handlePreviousImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all duration-200"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all duration-200"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </>
            )}
          </div>
          
          {/* Thumbnail Navigation */}
          {campaignData.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black bg-opacity-50 p-3 rounded-lg">
              {campaignData.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    index === currentImageIndex
                      ? 'border-white opacity-100'
                      : 'border-gray-400 opacity-60 hover:opacity-80'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Prizes Modal */}
      {showPrizesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto text-white">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <span className="text-black text-lg">🏆</span>
                </div>
                <h2 className="text-xl font-semibold">Prêmios</h2>
              </div>
              <button
                onClick={() => setShowPrizesModal(false)}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {campaignData.prizes && campaignData.prizes.length > 0 && (
              <p className="text-gray-400 mb-6">
                Esses são os prêmios no sorteio <span className="text-white font-semibold">{campaignData.title}</span>
              </p>
            )}

            {/* Prizes List */}
            <div className="space-y-4">
              {campaignData.prizes.map((prize, index) => (
                <div
                  key={prize.id}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl font-bold text-blue-400 flex-shrink-0">
                      {index + 1}°
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm leading-relaxed">
                        {prize.name}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {campaignData.prizes.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏆</span>
                </div>
                <p className="text-gray-400">Nenhum prêmio adicionado ainda</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-8 mt-16 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                Termos de Uso
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                Política de Privacidade
              </a>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>Sistema desenvolvido por</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-white">Rifaqui</span>
                <img 
                  src="/32132123.png" 
                  alt="Rifaqui Logo" 
                  className="w-6 h-6 object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CampaignPage;