import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Plus, Trash2, AlertTriangle, ChevronDown, Calendar, Gift, Trophy, Settings, Image, FileText, Check } from 'lucide-react';

// Simulated hooks and components for demonstration
const useCampaignWithRefetch = (id: string) => ({
  campaign: {
    id: '1',
    title: 'Campanha de Exemplo',
    description: '<p>Descrição da campanha</p>',
    ticket_price: 10,
    total_tickets: 5000,
    require_email: true,
    show_ranking: false,
    min_tickets_per_purchase: 1,
    max_tickets_per_purchase: 1000,
    campaign_model: 'automatic' as const,
    show_percentage: false,
    reservation_timeout_minutes: 30,
    draw_date: null,
    prize_image_urls: [],
    promotions: [],
    prizes: [],
    user_id: 'user123'
  },
  loading: false,
  refetch: () => {}
});

const useImageUpload = () => ({
  images: [],
  uploading: false,
  uploadProgress: 0,
  addImages: () => {},
  removeImage: () => {},
  reorderImages: () => {},
  uploadImages: async () => [],
  setExistingImages: () => {}
});

const ImageUpload = ({ images, uploading, uploadProgress, onAddImages, onRemoveImage, onReorderImage }: any) => (
  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center">
    <Image className="mx-auto h-12 w-12 text-gray-400 mb-3" />
    <p className="text-gray-600 dark:text-gray-400">Arraste imagens aqui ou clique para fazer upload</p>
  </div>
);

const RichTextEditor = ({ value, onChange, placeholder }: any) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[200px]"
  />
);

const PromotionModal = ({ isOpen, onClose, onSavePromotions, initialPromotions, originalTicketPrice, campaignTotalTickets }: any) => null;
const PrizesModal = ({ isOpen, onClose, prizes, onSavePrizes }: any) => null;
const DateTimePickerModal = ({ isOpen, onClose, onConfirm, selectedDate, minDate }: any) => null;

interface Promotion {
  id: string;
  ticketQuantity: number;
  fixedDiscountAmount: number;
  discountedTotalValue: number;
}

interface Prize {
  id: string;
  name: string;
}

