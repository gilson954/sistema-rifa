import React, { useState } from 'react';
import { Shield, Share2 } from 'lucide-react';
import { useParams, useLocation } from 'react-router-dom';
import QuotaGrid from '../components/QuotaGrid';
import QuotaSelector from '../components/QuotaSelector';
import { useCampaign } from '../hooks/useCampaigns';

const CampaignPage = () => {
  const { campaignId } = useParams();
  const location = useLocation();
  const [selectedQuotas, setSelectedQuotas] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);
  
  const { campaign, loading: campaignLoading } = useCampaign(campaignId || '');
  
  // Get data from location state (for preview mode) or campaign data
  const campaignData = location.state?.previewData || {
    title: campaign?.title || 'Setup Gamer',
    ticketPrice: campaign?.ticket_price || 1.00,
    totalTickets: campaign?.total_tickets || 100,
    image: campaign?.prize_image_urls?.[0] || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    organizer: {
      name: 'Gilson',
      verified: true
    },
    model: (location.state?.campaignModel || campaign?.campaign_model || 'manual') as 'manual' | 'automatic',
    reservedQuotas: [5, 12, 23, 45, 67], // Mock reserved quotas
    purchasedQuotas: [1, 3, 8, 15, 22], // Mock purchased quotas
    promotion: {
      active: true,
      text: 'Compre 4578 cotas por R$ 0,42'
    }
  };

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
        return prev.filter(q => q !== quotaNumber);
      } else {
        return [...prev, quotaNumber];
      }
    });
  };

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
  };

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
        {/* Campaign Image */}
        <div className="relative mb-8">
          <div className="relative rounded-2xl overflow-hidden shadow-xl">
            <img
              src={campaignData.image}
              alt={campaignData.title}
              className="w-full h-64 sm:h-80 lg:h-96 object-cover"
            />
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

        {/* Promotion Banner */}
        {campaignData.promotion.active && (
          <div className="bg-green-500 dark:bg-green-600 text-white rounded-lg p-4 mb-8 transition-colors duration-300">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-lg">🎉</span>
              </div>
              <div>
                <div className="font-semibold">Promoção</div>
                <div className="text-sm opacity-90">{campaignData.promotion.text}</div>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Section */}
        <div>
          {campaignData.model === 'manual' ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 transition-colors duration-300">
              <QuotaGrid
                totalQuotas={campaignData.totalTickets}
                selectedQuotas={selectedQuotas}
                onQuotaSelect={handleQuotaSelect}
                mode="manual"
                reservedQuotas={campaignData.reservedQuotas}
                purchasedQuotas={campaignData.purchasedQuotas}
              />
              
              {/* Selected Quotas Summary */}
              {selectedQuotas.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-center">
                    <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Cotas selecionadas</div>
                    <div className="text-lg font-bold text-blue-700 dark:text-blue-300 mb-2">
                      {selectedQuotas.length} cota{selectedQuotas.length !== 1 ? 's' : ''}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400 mb-3">
                      Números: {selectedQuotas.sort((a, b) => a - b).join(', ')}
                    </div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Total: R$ {(selectedQuotas.length * campaignData.ticketPrice).toFixed(2).replace('.', ',')}
                    </div>
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition-colors duration-200">
                      RESERVAR COTAS SELECIONADAS
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <QuotaSelector
              ticketPrice={campaignData.ticketPrice}
              onQuantityChange={handleQuantityChange}
              initialQuantity={quantity}
              mode="automatic"
            />
          )}
        </div>

        {/* Share Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 transition-colors duration-300 mt-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
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
              <span className="text-gray-700 dark:text-gray-300">LOTERIA FEDERAL</span>
            </div>
          </div>
        </div>
      </div>

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