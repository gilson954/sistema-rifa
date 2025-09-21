import React, { useState, useCallback, useEffect } from "react";
import {
  Share2,
  Calendar,
  Users,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useCampaignBySlug, useCampaignByCustomDomain } from "../hooks/useCampaigns";
import { useTickets } from "../hooks/useTickets";
import QuotaGrid from "../components/QuotaGrid";
import QuotaSelector from "../components/QuotaSelector";
import ReservationModal, { CustomerData } from "../components/ReservationModal";
import { Promotion } from "../types/promotion";
import { formatCurrency } from "../utils/currency";
import { calculateTotalWithPromotions } from "../utils/currency";
import { socialMediaConfig, shareSectionConfig } from "../components/SocialMediaIcons";
import { supabase } from "../lib/supabase";

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
  social_media_links?: Record<string, string>;
  payment_integrations_config?: any;
  primary_color?: string;
  theme?: string;
}

const CampaignPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();

  // detect host for custom domain logic
  const developmentHosts = [
    "localhost",
    "127.0.0.1",
    "netlify.app",
    "stackblitz.io",
    "stackblitz.com",
    "webcontainer.io",
    "webcontainer-api.io",
  ];
  const isDevelopmentHost = developmentHosts.some((h) => window.location.hostname === h || window.location.hostname.includes(h));
  const isCustomDomain = !isDevelopmentHost && slug;

  // fetch campaign by slug or by domain
  const { campaign: campaignBySlug, loading: loadingBySlug, error: errorBySlug } = useCampaignBySlug(slug || "");
  const { campaign: campaignByDomain, loading: loadingByDomain, error: errorByDomain } = useCampaignByCustomDomain(
    isCustomDomain ? window.location.hostname : ""
  );

  const campaign = isCustomDomain ? campaignByDomain : campaignBySlug;
  const loading = isCustomDomain ? loadingByDomain : loadingBySlug;
  const error = isCustomDomain ? errorByDomain : errorBySlug;

  // Tickets hook
  const { tickets, loading: ticketsLoading, reserveTickets, getAvailableTickets, reserving } = useTickets(campaign?.id || "");

  // theme helpers
  const getThemeClasses = (campaignTheme: string | undefined) => {
    switch (campaignTheme) {
      case "claro":
        return {
          background: "bg-gray-50",
          text: "text-gray-900",
          textSecondary: "text-gray-600",
          cardBg: "bg-white",
          border: "border-gray-200",
          bg: "bg-white",
        };
      case "escuro":
        return {
          background: "bg-gray-950",
          text: "text-white",
          textSecondary: "text-gray-300",
          cardBg: "bg-gray-900",
          border: "border-gray-800",
          bg: "bg-gray-900",
        };
      case "escuro-preto":
        return {
          background: "bg-black",
          text: "text-white",
          textSecondary: "text-gray-300",
          cardBg: "bg-gray-900",
          border: "border-gray-800",
          bg: "bg-black",
        };
      default:
        return {
          background: "bg-gray-50",
          text: "text-gray-900",
          textSecondary: "text-gray-600",
          cardBg: "bg-white",
          border: "border-gray-200",
          bg: "bg-white",
        };
    }
  };

  // organizer profile
  const [organizerProfile, setOrganizerProfile] = useState<OrganizerProfile | null>(null);
  const [loadingOrganizer, setLoadingOrganizer] = useState(false);

  useEffect(() => {
    if (!campaign?.user_id) return;
    const loadOrganizer = async () => {
      setLoadingOrganizer(true);
      try {
        const { data, error } = await supabase
          .from("public_profiles_view")
          .select("id, name, avatar_url, logo_url, social_media_links, payment_integrations_config, primary_color, theme")
          .eq("id", campaign.user_id)
          .maybeSingle();

        if (!error) setOrganizerProfile(data || null);
      } catch (err) {
        // ignore
        console.error("Error loading organizer:", err);
      } finally {
        setLoadingOrganizer(false);
      }
    };
    loadOrganizer();
  }, [campaign?.user_id]);

  // selection & reservation state
  const [selectedQuotas, setSelectedQuotas] = useState<number[]>([]);
  const [quantity, setQuantity] = useState<number>(Math.max(1, campaign?.min_tickets_per_purchase || 1));
  const [activeFilter, setActiveFilter] = useState<"all" | "available" | "reserved" | "purchased" | "my-numbers">("all");

  // modal states
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reservationCustomerData, setReservationCustomerData] = useState<CustomerData | null>(null);
  const [reservationQuotas, setReservationQuotas] = useState<number[]>([]);
  const [reservationTotalValue, setReservationTotalValue] = useState<number>(0);

  // images
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState<number | null>(null);

  // touch
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // helper: check if campaign available (active + paid)
  const isCampaignAvailable = campaign?.status === "active" && campaign?.is_paid !== false;

  // promotions helper
  const getBestPromotionForDisplay = useCallback(
    (quotaCount: number): PromotionInfo | null => {
      if (!campaign?.promotions || !Array.isArray(campaign.promotions) || campaign.promotions.length === 0) return null;

      const applicable = campaign.promotions.filter((p: Promotion) => p.ticketQuantity <= quotaCount);
      if (applicable.length === 0) return null;

      const best = applicable.reduce((a, b) => (b.ticketQuantity > a.ticketQuantity ? b : a));
      const originalTotal = quotaCount * campaign.ticket_price;
      const { total: promotionalTotal } = calculateTotalWithPromotions(quotaCount, campaign.ticket_price, campaign.promotions);
      const savings = originalTotal - promotionalTotal;
      const discountPercentage = originalTotal > 0 ? Math.round((savings / originalTotal) * 100) : 0;

      return { promotion: best, originalTotal, promotionalTotal, savings, discountPercentage };
    },
    [campaign?.promotions, campaign?.ticket_price]
  );

  const currentPromotionInfo = campaign?.campaign_model === "manual" ? getBestPromotionForDisplay(selectedQuotas.length) : getBestPromotionForDisplay(quantity);

  const getCurrentTotalValue = () => {
    const count = campaign?.campaign_model === "manual" ? selectedQuotas.length : quantity;
    if (!campaign) return 0;
    const { total } = calculateTotalWithPromotions(count, campaign.ticket_price, campaign.promotions || []);
    return total;
  };

  // quota selection handlers
  const handleQuotaSelect = useCallback(
    (quotaNumber: number) => {
      if (!campaign || campaign.campaign_model !== "manual") return;

      const available = getAvailableTickets();
      const isAvailable = available.some((t) => t.quota_number === quotaNumber);
      if (!isAvailable) return;

      setSelectedQuotas((prev) => {
        if (prev.includes(quotaNumber)) return prev.filter((q) => q !== quotaNumber);
        const next = [...prev, quotaNumber];
        if (next.length <= (campaign.max_tickets_per_purchase || 1000)) return next;
        return prev;
      });
    },
    [campaign, getAvailableTickets]
  );

  const handleQuantityChange = useCallback((q: number) => setQuantity(q), []);

  // reservation submission
  const handleReservationSubmit = useCallback(
    async (customerData: CustomerData) => {
      if (!campaign || !user) {
        alert("Você precisa estar logado para reservar cotas");
        return;
      }

      try {
        let quotasToReserve: number[] = [];

        if (campaign.campaign_model === "manual") {
          if (selectedQuotas.length === 0) {
            alert("Selecione pelo menos uma cota");
            return;
          }
          quotasToReserve = selectedQuotas;
        } else {
          if (quantity <= 0) {
            alert("Selecione uma quantidade válida");
            return;
          }

          const available = getAvailableTickets().map((t) => t.quota_number);
          if (available.length < quantity) {
            alert(`Apenas ${available.length} cotas disponíveis`);
            return;
          }
          const shuffled = [...available].sort(() => 0.5 - Math.random());
          quotasToReserve = shuffled.slice(0, quantity);
        }

        const result = await reserveTickets(quotasToReserve);
        if (result) {
          const { total } = calculateTotalWithPromotions(quotasToReserve.length, campaign.ticket_price, campaign.promotions || []);
          setReservationCustomerData(customerData);
          setReservationQuotas(quotasToReserve);
          setReservationTotalValue(total);

          // clear selection
          setSelectedQuotas([]);
          setQuantity(Math.max(1, campaign.min_tickets_per_purchase || 1));

          // navigate to a payment page or show confirmation
          navigate("/payment-confirmation", {
            state: {
              reservationId: `RES-${Date.now()}`,
              customerName: customerData.name,
              customerEmail: customerData.email,
              quotaCount: quotasToReserve.length,
              totalValue: total,
              selectedQuotas: quotasToReserve,
              campaignTitle: campaign.title,
              campaignId: campaign.id,
            },
          });
        }
      } catch (err) {
        console.error("Reservation error", err);
        alert("Erro ao reservar. Tente novamente.");
      } finally {
        setShowReservationModal(false);
      }
    },
    [campaign, user, selectedQuotas, quantity, getAvailableTickets, reserveTickets, navigate]
  );

  // open reservation modal
  const handleOpenReservationModal = useCallback(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (campaign?.campaign_model === "manual" && selectedQuotas.length === 0) {
      alert("Selecione pelo menos uma cota para reservar");
      return;
    }
    if (campaign?.campaign_model === "automatic" && quantity <= 0) {
      alert("Selecione uma quantidade válida");
      return;
    }
    setShowReservationModal(true);
  }, [user, campaign, selectedQuotas, quantity, navigate]);

  // images navigation
  const handlePreviousImage = () => {
    if (!campaign?.prize_image_urls) return;
    setCurrentImageIndex((prev) => (prev === 0 ? campaign.prize_image_urls!.length - 1 : prev - 1));
  };
  const handleNextImage = () => {
    if (!campaign?.prize_image_urls) return;
    setCurrentImageIndex((prev) => (prev === campaign.prize_image_urls!.length - 1 ? 0 : prev + 1));
  };
  const handleImageClick = (i: number) => setFullscreenImageIndex(i);
  const handleCloseFullscreen = () => {
    setFullscreenImageIndex(null);
    setTouchStartX(null);
    setTouchEndX(null);
  };

  // keyboard for fullscreen
  useEffect(() => {
    if (fullscreenImageIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePreviousImage();
      if (e.key === "ArrowRight") handleNextImage();
      if (e.key === "Escape") handleCloseFullscreen();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreenImageIndex]);

  // touch handlers
  const handleTouchStart = (e: React.TouchEvent) => setTouchStartX(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => setTouchEndX(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    if (distance > 50) handleNextImage();
    if (distance < -50) handlePreviousImage();
    setTouchStartX(null);
    setTouchEndX(null);
  };

  // share helpers
  const generateShareUrl = () => `${window.location.origin}/c/${campaign?.slug}`;
  const handleShare = (platform: string) => {
    const shareUrl = generateShareUrl();
    const text = `Participe da ${campaign?.title}! ${formatCurrency(campaign?.ticket_price || 0)}`;
    let url = "";
    switch (platform) {
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(`${text} ${shareUrl}`)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case "telegram":
        url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case "x":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      default:
        return;
    }
    window.open(url, "_blank", "width=600,height=400");
  };

  const handleOrganizerSocialClick = (platform: string, url: string) => window.open(url, "_blank");

  // payment methods helper (simple representation)
  const getConfiguredPaymentMethods = () => {
    const config = (organizerProfile as any)?.payment_integrations_config || {};
    const methods: Array<{ name: string; icon: string; color: string }> = [];
    if (config.mercado_pago?.client_id || config.mercado_pago?.access_token) methods.push({ name: "Mercado Pago", icon: "💳", color: "#00B1EA" });
    if (config.fluxsis?.api_key) methods.push({ name: "Fluxsis", icon: "💰", color: "#6366F1" });
    if (config.pay2m?.api_key) methods.push({ name: "Pay2m", icon: "💸", color: "#10B981" });
    methods.push({ name: "PIX", icon: "₽", color: "#00BC63" });
    return methods;
  };

  // theme values
  const campaignTheme = organizerProfile?.theme || "claro";
  const primaryColor = organizerProfile?.primary_color || "#3B82F6";
  const themeClasses = getThemeClasses(campaignTheme);

  if (loading || ticketsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-purple-600" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Campanha não encontrada</h2>
          <p className="text-gray-500">A campanha não está disponível ou foi removida.</p>
          <div className="mt-4">
            <button onClick={() => navigate("/")} className="px-4 py-2 bg-purple-600 text-white rounded-lg">Voltar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses.background}`}>
      {/* Header */}
      <header className={`shadow-sm border-b ${themeClasses.border} ${themeClasses.cardBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img src="/logo-chatgpt.png" alt="Logo" className="w-10 h-10 object-contain" />
              <span className={`text-xl font-bold ${themeClasses.text}`}>Rifaqui</span>
            </div>

            <div>
              <button onClick={() => navigate("/my-tickets")} className="bg-purple-600 text-white px-3 py-2 rounded-md flex items-center gap-2">
                <Eye className="w-4 h-4" /> <span className="hidden sm:inline">Ver Minhas Cotas</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Title */}
        <h1 className={`text-2xl md:text-3xl font-bold mb-4 text-center ${themeClasses.text}`}>{campaign.title}</h1>

        {/* Gallery card */}
        <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} overflow-hidden mb-6 max-w-3xl mx-auto`}>
          <div className="relative group w-full">
            <img
              src={campaign.prize_image_urls?.[currentImageIndex] || "https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg"}
              alt={campaign.title}
              className="w-full h-[260px] sm:h-[420px] object-cover rounded-t-xl"
              onClick={() => handleImageClick(currentImageIndex)}
              style={{ cursor: "pointer" }}
            />
            {campaign.prize_image_urls && campaign.prize_image_urls.length > 1 && (
              <>
                <button onClick={handlePreviousImage} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={handleNextImage} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100">
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 right-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {campaign.prize_image_urls.length}
                </div>
              </>
            )}

            <div className="absolute top-3 left-3 bg-white bg-opacity-95 px-3 py-1 rounded-full shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Participe por apenas</span>
                <span className="font-bold" style={{ color: primaryColor }}>{formatCurrency(campaign.ticket_price)}</span>
              </div>
            </div>
          </div>

          {/* thumbnails */}
          {campaign.prize_image_urls && campaign.prize_image_urls.length > 1 && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800">
              <div className="flex gap-2 overflow-x-auto">
                {campaign.prize_image_urls.map((img, idx) => (
                  <button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${idx === currentImageIndex ? "border-purple-500" : "border-gray-300"}`}>
                    <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Organizador — layout conforme seu desenho (desktop) e responsivo (mobile) */}
        <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4 mb-6 max-w-3xl mx-auto`}>
          <h3 className={`text-xl font-bold ${themeClasses.text} mb-4`}>Organizador</h3>

          {loadingOrganizer ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            </div>
          ) : organizerProfile ? (
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {/* avatar/logo */}
              <div className="flex-shrink-0 mx-auto sm:mx-0">
                {organizerProfile.logo_url ? (
                  <img src={organizerProfile.logo_url} alt={organizerProfile.name} className="w-20 h-20 rounded-lg object-contain border-4 shadow-md" style={{ borderColor: primaryColor }} />
                ) : organizerProfile.avatar_url ? (
                  <img src={organizerProfile.avatar_url} alt={organizerProfile.name} className="w-20 h-20 rounded-full object-cover border-4 shadow-md" style={{ borderColor: primaryColor }} />
                ) : (
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md" style={{ backgroundColor: primaryColor }}>
                    {organizerProfile.name ? organizerProfile.name.charAt(0).toUpperCase() : "O"}
                  </div>
                )}
              </div>

              {/* name + social icons */}
              <div className="flex-1 text-center sm:text-left">
                <h4 className={`text-lg font-semibold ${themeClasses.text}`}>{organizerProfile.name}</h4>

                {/* social icons (small circles) */}
                {organizerProfile.social_media_links && Object.keys(organizerProfile.social_media_links).length > 0 && (
                  <div className="mt-3 flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                    {Object.entries(organizerProfile.social_media_links).map(([platform, url]) => {
                      if (!url || typeof url !== "string") return null;
                      const config = socialMediaConfig[platform as keyof typeof socialMediaConfig];
                      if (!config) return null;
                      const Icon = config.icon;
                      return (
                        <button
                          key={platform}
                          onClick={() => handleOrganizerSocialClick(platform, url)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white transform transition-transform duration-150"
                          style={{ backgroundColor: config.color }}
                          title={`${config.name} do organizador`}
                        >
                          <Icon size={14} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Users className={`h-8 w-8 ${themeClasses.textSecondary} mx-auto mb-2`} />
              <p className={`text-sm ${themeClasses.textSecondary}`}>Informações do organizador não disponíveis</p>
            </div>
          )}
        </section>

        {/* Promoções Disponíveis */}
        {campaign.promotions && campaign.promotions.length > 0 && (
          <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4 mb-6 max-w-3xl mx-auto`}>
            <h3 className={`text-lg font-bold ${themeClasses.text} mb-3`}>🎁 Promoções Disponíveis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {campaign.promotions.map((promo: Promotion) => {
                const original = promo.ticketQuantity * campaign.ticket_price;
                const discount = Math.round((promo.fixedDiscountAmount / Math.max(original, 1)) * 100);
                return (
                  <div key={promo.id} className={`rounded-lg p-3 border ${themeClasses.border}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`font-bold ${themeClasses.text}`}>{promo.ticketQuantity} cotas</div>
                        <div className="text-xs text-green-600">{discount}% de desconto</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 line-through">{formatCurrency(original)}</div>
                        <div className="font-bold text-base text-green-600">{formatCurrency(promo.discountedTotalValue)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Prêmios */}
        {campaign.prizes && campaign.prizes.length > 0 && (
          <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4 mb-6 max-w-3xl mx-auto`}>
            <h3 className={`text-lg font-bold ${themeClasses.text} mb-3`}>🏆 Prêmios</h3>
            <div className="space-y-2">
              {campaign.prizes.map((p: any, idx: number) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: primaryColor }}>
                    {idx + 1}
                  </div>
                  <div className={themeClasses.text}>{p.name}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Seleção / Compra de Cotas */}
        <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4 mb-6 max-w-3xl mx-auto`}>
          <h3 className={`text-lg font-bold ${themeClasses.text} mb-3`}>{campaign.campaign_model === "manual" ? "Selecione suas Cotas" : "Escolha a Quantidade"}</h3>

          {campaign.campaign_model === "manual" ? (
            <>
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
              />

              {selectedQuotas.length > 0 && (
                <div className="mt-4 p-4 rounded-lg border">
                  <div className="flex justify-between items-center mb-3">
                    <div className={themeClasses.text}>{selectedQuotas.length} {selectedQuotas.length === 1 ? "cota" : "cotas"}</div>
                    <div className="text-right">
                      {currentPromotionInfo && <div className="text-xs line-through text-gray-500">{formatCurrency(currentPromotionInfo.originalTotal)}</div>}
                      <div className="font-bold text-lg" style={{ color: primaryColor }}>{formatCurrency(getCurrentTotalValue())}</div>
                    </div>
                  </div>
                  <button onClick={handleOpenReservationModal} disabled={!isCampaignAvailable} className="w-full py-3 rounded-lg text-white" style={{ backgroundColor: primaryColor }}>
                    {isCampaignAvailable ? "Reservar Cotas Selecionadas" : "Campanha Indisponível"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <QuotaSelector
              ticketPrice={campaign.ticket_price}
              minTicketsPerPurchase={campaign.min_tickets_per_purchase || 1}
              maxTicketsPerPurchase={campaign.max_tickets_per_purchase || 1000}
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
            />
          )}
        </section>

        {/* Descrição / Regulamento */}
        <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4 mb-6 max-w-3xl mx-auto`}>
          <h3 className={`text-lg font-bold ${themeClasses.text} mb-3`}>Descrição/Regulamento</h3>
          {campaign.description ? (
            <div className={`${themeClasses.textSecondary} prose max-w-none`} dangerouslySetInnerHTML={{ __html: campaign.description }} />
          ) : (
            <div className={themeClasses.textSecondary}>Nenhuma descrição fornecida.</div>
          )}

          {campaign.show_draw_date && campaign.draw_date && (
            <div className="mt-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <div className={themeClasses.text}>Data do sorteio: <strong>{new Date(campaign.draw_date).toLocaleString()}</strong></div>
            </div>
          )}

          {campaign.show_percentage && (
            <div className="mt-4">
              <div className="mb-2 text-center font-semibold">{Math.round((campaign.sold_tickets / campaign.total_tickets) * 100)}%</div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div style={{ width: `${Math.round((campaign.sold_tickets / campaign.total_tickets) * 100)}%`, backgroundColor: primaryColor }} className="h-3 rounded-full" />
              </div>
            </div>
          )}
        </section>

        {/* Pagamentos e Método de Sorteio */}
        <section className="max-w-3xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <div className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4`}>
            <h3 className={`text-base font-bold ${themeClasses.text} mb-3`}>Métodos de Pagamento</h3>
            <div className="space-y-2">
              {getConfiguredPaymentMethods().map((m, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-md border">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center text-white" style={{ backgroundColor: m.color }}>{m.icon}</div>
                  <div className={themeClasses.text}>{m.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4`}>
            <h3 className={`text-base font-bold ${themeClasses.text} mb-3`}>Método de Sorteio</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md flex items-center justify-center text-white" style={{ backgroundColor: primaryColor }}>
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className={themeClasses.text}>{campaign.draw_method}</div>
                <div className={themeClasses.textSecondary}>Sorteio transparente e auditável</div>
              </div>
            </div>
          </div>
        </section>

        {/* Compartilhar */}
        <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4 max-w-3xl mx-auto mb-12`}>
          <h3 className={`text-lg font-bold ${themeClasses.text} mb-3`}>Compartilhar Campanha</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(shareSectionConfig).map(([platform, cfg]) => {
              const Icon = cfg.icon;
              return (
                <button key={platform} onClick={() => handleShare(platform)} className={`flex flex-col items-center p-3 rounded-md border ${themeClasses.border}`}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: cfg.color }}>
                    <Icon size={18} />
                  </div>
                  <div className={`text-xs mt-2 ${themeClasses.text}`}>{cfg.name}</div>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* Fullscreen modal for images */}
      {fullscreenImageIndex !== null && campaign?.prize_image_urls && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4" onClick={handleCloseFullscreen}>
          <div className="relative max-w-full max-h-full" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            <img src={campaign.prize_image_urls[fullscreenImageIndex]} alt="full" className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
            <button onClick={(e) => { e.stopPropagation(); handlePreviousImage(); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black bg-opacity-40 flex items-center justify-center text-white">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleNextImage(); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black bg-opacity-40 flex items-center justify-center text-white">
              <ChevronRight className="w-6 h-6" />
            </button>
            <button onClick={handleCloseFullscreen} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black bg-opacity-40 flex items-center justify-center text-white">✕</button>
          </div>
        </div>
      )}

      {/* Reservation modal - pass both open/isOpen props to maximize compatibility with different implementations */}
      <ReservationModal
        isOpen={showReservationModal}
        open={showReservationModal}
        onClose={() => setShowReservationModal(false)}
        onReserve={handleReservationSubmit}
        quotaCount={campaign?.campaign_model === "manual" ? selectedQuotas.length : quantity}
        totalValue={getCurrentTotalValue()}
        selectedQuotas={campaign?.campaign_model === "manual" ? selectedQuotas : undefined}
        campaignTitle={campaign.title}
        primaryColor={primaryColor}
        campaignTheme={campaignTheme}
        reserving={reserving}
        reservationTimeoutMinutes={campaign?.reservation_timeout_minutes || 15}
      />
    </div>
  );
};

export default CampaignPage;