// Animated Checkbox Component
const AnimatedCheckbox = ({ 
  id, 
  name, 
  checked, 
  onChange, 
  label, 
  color = 'blue' 
}: { 
  id: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  color?: 'blue' | 'green' | 'purple' | 'pink';
}) => {
  const colorClasses = {
    blue: {
      border: 'border-blue-100/20 dark:border-blue-900/30',
      bg: 'bg-blue-50/30 dark:bg-blue-900/10',
      hoverBorder: 'hover:border-blue-300/50 dark:hover:border-blue-700/50',
      checkBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      shadowGlow: 'shadow-[0_0_20px_rgba(59,130,246,0.5)]'
    },
    green: {
      border: 'border-green-100/20 dark:border-green-900/30',
      bg: 'bg-green-50/30 dark:bg-green-900/10',
      hoverBorder: 'hover:border-green-300/50 dark:hover:border-green-700/50',
      checkBg: 'bg-gradient-to-br from-green-500 to-green-600',
      shadowGlow: 'shadow-[0_0_20px_rgba(34,197,94,0.5)]'
    },
    purple: {
      border: 'border-purple-100/20 dark:border-purple-900/30',
      bg: 'bg-purple-50/30 dark:bg-purple-900/10',
      hoverBorder: 'hover:border-purple-300/50 dark:hover:border-purple-700/50',
      checkBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
      shadowGlow: 'shadow-[0_0_20px_rgba(168,85,247,0.5)]'
    },
    pink: {
      border: 'border-pink-100/20 dark:border-pink-900/30',
      bg: 'bg-pink-50/30 dark:bg-pink-900/10',
      hoverBorder: 'hover:border-pink-300/50 dark:hover:border-pink-700/50',
      checkBg: 'bg-gradient-to-br from-pink-500 to-pink-600',
      shadowGlow: 'shadow-[0_0_20px_rgba(236,72,153,0.5)]'
    }
  };

  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`flex items-center space-x-4 p-4 rounded-xl border ${colors.border} ${colors.bg} backdrop-blur-sm ${colors.hoverBorder} transition-all duration-200 cursor-pointer`}
      onClick={() => {
        const event = {
          target: { name, checked: !checked, type: 'checkbox' }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
      }}
    >
      <div className="relative">
        <motion.div
          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
            checked 
              ? `${colors.checkBg} border-transparent ${colors.shadowGlow}` 
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
          }`}
          animate={{
            scale: checked ? [1, 1.2, 1] : 1
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut"
          }}
        >
          <AnimatePresence>
            {checked && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 500, 
                  damping: 25 
                }}
              >
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Ripple effect on check */}
        <AnimatePresence>
          {checked && (
            <motion.div
              className={`absolute inset-0 rounded-lg ${colors.checkBg} opacity-30`}
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ scale: 1, opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
          )}
        </AnimatePresence>
      </div>
      
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      
      <label 
        htmlFor={id} 
        className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1 font-medium select-none"
      >
        {label}
      </label>
    </motion.div>
  );
};

const CreateCampaignStep2Page = () => {
  const campaignId = '123';
  const { campaign, loading: campaignLoading, refetch } = useCampaignWithRefetch(campaignId || '');
  
  const {
    images,
    uploading: uploadingImages,
    uploadProgress,
    addImages,
    removeImage,
    reorderImages,
    uploadImages,
    setExistingImages
  } = useImageUpload();

  const [formData, setFormData] = useState({
    description: '',
    requireEmail: true,
    showRanking: false,
    minTicketsPerPurchase: 1,
    maxTicketsPerPurchase: 1000,
    campaignModel: 'automatic' as 'manual' | 'automatic',
    showPercentage: false,
    reservationTimeoutMinutes: 30,
    drawDate: null as Date | null,
    showDrawDateOption: 'no-date' as 'show-date' | 'no-date'
  });

  const [showInlineDatePicker, setShowInlineDatePicker] = useState(false);
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showPrizesModal, setShowPrizesModal] = useState(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [campaignModelError, setCampaignModelError] = useState<string>('');

  useEffect(() => {
    if (campaign) {
      setFormData({
        description: campaign.description || '',
        requireEmail: campaign.require_email ?? true,
        showRanking: campaign.show_ranking ?? false,
        minTicketsPerPurchase: campaign.min_tickets_per_purchase || 1,
        maxTicketsPerPurchase: campaign.max_tickets_per_purchase || 1000,
        campaignModel: campaign.campaign_model || 'automatic',
        showPercentage: campaign.show_percentage ?? false,
        reservationTimeoutMinutes: campaign.reservation_timeout_minutes || 30,
        drawDate: campaign.draw_date ? new Date(campaign.draw_date) : null,
        showDrawDateOption: campaign.draw_date ? 'show-date' : 'no-date'
      });
    }
  }, [campaign]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      const numValue = parseInt(value) || 0;
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else if (name === 'reservationTimeoutMinutes') {
      const numValue = parseInt(value) || 15;
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const reservationTimeoutOptions = [
    { value: 10, label: '10 minutos' },
    { value: 30, label: '30 minutos' },
    { value: 60, label: '1 hora' },
    { value: 180, label: '3 horas' },
    { value: 720, label: '12 horas' },
    { value: 1440, label: '1 dia' },
    { value: 2880, label: '2 dias' },
    { value: 5760, label: '4 dias' }
  ];

  return (
    <div className="dashboard-page min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white transition-colors duration-300 p-8">
      <main className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Configurações da Campanha
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure os detalhes avançados da sua campanha
          </p>
        </motion.div>

        {/* Campaign Settings Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-gray-200/20 dark:border-gray-700/30 bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm overflow-hidden shadow-xl"
        >
          <div className="flex items-center space-x-3 p-5 border-b border-gray-200/20 dark:border-gray-700/30 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-800/50">
            <motion.div 
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center shadow-md"
            >
              <Settings className="w-5 h-5 text-white" />
            </motion.div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Configurações da campanha
            </h2>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Reservation Timeout */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Tempo de reserva das cotas
              </label>
              <div className="relative">
                <select
                  name="reservationTimeoutMinutes"
                  value={formData.reservationTimeoutMinutes}
                  onChange={handleInputChange}
                  className="w-full appearance-none px-5 py-4 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 border-gray-300 dark:border-gray-600"
                >
                  {reservationTimeoutOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </motion.div>

            {/* Checkboxes Section - ANIMATED */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4 pt-6 border-t-2 border-gray-200/20 dark:border-gray-700/30"
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
              >
                <AnimatedCheckbox
                  id="showRanking"
                  name="showRanking"
                  checked={formData.showRanking}
                  onChange={handleInputChange}
                  label="Mostrar ranking de compradores"
                  color="blue"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <AnimatedCheckbox
                  id="showPercentage"
                  name="showPercentage"
                  checked={formData.showPercentage}
                  onChange={handleInputChange}
                  label="Mostrar porcentagem de vendas"
                  color="green"
                />
              </motion.div>
            </motion.div>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="pt-4 border-t border-gray-200/20 dark:border-gray-700/30"
            >
              <div className="flex items-start space-x-3 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/30 dark:border-blue-800/30">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 animate-pulse" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Essas configurações afetam como sua campanha é exibida para os compradores. 
                  O ranking mostra os maiores compradores e a porcentagem indica quanto já foi vendido.
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Demo Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200/30 dark:border-purple-800/30"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            🎨 Preview das Configurações
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Ranking:</span>
              <span className={`ml-2 ${formData.showRanking ? 'text-green-600' : 'text-gray-500'}`}>
                {formData.showRanking ? '✓ Ativado' : '✗ Desativado'}
              </span>
            </div>
            <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Porcentagem:</span>
              <span className={`ml-2 ${formData.showPercentage ? 'text-green-600' : 'text-gray-500'}`}>
                {formData.showPercentage ? '✓ Ativado' : '✗ Desativado'}
              </span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default CreateCampaignStep2Page;