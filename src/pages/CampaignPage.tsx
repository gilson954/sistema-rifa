import React, { useState, useCallback, useEffect } from 'react';
import {
  Share2,
  Calendar,
  Users,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Eye,
  Gift,
  ExternalLink,
  AlertTriangle,
  FileText,
  Ticket,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';
import { useCampaignByPublicId, useCampaignByCustomDomain } from '../hooks/useCampaigns';
import { useTickets } from '../hooks/useTickets';
import { useCampaignWinners } from '../hooks/useCampaignWinners';
import QuotaGrid from '../components/QuotaGrid';
import QuotaSelector from '../components/QuotaSelector';
import ReservationModal, { CustomerData } from '../components/ReservationModal';
import ReservationStep1Modal from '../components/ReservationStep1Modal';
import ReservationStep2Modal from '../components/ReservationStep2Modal';
import PrizesDisplayModal from '../components/PrizesDisplayModal';
import CotasPremiadasPublicModal from '../components/CotasPremiadasPublicModal';
import CampaignFooter from '../components/CampaignFooter';
import PhoneLoginModal from '../components/PhoneLoginModal';
import { CustomerData as ExistingCustomer } from '../utils/customerCheck';
import { Promotion } from '../types/promotion';
import { CotaPremiada } from '../types/cotasPremiadas';
import { formatCurrency } from '../utils/currency';
import { calculateTotalWithPromotions } from '../utils/currency';
import { socialMediaConfig, shareSectionConfig } from '../components/SocialMediaIcons';
import { supabase } from '../lib/supabase';
import { CotasPremiadasAPI } from '../lib/api/cotasPremiadas';

interface PromotionInfo {
  promotion: Promotion;
  originalTotal: number;
  promotionalTotal: number;
  savings: number;
  discountPercentage: number;
}

interface OrganizerProfile {
  id: string;
  name: string;
  avatar_url?: string;
  logo_url?: string;
  social_media_links?: any;
  payment_integrations_config?: any;
  primary_color?: string;
  theme?: string;
  color_mode?: string;
  gradient_classes?: string;
  custom_gradient_colors?: string;
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('pt-BR').format(num);
};

const maskPhoneNumber = (phone: string | null): string => {
  if (!phone) return 'Não informado';

  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 13) {
    return `(${cleaned.substring(0, 2        )}

        {/* Promoções */}
        {!isCampaignCompleted && campaign.promotions && Array.isArray(campaign.promotions) && campaign.promotions.length > 0 && (
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-6 mb-4 max-w-3xl mx-auto`}
          >
            <div className="text-center mb-6">
              <h2 className={`text-3xl md:text-4xl font-extrabold ${themeClasses.text} mb-3`}>
                🎁 Promoções Disponíveis!
              </h2>
              <p className={`text-base md:text-lg ${themeClasses.textSecondary} font-medium`}>
                Aproveite os pacotes promocionais e aumente suas chances de ganhar!
              </p>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              {campaign.promotions.map((promo: Promotion) => {
                const originalValue = promo.ticketQuantity * campaign.ticket_price;
                const discountPercentage = originalValue > 0 ? Math.round((promo.fixedDiscountAmount / originalValue) * 100) : 0;
                const colorMode = organizerProfile?.color_mode || 'solid';

                return (
                  <div key={promo.id}>
                    {colorMode === 'gradient' ? (
                      <div
                        className={getColorClassName("p-0.5 rounded-lg shadow-sm")}
                        style={getColorStyle(true)}
                      >
                        <button
                          type="button"
                          onClick={() => handlePromotionClick(promo.ticketQuantity)}
                          className={`flex items-center justify-between min-w-[220px] max-w-xs px-4 py-2 rounded-lg transition-all duration-150 hover:scale-105 ${
                            themeClasses.cardBg
                          }`}
                        >
                          <span className={`text-sm font-bold ${themeClasses.text} truncate`}>
                            {promo.ticketQuantity} cotas por {formatCurrency(originalValue - promo.fixedDiscountAmount)}
                          </span>
                          <span className="ml-3 text-sm font-extrabold text-green-500 dark:text-green-300">
                            {discountPercentage}%
                          </span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePromotionClick(promo.ticketQuantity)}
                        className={`flex items-center justify-between min-w-[220px] max-w-xs px-4 py-2 rounded-lg transition-all duration-150 shadow-sm border-2 hover:scale-105 hover:shadow-md`}
                        style={{
                          background: 'transparent',
                          borderColor: organizerProfile?.primary_color || (campaignTheme === 'claro' ? '#d1d5db' : '#4b5563')
                        }}
                      >
                        <span className={`text-sm font-bold ${themeClasses.text} truncate`}>
                          {promo.ticketQuantity} cotas por {formatCurrency(originalValue - promo.fixedDiscountAmount)}
                        </span>
                        <span className="ml-3 text-sm font-extrabold text-green-500 dark:text-green-300">
                          {discountPercentage}%
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Compra/seleção de cota */}
        {!isCampaignCompleted && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4 mb-4 max-w-3xl mx-auto`}
        >
          {campaign.campaign_model === 'manual' ? (
            <div className="space-y-4">
              {!isCampaignAvailable && (
                <div className="bg-gray-900 border border-orange-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-6 w-6 text-orange-400 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-orange-300 mb-1">
                        Campanha Indisponível
                      </h4>
                      <p className="text-sm text-orange-400">
                        Sua campanha está indisponível. Realize o pagamento da taxa para ativá-la!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <QuotaGrid
                totalQuotas={campaign.total_tickets}
                selectedQuotas={selectedQuotas}
                onQuotaSelect={isCampaignAvailable ? handleQuotaSelect : undefined}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                mode="manual"
                tickets={tickets}
                currentUserId={user?.id}
                campaignTheme={campaignTheme}
                primaryColor={primaryColor}
                colorMode={organizerProfile?.color_mode}
                gradientClasses={organizerProfile?.gradient_classes}
                customGradientColors={organizerProfile?.custom_gradient_colors}
              />

              {selectedQuotas.length > 0 && (
                <div className={`${themeClasses.background} rounded-xl p-4 border ${themeClasses.border}`}>
                  <h3 className={`text-base font-bold ${themeClasses.text} mb-3`}>
                    Cotas Selecionadas
                  </h3>
                  
                  <div className="mb-3">
                    <div className={`text-sm ${themeClasses.textSecondary} mb-2`}>
                      Números selecionados:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedQuotas.sort((a, b) => a - b).map(quota => (
                        <span
                          key={quota}
                          className={getColorClassName("px-2 py-1 text-white rounded text-xs font-medium")}
                          style={getColorStyle(true)}
                        >
                          {quota.toString().padStart(3, '0')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {currentPromotionInfo && (
                    <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="text-center">
                        <div className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                          🎉 Promoção Aplicada: {currentPromotionInfo.discountPercentage}% OFF
                        </div>
                        <div className="text-xs text-green-700 dark:text-green-300">
                          Economia de {formatCurrency(currentPromotionInfo.savings)}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-6">
                    <span className={`font-medium ${themeClasses.text}`}>
                      {selectedQuotas.length} {selectedQuotas.length === 1 ? 'cota' : 'cotas'}
                    </span>
                    <div className="text-right">
                      {currentPromotionInfo && (
                        <div className={`text-xs ${themeClasses.textSecondary} line-through`}>
                          {formatCurrency(currentPromotionInfo.originalTotal)}
                        </div>
                      )}
                      <div
                        className={currentPromotionInfo ? 'text-xl font-bold text-green-600' : getColorClassName('text-xl font-bold')}
                        style={!currentPromotionInfo ? getColorStyle(true, true) : {}}
                      >
                        {formatCurrency(getCurrentTotalValue())}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleOpenReservationModal}
                    disabled={selectedQuotas.length === 0}
                    className={getColorClassName("w-full text-white py-3 rounded-xl font-bold text-base transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed")}
                    style={getColorStyle(true)}
                  >
                    {isCampaignAvailable ? 'Reservar Cotas Selecionadas' : 'Campanha Indisponível'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {!isCampaignAvailable && (
                <div className="bg-gray-900 border border-orange-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-6 w-6 text-orange-400 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-orange-300 mb-1">
                        Campanha Indisponível
                      </h4>
                      <p className="text-sm text-orange-400">
                        Sua campanha está indisponível. Realize o pagamento da taxa para ativá-la!
                      </p>
                    </div>
                  </div>
                </div>
              )}

            <QuotaSelector
              ticketPrice={campaign.ticket_price}
              minTicketsPerPurchase={campaign.min_tickets_per_purchase || 1}
              maxTicketsPerPurchase={campaign.max_tickets_per_purchase || 20000}
              onQuantityChange={handleQuantityChange}
              initialQuantity={Math.max(1, campaign.min_tickets_per_purchase || 1)}
              mode="automatic"
              promotionInfo={currentPromotionInfo}
              promotions={campaign.promotions || []}
              primaryColor={primaryColor}
              campaignTheme={campaignTheme}
              onReserve={isCampaignAvailable ? handleOpenReservationModal : undefined}
              reserving={reserving}
              disabled={!isCampaignAvailable}
              colorMode={organizerProfile?.color_mode}
              gradientClasses={organizerProfile?.gradient_classes}
              customGradientColors={organizerProfile?.custom_gradient_colors}
            />
            </>
          )}
        </motion.section>
        )}

        {/* Descrição */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4 mb-4 max-w-3xl mx-auto`}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <FileText className={`h-5 w-5 ${themeClasses.text}`} />
            <h3 className={`text-lg font-bold ${themeClasses.text}`}>
              Descrição
            </h3>
          </div>
          
          {campaign.description && isValidDescription(campaign.description) ? (
            <div
              className={`${themeClasses.textSecondary} prose prose-base max-w-none ql-editor overflow-y-auto pr-2 ${
                campaignTheme === 'claro' ? 'custom-scrollbar-light' : 'custom-scrollbar-dark'
              }`}
              style={{
                maxHeight: '400px'
              }}
              dangerouslySetInnerHTML={{ __html: campaign.description }}
            />
          ) : (
            <div className={`${themeClasses.textSecondary} text-center italic`}>
              <p>Nenhuma descrição fornecida para esta campanha.</p>
            </div>
          )}
        </motion.section>

        {/* Método de Sorteio */}
        {!isCampaignCompleted && (
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4 max-w-3xl mx-auto mb-4`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={getColorClassName("w-8 h-8 rounded-lg flex items-center justify-center text-white")}
                style={getColorStyle(true)}
              >
                <Trophy className="h-4 w-4" />
              </div>
              <span className={`font-semibold text-sm ${themeClasses.text}`}>
                Método de sorteio:
              </span>
            </div>
            <span className={`font-medium text-sm ${themeClasses.text}`}>
              {campaign.draw_method}
            </span>
          </div>
        </motion.section>
        )}
      </main>

      {/* Fullscreen Image Modal */}
      {fullscreenImageIndex !== null && campaign?.prize_image_urls && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={handleCloseFullscreen}
        >
          <div 
            className="relative max-w-full max-h-full"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={campaign.prize_image_urls[fullscreenImageIndex]}
              alt={campaign.title}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
            {campaign.prize_image_urls.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPreviousFullscreenImage();
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full transition-all duration-200 flex items-center justify-center group"
                  aria-label="Imagem anterior"
                >
                  <ChevronLeft className="h-8 w-8 md:h-10 md:w-10 group-hover:scale-110 transition-transform duration-200" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNextFullscreenImage();
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full transition-all duration-200 flex items-center justify-center group"
                  aria-label="Próxima imagem"
                >
                  <ChevronRight className="h-8 w-8 md:h-10 md:w-10 group-hover:scale-110 transition-transform duration-200" />
                </button>
              </>
            )}

            {campaign.prize_image_urls.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm font-medium">
                {fullscreenImageIndex + 1} / {campaign.prize_image_urls.length}
              </div>
            )}
            
            <button
              onClick={handleCloseFullscreen}
              className="absolute top-4 right-4 w-10 h-10 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors duration-200 flex items-center justify-center"
              aria-label="Fechar imagem em tela cheia"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Step 1 Modal - Phone Input */}
      <ReservationStep1Modal
        isOpen={showStep1Modal}
        onClose={() => setShowStep1Modal(false)}
        onNewCustomer={handleStep1NewCustomer}
        onExistingCustomer={handleStep1ExistingCustomer}
        quotaCount={campaign.campaign_model === 'manual' ? selectedQuotas.length : quantity}
        totalValue={getCurrentTotalValue()}
        selectedQuotas={campaign.campaign_model === 'manual' ? selectedQuotas : undefined}
        campaignTitle={campaign.title}
        primaryColor={primaryColor}
        colorMode={organizerProfile?.color_mode}
        gradientClasses={organizerProfile?.gradient_classes}
        customGradientColors={organizerProfile?.custom_gradient_colors}
        campaignTheme={campaignTheme}
      />

      {/* Step 2 Modal */}
      {showStep2Modal && 
       customerDataForStep2 && 
       quotaCountForStep2 > 0 && 
       orderIdForReservation && 
       reservationTimestampForReservation && (
        <ReservationStep2Modal
          isOpen={showStep2Modal}
          onClose={() => setShowStep2Modal(false)}
          onConfirm={handleStep2Confirm}
          customerData={customerDataForStep2}
          quotaCount={quotaCountForStep2}
          totalValue={getCurrentTotalValue()}
          selectedQuotas={campaign.campaign_model === 'manual' ? selectedQuotas : undefined}
          campaignTitle={campaign.title}
          primaryColor={primaryColor}
          colorMode={organizerProfile?.color_mode}
          gradientClasses={organizerProfile?.gradient_classes}
          customGradientColors={organizerProfile?.custom_gradient_colors}
          campaignTheme={campaignTheme}
          confirming={reserving}
          orderId={orderIdForReservation}
          reservationTimestamp={reservationTimestampForReservation}
        />
      )}

      {/* Reservation Modal */}
      {showReservationModal && 
       quotaCountForStep2 > 0 && 
       orderIdForReservation && 
       reservationTimestampForReservation && (
        <ReservationModal
          isOpen={showReservationModal}
          onClose={() => setShowReservationModal(false)}
          onReserve={handleReservationSubmit}
          quotaCount={quotaCountForStep2}
          totalValue={getCurrentTotalValue()}
          selectedQuotas={campaign.campaign_model === 'manual' ? selectedQuotas : undefined}
          campaignTitle={campaign.title}
          primaryColor={primaryColor}
          campaignTheme={campaignTheme}
          reserving={reserving}
          reservationTimeoutMinutes={campaign.reservation_timeout_minutes || 15}
          colorMode={organizerProfile?.color_mode}
          gradientClasses={organizerProfile?.gradient_classes}
          customGradientColors={organizerProfile?.custom_gradient_colors}
          customerData={null}
          orderId={orderIdForReservation}
          reservationTimestamp={reservationTimestampForReservation}
        />
      )}

      {/* Prizes Display Modal */}
      {campaign && (
        <PrizesDisplayModal
          isOpen={showPrizesModal}
          onClose={() => setShowPrizesModal(false)}
          prizes={campaign.prizes || []}
          campaignTitle={campaign.title}
          campaignTheme={campaignTheme}
          colorMode={organizerProfile?.color_mode}
          primaryColor={primaryColor}
          gradientClasses={organizerProfile?.gradient_classes}
          customGradientColors={organizerProfile?.custom_gradient_colors}
        />
      )}

      {/* Cotas Premiadas Public Modal */}
      {campaign && (
        <CotasPremiadasPublicModal
          isOpen={showCotasPremiadasModal}
          onClose={() => setShowCotasPremiadasModal(false)}
          cotasPremiadas={cotasPremiadas}
          campaignTitle={campaign.title}
          campaignTheme={campaignTheme}
          totalTickets={campaign.total_tickets}
          colorMode={organizerProfile?.color_mode}
          primaryColor={primaryColor}
          gradientClasses={organizerProfile?.gradient_classes}
          customGradientColors={organizerProfile?.custom_gradient_colors}
        />
      )}

      {/* Phone Login Modal */}
      <PhoneLoginModal
        isOpen={showPhoneLoginModal}
        onClose={() => setShowPhoneLoginModal(false)}
        primaryColor={primaryColor}
        colorMode={organizerProfile?.color_mode}
        gradientClasses={organizerProfile?.gradient_classes}
        customGradientColors={organizerProfile?.custom_gradient_colors}
        campaignTheme={campaignTheme}
        campaignId={campaign?.id}
        organizerId={campaign?.user_id}
      />

      <CampaignFooter campaignTheme={campaignTheme} />
    </div>
  );
};

export default CampaignPage;) ****-**${cleaned.substring(9)}`;
  } else if (cleaned.length === 12) {
    return `(${cleaned.substring(0, 2)}) ****-**${cleaned.substring(8)}`;
  } else if (cleaned.length === 11) {
    return `(${cleaned.substring(0, 2)}) ****-**${cleaned.substring(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 2)}) ****-**${cleaned.substring(6)}`;
  }

  return phone.substring(0, 4) + '****' + phone.substring(phone.length - 2);
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.2
    }
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    transition: {
      duration: 0.2
    }
  })
};

const CampaignPage = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const { user, isPhoneAuthenticated, phoneUser, signInWithPhone } = useAuth();
  const { theme } = useTheme();
  const { showSuccess, showError, showWarning, showInfo } = useNotification();

  const isValidDescription = (description: string): boolean => {
    if (!description || typeof description !== 'string') return false;
    
    const textContent = description
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
    
    return textContent.length > 0;
  };
  
  const developmentHosts = [
    'localhost',
    '127.0.0.1',
    'netlify.app',
    'stackblitz.io',
    'stackblitz.com', 
    'webcontainer.io',
    'webcontainer-api.io'
  ];
  
  const isDevelopmentHost = developmentHosts.some(host => 
    window.location.hostname === host || window.location.hostname.includes(host)
  );
  
  const isCustomDomain = !isDevelopmentHost && publicId;
  
  const { campaign: campaignByPublicId, loading: loadingByPublicId, error: errorByPublicId } = useCampaignByPublicId(publicId || '');
  const { campaign: campaignByDomain, loading: loadingByDomain, error: errorByDomain } = useCampaignByCustomDomain(
    isCustomDomain ? window.location.hostname : ''
  );
  
  const campaign = isCustomDomain ? campaignByDomain : campaignByPublicId;
  const loading = isCustomDomain ? loadingByDomain : loadingByPublicId;
  const error = isCustomDomain ? errorByDomain : errorByPublicId;

  const isCampaignAvailable = campaign?.status === 'active' && campaign?.is_paid !== false;

  const [organizerProfile, setOrganizerProfile] = useState<OrganizerProfile | null>(null);
  const [loadingOrganizer, setLoadingOrganizer] = useState(false);

  const {
    tickets,
    loading: ticketsLoading,
    error: ticketsError,
    reserveTickets,
    getAvailableTickets,
    reserving
  } = useTickets(campaign?.id || '');

  const { winners, loading: winnersLoading } = useCampaignWinners(campaign?.id);

  const [selectedQuotas, setSelectedQuotas] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeFilter, setActiveFilter] = useState<'all' | 'available' | 'reserved' | 'purchased' | 'my-numbers'>('all');
  
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showStep1Modal, setShowStep1Modal] = useState(false);
  const [showStep2Modal, setShowStep2Modal] = useState(false);
  const [showPrizesModal, setShowPrizesModal] = useState(false);
  const [showCotasPremiadasModal, setShowCotasPremiadasModal] = useState(false);
  const [showPhoneLoginModal, setShowPhoneLoginModal] = useState(false);
  const [cotasPremiadas, setCotasPremiadas] = useState<CotaPremiada[]>([]);
  const [loadingCotasPremiadas, setLoadingCotasPremiadas] = useState(false);
  
  const [customerDataForStep2, setCustomerDataForStep2] = useState<ExistingCustomer | null>(null);
  const [quotaCountForStep2, setQuotaCountForStep2] = useState(0);
  const [orderIdForReservation, setOrderIdForReservation] = useState<string | null>(null);
  const [reservationTimestampForReservation, setReservationTimestampForReservation] = useState<Date | null>(null);
  
  const [existingCustomerData, setExistingCustomerData] = useState<ExistingCustomer | null>(null);
  const [reservationCustomerData, setReservationCustomerData] = useState<CustomerData | null>(null);
  const [reservationQuotas, setReservationQuotas] = useState<number[]>([]);
  const [reservationTotalValue, setReservationTotalValue] = useState(0);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState<number | null>(null);
  const [isAutoPlayPaused, setIsAutoPlayPaused] = useState(false);
  
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  
  const [direction, setDirection] = useState(1);

  const pauseAutoPlayForDuration = useCallback((duration: number = 10000) => {
    setIsAutoPlayPaused(true);
    const timer = setTimeout(() => {
      setIsAutoPlayPaused(false);
    }, duration);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!campaign?.prize_image_urls || campaign.prize_image_urls.length <= 1 || isAutoPlayPaused) {
      return;
    }

    const interval = setInterval(() => {
      setDirection(1);
      setCurrentImageIndex(prev => 
        prev === campaign.prize_image_urls!.length - 1 ? 0 : prev + 1
      );
    }, 6000);

    return () => clearInterval(interval);
  }, [campaign?.prize_image_urls, isAutoPlayPaused]);

  const getCustomGradientStyle = (customColorsJson: string) => {
    try {
      const colors = JSON.parse(customColorsJson);
      if (Array.isArray(colors) && colors.length >= 2) {
        if (colors.length === 2) {
          return `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`;
        } else if (colors.length === 3) {
          return `linear-gradient(90deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`;
        }
      }
    } catch (error) {
      console.error('Error parsing custom gradient colors:', error);
    }
    return null;
  };

  const getColorStyle = (isBackground: boolean = true, isText: boolean = false) => {
    const colorMode = organizerProfile?.color_mode || 'solid';
    const primaryColor = organizerProfile?.primary_color || '#3B82F6';

    if (colorMode === 'gradient') {
      const gradientClasses = organizerProfile?.gradient_classes;
      const customGradientColors = organizerProfile?.custom_gradient_colors;

      if (gradientClasses === 'custom' && customGradientColors) {
        const gradientStyle = getCustomGradientStyle(customGradientColors);
        if (gradientStyle) {
          return {
            background: gradientStyle,
            backgroundSize: '200% 200%',
            ...(isText && {
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent'
            })
          };
        }
      }

      if (isText) {
        return {
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent'
        };
      }
      return {};
    }

    if (isText) {
      return { color: primaryColor };
    }

    return isBackground ? { backgroundColor: primaryColor } : { color: primaryColor };
  };

  const getColorClassName = (baseClasses: string = '', isText: boolean = false) => {
    const colorMode = organizerProfile?.color_mode || 'solid';

    if (colorMode === 'gradient') {
      const gradientClasses = organizerProfile?.gradient_classes;
      const customGradientColors = organizerProfile?.custom_gradient_colors;

      if (gradientClasses === 'custom' && customGradientColors) {
        return `${baseClasses} animate-gradient-x bg-[length:200%_200%]`;
      }

      if (gradientClasses && gradientClasses !== 'custom') {
        return `${baseClasses} bg-gradient-to-r ${gradientClasses} animate-gradient-x bg-[length:200%_200%]`;
      }
    }

    return baseClasses;
  };

  useEffect(() => {
    if (campaign?.user_id) {
      const loadOrganizerProfile = async () => {
        setLoadingOrganizer(true);
        try {
          const { data, error } = await supabase
            .from('public_profiles_view')
            .select('id, name, avatar_url, logo_url, social_media_links, payment_integrations_config, primary_color, theme, color_mode, gradient_classes, custom_gradient_colors')
            .eq('id', campaign.user_id)
            .maybeSingle();

          if (error) {
            console.error('Error loading organizer profile:', error);
          } else {
            setOrganizerProfile(data);
          }
        } catch (error) {
          console.error('Error loading organizer profile:', error);
        } finally {
          setLoadingOrganizer(false);
        }
      };

      loadOrganizerProfile();
    }
  }, [campaign?.user_id]);

  useEffect(() => {
    if (campaign?.id && campaign?.campaign_model === 'automatic' && campaign?.cotas_premiadas_visiveis) {
      const loadCotasPremiadas = async () => {
        setLoadingCotasPremiadas(true);
        try {
          const { data, error } = await CotasPremiadasAPI.getCotasPremiadasByCampaign(campaign.id);
          if (!error && data) {
            setCotasPremiadas(data);
          }
        } catch (error) {
          console.error('Error loading cotas premiadas:', error);
        } finally {
          setLoadingCotasPremiadas(false);
        }
      };

      loadCotasPremiadas();

      const channel = CotasPremiadasAPI.subscribeToCotasPremiadas(campaign.id, () => {
        loadCotasPremiadas();
      });

      return () => {
        channel.unsubscribe();
      };
    }
  }, [campaign?.id, campaign?.campaign_model, campaign?.cotas_premiadas_visiveis]);

  const getBestPromotionForDisplay = useCallback((quotaCount: number): PromotionInfo | null => {
    if (!campaign?.promotions || !Array.isArray(campaign.promotions) || campaign.promotions.length === 0) {
      return null;
    }

    const applicablePromotions = campaign.promotions.filter(
      (promo: Promotion) => promo.ticketQuantity <= quotaCount
    );

    if (applicablePromotions.length === 0) {
      return null;
    }

    const applicablePromotion = applicablePromotions.reduce((best, current) => 
      current.ticketQuantity > best.ticketQuantity ? current : best
    );

    const originalTotal = quotaCount * campaign.ticket_price;
    
    const { total: promotionalTotal } = calculateTotalWithPromotions(
      quotaCount,
      campaign.ticket_price,
      campaign.promotions
    );
    
    const savings = originalTotal - promotionalTotal;
    const discountPercentage = Math.round((savings / originalTotal) * 100);

    return {
      promotion: applicablePromotion,
      originalTotal,
      promotionalTotal,
      savings,
      discountPercentage
    };
  }, [campaign?.promotions, campaign?.ticket_price]);

  const handleQuotaSelect = useCallback((quotaNumber: number) => {
    if (!campaign || campaign.campaign_model !== 'manual') return;

    const availableTickets = getAvailableTickets();
    const isAvailable = availableTickets.some(ticket => ticket.quota_number === quotaNumber);

    if (!isAvailable) return;

    setSelectedQuotas(prev => {
      if (prev.includes(quotaNumber)) {
        return prev.filter(q => q !== quotaNumber);
      } else {
        const newSelection = [...prev, quotaNumber];
        const maxLimit = campaign.max_tickets_per_purchase || 20000;
        if (newSelection.length <= maxLimit) {
          return newSelection;
        }
        showWarning(`Máximo de ${maxLimit.toLocaleString('pt-BR')} ${maxLimit === 1 ? 'cota' : 'cotas'} por compra`);
        return prev;
      }
    });
  }, [campaign, getAvailableTickets, showWarning]);

  const handleQuantityChange = useCallback((newQuantity: number) => {
    setQuantity(newQuantity);
  }, []);

  const handlePromotionClick = useCallback((promotionQuantity: number) => {
    if (!campaign) return;

    if (campaign.campaign_model === 'manual') {
      // Modo Manual: Selecionar cotas específicas
      const availableTickets = getAvailableTickets();
      
      if (availableTickets.length < promotionQuantity) {
        showError(`Não há cotas suficientes disponíveis. Disponível: ${availableTickets.length}`);
        return;
      }

      // Pegar as primeiras N cotas disponíveis
      const quotasToSelect = availableTickets
        .slice(0, promotionQuantity)
        .map(ticket => ticket.quota_number);

      setSelectedQuotas(quotasToSelect);
      showSuccess(`${promotionQuantity} cotas adicionadas ao carrinho!`);
    } else {
      // Modo Automático: Apenas atualizar a quantidade
      const maxLimit = campaign.max_tickets_per_purchase || 20000;
      const minLimit = campaign.min_tickets_per_purchase || 1;

      if (promotionQuantity > maxLimit) {
        showWarning(`A quantidade máxima por compra é ${maxLimit.toLocaleString('pt-BR')} cotas`);
        setQuantity(maxLimit);
        return;
      }

      if (promotionQuantity < minLimit) {
        showWarning(`A quantidade mínima por compra é ${minLimit.toLocaleString('pt-BR')} cotas`);
        setQuantity(minLimit);
        return;
      }

      setQuantity(promotionQuantity);
      showSuccess(`${promotionQuantity} cotas adicionadas ao carrinho!`);
    }
  }, [campaign, getAvailableTickets, showError, showSuccess, showWarning]);

  const handleReservationSubmit = useCallback(async (
    customerData: CustomerData, 
    totalQuantity: number, 
    orderId: string, 
    reservationTimestamp: Date
  ) => {
    if (!campaign) {
      showError('Erro: dados da campanha não encontrados');
      return null;
    }

    try {
      showInfo('Processando sua reserva...');

      const normalizedPhoneNumber = customerData.phoneNumber;

      const reservationResult = await reserveTickets(
        customerData,
        totalQuantity,
        orderId,
        reservationTimestamp
      );

      if (reservationResult) {
        const { total: totalValue } = calculateTotalWithPromotions(
          totalQuantity,
          campaign.ticket_price,
          campaign.promotions || []
        );

        setReservationCustomerData(customerData);
        setReservationQuotas(reservationResult.results.map(r => r.quota_number));
        setReservationTotalValue(totalValue);

        setSelectedQuotas([]);
        setQuantity(Math.max(1, campaign.min_tickets_per_purchase || 1));

        if (!isPhoneAuthenticated) {
          await signInWithPhone(normalizedPhoneNumber, {
            name: customerData.name,
            email: customerData.email
          });
        }

        showSuccess('Reserva realizada com sucesso!');

        navigate('/payment-confirmation', {
          state: {
            reservationData: {
              reservationId: reservationResult.reservationId,
              customerName: customerData.name,
              customerEmail: customerData.email,
              customerPhone: normalizedPhoneNumber,
              quotaCount: totalQuantity,
              totalValue: totalValue,
              selectedQuotas: reservationResult.results.map(r => r.quota_number),
              campaignTitle: campaign.title,
              campaignId: campaign.id,
              campaignPublicId: campaign.public_id,
              expiresAt: new Date(reservationTimestamp.getTime() + (campaign.reservation_timeout_minutes || 15) * 60 * 1000).toISOString(),
              reservationTimeoutMinutes: campaign.reservation_timeout_minutes,
              campaignModel: campaign.campaign_model,
              prizeImageUrl: campaign.prize_image_urls?.[0]
            }
          }
        });

        return reservationResult;
      }

      return null;
    } catch (error: any) {
      console.error('❌ Error during reservation:', error);
      showError(error.message || 'Erro ao reservar cotas. Tente novamente.');
      return null;
    } finally {
      setShowReservationModal(false);
    }
  }, [campaign, user, reserveTickets, navigate, showSuccess, showError, showInfo, isPhoneAuthenticated, signInWithPhone]);

  const handleOpenReservationModal = useCallback(() => {
    if (campaign?.campaign_model === 'manual' && selectedQuotas.length === 0) {
      showWarning('Selecione pelo menos uma cota para reservar');
      return;
    }

    if (campaign?.campaign_model === 'automatic' && quantity <= 0) {
      showWarning('Selecione uma quantidade válida de cotas');
      return;
    }

    setShowStep1Modal(true);
  }, [campaign, selectedQuotas, quantity, showWarning]);

  const handleStep1NewCustomer = useCallback((totalQuantity: number, orderId: string, reservationTimestamp: Date) => {
    setCustomerDataForStep2(null);
    setQuotaCountForStep2(totalQuantity);
    setOrderIdForReservation(orderId);
    setReservationTimestampForReservation(reservationTimestamp);
    
    setShowStep1Modal(false);
    setShowReservationModal(true);
  }, []);

  const handleStep1ExistingCustomer = useCallback((customerData: ExistingCustomer, totalQuantity: number, orderId: string, reservationTimestamp: Date) => {
    setCustomerDataForStep2(customerData);
    setQuotaCountForStep2(totalQuantity);
    setOrderIdForReservation(orderId);
    setReservationTimestampForReservation(reservationTimestamp);
    setExistingCustomerData(customerData);
    
    setShowStep1Modal(false);
    setShowStep2Modal(true);
  }, []);

  const handleStep2Confirm = useCallback(async (customerData: CustomerData, totalQuantity: number) => {
    if (!customerData || !customerData.name || !customerData.email || !customerData.phoneNumber) {
      showError('Dados do cliente incompletos.');
      return;
    }

    if (!campaign || !orderIdForReservation || !reservationTimestampForReservation) {
      showError('Erro: dados necessários ausentes.');
      return;
    }

    setShowStep2Modal(false);

    try {
      showInfo('Processando sua reserva...');

      const reservationResult = await reserveTickets(
        customerData,
        totalQuantity,
        orderIdForReservation,
        reservationTimestampForReservation
      );

      if (reservationResult) {
        const { total: totalValue } = calculateTotalWithPromotions(
          totalQuantity,
          campaign.ticket_price,
          campaign.promotions || []
        );

        const reservationTimeoutMinutes = campaign.reservation_timeout_minutes || 30;
        const expiresAt = new Date(reservationTimestampForReservation.getTime() + reservationTimeoutMinutes * 60 * 1000).toISOString();

        showSuccess('Cotas reservadas com sucesso!');

        navigate('/payment-confirmation', {
          state: {
            reservationData: {
              reservationId: reservationResult.reservationId,
              customerName: customerData.name,
              customerEmail: customerData.email,
              customerPhone: customerData.phoneNumber,
              quotaCount: totalQuantity,
              totalValue,
              selectedQuotas: reservationResult.results.map(r => r.quota_number),
              campaignTitle: campaign.title,
              campaignId: campaign.id,
              campaignPublicId: campaign.public_id,
              expiresAt,
              reservationTimeoutMinutes,
              campaignModel: campaign.campaign_model,
              prizeImageUrl: campaign.prize_image_urls?.[0]
            }
          }
        });
      } else {
        showError('Erro ao reservar cotas.');
      }
    } catch (error: any) {
      console.error('❌ EXCEPTION during reservation', error);
      showError(error.message || 'Erro ao reservar cotas.');
    }
  }, [campaign, reserveTickets, navigate, showError, showSuccess, showInfo, orderIdForReservation, reservationTimestampForReservation]);

  const handlePreviousImage = () => {
    if (campaign?.prize_image_urls && campaign.prize_image_urls.length > 1) {
      pauseAutoPlayForDuration(10000);
      setDirection(-1);
      setCurrentImageIndex(prev => 
        prev === 0 ? campaign.prize_image_urls!.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (campaign?.prize_image_urls && campaign.prize_image_urls.length > 1) {
      pauseAutoPlayForDuration(10000);
      setDirection(1);
      setCurrentImageIndex(prev => 
        prev === campaign.prize_image_urls!.length - 1 ? 0 : prev + 1
      );
    }
  };
  
  const handleMouseEnter = () => {
    setIsAutoPlayPaused(true);
  };

  const handleMouseLeave = () => {
    setIsAutoPlayPaused(false);
  };

  const handleImageClick = (imageIndex: number) => {
    setFullscreenImageIndex(imageIndex);
  };

  const handleCloseFullscreen = () => {
    setFullscreenImageIndex(null);
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const goToPreviousFullscreenImage = () => {
    if (fullscreenImageIndex === null || !campaign?.prize_image_urls) return;
    
    const totalImages = campaign.prize_image_urls.length;
    if (totalImages <= 1) return;
    
    setFullscreenImageIndex(prev => 
      prev === 0 ? totalImages - 1 : (prev || 0) - 1
    );
  };

  const goToNextFullscreenImage = () => {
    if (fullscreenImageIndex === null || !campaign?.prize_image_urls) return;
    
    const totalImages = campaign.prize_image_urls.length;
    if (totalImages <= 1) return;
    
    setFullscreenImageIndex(prev => 
      prev === totalImages - 1 ? 0 : (prev || 0) + 1
    );
  };

  useEffect(() => {
    if (fullscreenImageIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPreviousFullscreenImage();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNextFullscreenImage();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenImageIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNextFullscreenImage();
    } else if (isRightSwipe) {
      goToPreviousFullscreenImage();
    }

    setTouchStartX(null);
    setTouchEndX(null);
  };

  const getThemeClasses = (campaignTheme: string) => {
    switch (campaignTheme) {
      case 'claro':
        return {
          background: 'bg-gray-50',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-white',
          border: 'border-gray-200'
        };
      case 'escuro':
        return {
          background: 'bg-slate-900',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-slate-800',
          border: 'border-slate-700'
        };
      case 'escuro-preto':
        return {
          background: 'bg-black',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-gray-900',
          border: 'border-gray-800'
        };
      default:
        return {
          background: 'bg-gray-50',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-white',
          border: 'border-gray-200'
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressPercentage = () => {
    if (!campaign) return 0;
    return Math.round((campaign.sold_tickets / campaign.total_tickets) * 100);
  };

  const currentPromotionInfo = campaign?.campaign_model === 'manual' 
    ? getBestPromotionForDisplay(selectedQuotas.length)
    : getBestPromotionForDisplay(quantity);

  const getCurrentTotalValue = () => {
    const currentQuantity = campaign?.campaign_model === 'manual' ? selectedQuotas.length : quantity;
    
    if (!campaign) return 0;
    
    const { total } = calculateTotalWithPromotions(
      currentQuantity,
      campaign.ticket_price,
      campaign.promotions || []
    );
    
    return total;
  };

  if (loading || ticketsLoading) {
    const loadingPrimaryColor = organizerProfile?.primary_color || '#3B82F6';
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: loadingPrimaryColor }}></div>
      </div>
    );