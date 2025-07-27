import React, { useState } from 'react';
import { Shield, Share2, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { useParams, useLocation } from 'react-router-dom';
import QuotaGrid from '../components/QuotaGrid';
import QuotaSelector from '../components/QuotaSelector';
import CampaignStats from '../components/CampaignStats';
import ShareButtons from '../components/ShareButtons';
import CampaignSecurity from '../components/CampaignSecurity';
import RecentWinners from '../components/RecentWinners';
import { useCampaign } from '../hooks/useCampaigns';

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

  const { campaign, loading: campaignLoading } = useCampaign(campaignId || '');
  
  // Get data from location state (for preview mode) or campaign data
  const campaignData = location.state?.previewData || {
    title: campaign?.title || 'Setup Gamer',
    ticketPrice: campaign?.ticket_price || 1.00,
    totalTickets: campaign?.total_tickets || 100,
    minTicketsPerPurchase: campaign?.min_tickets_per_purchase || 1,
    maxTicketsPerPurchase: campaign?.max_tickets_per_purchase || 1000,
    drawMethod: campaign?.draw_method || 'Loteria Federal',
    images: campaign?.prize_image_urls || [
      'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/2047905/pexels-photo-2047905.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    organizer: {
      name: 'Gilson',
      verified: true
    },
    model: (location.state?.campaignModel || campaign?.campaign_model || 'manual') as 'manual' | 'automatic',
    reservedQuotas: [5, 12, 23, 45, 67, 89, 134, 156, 178, 199], // Mock reserved quotas
    purchasedQuotas: [1, 3, 8, 15, 22, 34, 56, 78, 91, 123], // Mock purchased quotas
    prizes: [
      { id: '1', name: 'SETUP VIRADA DE GAME 6.0! 💎💎 I9-14900K + RTX 5090 + PS5 + SETUP COMPLETO (SORTEIO)' },
      { id: '2', name: 'iPhone 15 Pro Max 256GB' },
      { id: '3', name: 'Notebook Gamer RTX 4060' }
    ] as Prize[] // Mock prizes data
  };

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

  const currentImage = campaignData.images[currentImageIndex];
  
  // Generate campaign URL for sharing
  const campaignUrl = `${window.location.origin}/c/${campaignId}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
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
                <span className="text-sm text-gray-600 dark:text-gray-400">Participe por apenas</span>
                <span className="font-bold text-lg text-purple-600 dark:text-purple-400">
                  R$ {campaignData.ticketPrice.toFixed(2).replace('.', ',')}
                </span>
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
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6 text-center transition-colors duration-300">
          {campaignData.title}
        </h1>

        {/* Organizer Info */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-3 bg-white dark:bg-gray-900 px-6 py-3 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 transition-colors duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {campaignData.organizer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Organizado por:</div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900 dark:text-white">{campaignData.organizer.name}</span>
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

        {/* Campaign Statistics */}
        <CampaignStats
          totalTickets={campaignData.totalTickets}
          soldTickets={campaignData.reservedQuotas.length + campaignData.purchasedQuotas.length}
          ticketPrice={campaignData.ticketPrice}
          status="active"
          endDate={campaign?.end_date}
        />

        {campaignData.promotions && campaignData.promotions.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {campaignData.promotions.map((promo) => {
                // Calcular porcentagem de desconto
                const originalValue = promo.ticketQuantity * campaignData.ticketPrice;
                const discountPercentage = Math.round(((originalValue - promo.totalValue) / originalValue) * 100);
                
                return (
                  <button
                    key={promo.id}
                    onClick={() => handlePromotionClick(promo)}
                    className="relative bg-gray-900 dark:bg-gray-800 text-white rounded-lg p-4 hover:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-700 dark:border-gray-600 group"
                  >
                    {/* Badge de desconto */}
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      –{discountPercentage}%
                    </div>
                    
                    {/* Texto principal */}
                    <div className="text-center">
                      <div className="text-sm font-semibold">
                        {promo.ticketQuantity} cotas por {formatCurrency(promo.totalValue)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Prizes Button */}
        <div className="flex justify-center mb-8">
          <button 
            onClick={() => setShowPrizesModal(true)}
            className="bg-gray-700 dark:bg-gray-800 hover:bg-gray-600 dark:hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 shadow-md"
          >
            <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-black text-sm">🏆</span>
            </div>
            <span>Prêmios</span>
          </button>
        </div>

        {/* Purchase Section */}
        <div>
          {campaignData.model === 'manual' ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 transition-colors duration-300">
              <QuotaGrid
                totalQuotas={campaignData.totalTickets}
                selectedQuotas={selectedQuotas}
                onQuotaSelect={handleQuotaSelect}
                activeFilter={activeFilter}
                onFilterChange={handleFilterChange}
                mode="manual"
                reservedQuotas={campaignData.reservedQuotas}
                purchasedQuotas={campaignData.purchasedQuotas}
              />
              
              {/* Contador e Lista de Cotas Selecionadas */}
              {selectedQuotas.length > 0 && (
                <div className="mt-6 space-y-4">
                  {/* Contador X/Y */}
                  <div className="text-center">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedQuotas.length}/{campaignData.totalTickets}
                    </span>
                  </div>
                  
                  {/* Lista de Cotas Selecionadas */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-center">
                      <div className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                        Meus N°: {selectedQuotas
                          .sort((a, b) => a - b)
                          .map(quota => quota.toString().padStart(campaignData.totalTickets.toString().length, '0'))
                          .join(', ')}
                      </div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        Total: R$ {(selectedQuotas.length * campaignData.ticketPrice).toFixed(2).replace('.', ',')}
                      </div>
                      <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition-colors duration-200">
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
              />
              
              {/* Contador para modo automático */}
              <div className="mt-6 text-center">
                <div className="text-center">
                  <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Cotas selecionadas</div>
                  <div className="text-lg font-bold text-blue-700 dark:text-blue-300 mb-2">
                    {selectedQuotas.length} cota{selectedQuotas.length !== 1 ? 's' : ''}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400 mb-3">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {quantity}/{campaignData.totalTickets}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Description / Regulation Section */}
        {campaignData.description && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 transition-colors duration-300 mt-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              📜 Descrição / Regulamento
            </h2>
            <div 
              className="text-gray-700 dark:text-gray-300 leading-relaxed" 
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {campaignData.description}
            </div>
          </div>
        )}

        {/* Share Buttons Component */}
        <ShareButtons 
          campaignUrl={campaignUrl}
          campaignTitle={campaignData.title}
        />

        {/* Security and Transparency */}
        <CampaignSecurity
          organizerName={campaignData.organizer.name}
          drawMethod={campaignData.drawMethod}
          isVerified={campaignData.organizer.verified}
        />

        {/* Recent Winners */}
        <RecentWinners />

        {/* Payment and Draw Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
          {/* Payment Method */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 transition-colors duration-300">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">MÉTODO DE PAGAMENTO</h3>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">₽</span>
              </div>
              <span className="text-gray-700 dark:text-gray-300">PIX</span>
            </div>
          </div>

          {/* Draw Method */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 transition-colors duration-300">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">SORTEIO</h3>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🎲</span>
              </div>
              <span className="text-gray-700 dark:text-gray-300">{campaignData.drawMethod.toUpperCase()}</span>
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
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
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
      
      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default CampaignPage;