import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, CreditCard, Calendar, MessageCircle, Eye } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { ManualPixAPI } from '../lib/api/manualPix';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import ConfirmModal from '../components/ConfirmModal';

type OrderDetails = {
  id: string;
  order_id: string;
  campaign_id: string;
  organizer_id: string;
  customer_phone: string | null;
  customer_name: string | null;
  customer_email: string | null;
  image_url: string;
  signed_url?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  created_at: string;
  reserved_at?: string | null;
  total_value?: number;
  quotas_count?: number;
  payment_method?: string;
  whatsapp_url?: string | null;
};

export default function PixPendingOrderPage() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();
  const { campaignId, orderId } = useParams<{ campaignId: string; orderId: string }>();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PIX Manual');
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!campaignId || !orderId) return;
      setLoading(true);
      const { data, error } = await ManualPixAPI.getOrderDetails(campaignId, orderId);
      if (error) {
        showError('Erro ao carregar pedido');
      }
      setOrder((data as OrderDetails) || null);
      if (data) {
        setName((data as any).customer_name || '');
        setPhone((data as any).customer_phone || '');
        setEmail((data as any).customer_email || '');
        setPaymentMethod((data as any).payment_method || 'PIX Manual');
      }
      setLoading(false);
    };
    load();
  }, [campaignId, orderId, showError]);

  useEffect(() => {
    let timer: any;
    if (campaignId && orderId) {
      timer = setInterval(async () => {
        const { data } = await ManualPixAPI.getOrderDetails(campaignId, orderId);
        if (data) setOrder(data as OrderDetails);
      }, 30000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [campaignId, orderId]);

  useEffect(() => {
    if (!campaignId || !orderId) return;
    const channel = supabase
      .channel(`manual_proof_order_${campaignId}_${orderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'manual_payment_proofs', filter: `campaign_id=eq.${campaignId}` }, (payload) => {
        const updated = payload.new as any;
        if (updated.order_id === orderId) {
          setOrder(prev => prev ? { ...prev, status: updated.status } : prev);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [campaignId, orderId]);

  const isValidEmail = useMemo(() => {
    if (!email) return true;
    return /\S+@\S+\.\S+/.test(email);
  }, [email]);

  const isValidPhone = useMemo(() => {
    const digits = String(phone || '').replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 14;
  }, [phone]);

  const canSubmit = useMemo(() => {
    return name.trim().length > 0 && isValidPhone && isValidEmail && paymentMethod.length > 0;
  }, [name, isValidPhone, isValidEmail, paymentMethod]);

  const handleSaveContact = async () => {
    if (!order) return;
    if (!canSubmit) {
      setFormError('Preencha os campos corretamente');
      return;
    }
    setFormError(null);
    setProcessing(true);
    const { error } = await ManualPixAPI.updateOrderContact(order.campaign_id, order.order_id, {
      name,
      phone,
      email,
      payment_method: paymentMethod,
    });
    setProcessing(false);
    if (error) {
      showError('Falha ao salvar');
      return;
    }
    setOrder(prev => prev ? { ...prev, customer_name: name, customer_phone: phone, customer_email: email, payment_method: paymentMethod } : prev);
    showSuccess('Dados atualizados');
  };

    const performApprove = async () => {
      if (!order) {
        showError('Pedido não carregado');
        return;
      }
      setConfirmLoading(true);
      setProcessing(true);
      const { error } = await ManualPixAPI.approveProof(order.id, order.order_id, order.campaign_id);
      setProcessing(false);
      setConfirmLoading(false);
      setConfirmOpen(false);
      if (error) {
        const msg = String((error as any)?.message || '').toLowerCase();
        if (msg.includes('expired')) {
          showError('Pedido expirado — não pode ser aprovado');
          setOrder(prev => prev ? { ...prev, status: 'expired' } : prev);
        } else {
          showError('Falha ao aprovar pagamento');
        }
        return;
      }
      setOrder(prev => prev ? { ...prev, status: 'approved' } : prev);
      showSuccess('Pagamento aprovado e cotas liberadas');
    };

    const performReject = async () => {
      if (!order) {
        showError('Pedido não carregado');
        return;
      }
      setConfirmLoading(true);
      setProcessing(true);
      const { error } = await ManualPixAPI.rejectProof(order.id);
      setProcessing(false);
      setConfirmLoading(false);
      setConfirmOpen(false);
      if (error) {
        showError('Falha ao rejeitar');
        return;
      }
      setOrder(prev => prev ? { ...prev, status: 'rejected' } : prev);
      showSuccess('Comprovante rejeitado');
    };

    const openConfirm = (action: 'approve' | 'reject') => {
      try {
        setConfirmAction(action);
        setConfirmOpen(true);
      } catch (e) {
        showError('Falha ao abrir modal de confirmação');
      }
    };

  return (
    <div className="min-h-screen text-gray-900 dark:text-white">
      <style>
        {`
          @media (max-width: 640px) {
            ::-webkit-scrollbar {
              width: 8px;
            }
            ::-webkit-scrollbar-track {
              background: linear-gradient(to bottom, rgba(139, 92, 246, 0.05), rgba(219, 39, 119, 0.05));
              border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb {
              background: linear-gradient(to bottom, #a855f7, #ec4899, #3b82f6);
              border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(to bottom, #c084fc, #f472b6);
            }
            ::-webkit-scrollbar-thumb:active {
              background: linear-gradient(to bottom, #7c3aed, #db2777);
            }
          }
          
          @media (min-width: 641px) {
            ::-webkit-scrollbar {
              width: 12px;
            }
            ::-webkit-scrollbar-track {
              background: linear-gradient(to bottom, rgba(139, 92, 246, 0.05), rgba(219, 39, 119, 0.05));
              border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb {
              background: linear-gradient(to bottom, #a855f7, #ec4899, #3b82f6);
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
            }
            ::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(to bottom, #c084fc, #f472b6);
              box-shadow: 0 0 15px rgba(192, 132, 252, 0.6);
            }
          }
        `}
      </style>
      <motion.main initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <button onClick={() => navigate(`/dashboard/pix-approval/${campaignId}`)} className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold">{order?.status === 'approved' ? 'Aprovado' : order?.status === 'rejected' ? 'Rejeitado' : order?.status === 'expired' ? 'Expirado' : 'Pendente'}</h1>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-200/20 dark:border-gray-700/30 p-4">
          {loading || !order ? (
            <div className="animate-pulse h-14 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          ) : (
            <div className="space-y-4">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <div>
                    <div className="font-semibold text-sm truncate">{order.customer_name || 'Cliente'}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-mono truncate">{order.order_id}</div>
                  </div>
                </div>
                <motion.button
                  onClick={() => order.whatsapp_url && window.open(order.whatsapp_url, '_blank')}
                  className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs flex items-center gap-1"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Contatar
                </motion.button>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Phone className="h-4 w-4" />
                  <span>{order.customer_phone || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Mail className="h-4 w-4" />
                  <span>{order.customer_email || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CreditCard className="h-4 w-4" />
                  <span>{order.payment_method || 'PIX Manual'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(order.reserved_at || order.created_at).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span>R$ {Number(order.total_value || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span>Total de cotas: {order.quotas_count || 0}</span>
                </div>
              </div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="rounded-xl border border-gray-200/30 dark:border-gray-700/30 p-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm">Comprovante</div>
                  <motion.button
                    onClick={() => setPreviewUrl(order.signed_url || order.image_url)}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xs flex items-center gap-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Eye className="h-3.5 w-3.5" /> Visualizar comprovante
                  </motion.button>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="rounded-xl border border-gray-200/30 dark:border-gray-700/30 p-3">
                <div className="font-semibold text-sm mb-3">Detalhes da compra</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status</span>
                    <span>
                      {order.status === 'approved' && (
                        <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-transparent text-green-700 border border-green-500">Aprovado</span>
                      )}
                      {order.status === 'rejected' && (
                        <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-transparent text-red-700 border border-red-500">Rejeitado</span>
                      )}
                      {order.status === 'expired' && (
                        <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-transparent text-red-700 border border-red-500">Expirado</span>
                      )}
                      {order.status === 'pending' && (
                        <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-transparent text-yellow-700 border border-yellow-500">Pendente</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Forma de pagamento</span>
                    <span className="text-gray-900 dark:text-white">{order.payment_method || 'PIX Manual'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Data da reserva</span>
                    <span className="text-gray-900 dark:text-white">{new Date(order.reserved_at || order.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Valor total da transação</span>
                    <span className="font-semibold">R$ {Number(order.total_value || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Títulos</span>
                    <span>{order.quotas_count || 0}</span>
                  </div>
                </div>
              </motion.div>

              <div className="flex items-center gap-3">
                <motion.button
                  disabled={processing || order.status !== 'pending'}
                  onClick={() => openConfirm('approve')}
                  className="px-3 py-1.5 rounded-lg text-white text-xs disabled:opacity-50"
                  style={{ backgroundColor: '#4CAF50' }}
                  whileHover={!(processing || order.status !== 'pending') ? { scale: 1.05 } : {}}
                  whileTap={!(processing || order.status !== 'pending') ? { scale: 0.95 } : {}}
                >
                  Aprovar
                </motion.button>
                <motion.button
                  disabled={processing || order.status !== 'pending'}
                  onClick={() => openConfirm('reject')}
                  className="px-3 py-1.5 rounded-lg text-white text-xs disabled:opacity-50"
                  style={{ backgroundColor: '#F44336' }}
                  whileHover={!(processing || order.status !== 'pending') ? { scale: 1.05 } : {}}
                  whileTap={!(processing || order.status !== 'pending') ? { scale: 0.95 } : {}}
                >
                  Rejeitar
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {previewUrl && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
              <div className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
                <img src={previewUrl} alt="Comprovante" className="w-full rounded-2xl border border-gray-700" />
                <div className="mt-3 flex justify-end">
                  <button onClick={() => setPreviewUrl(null)} className="px-4 py-2 rounded-xl bg-gray-900 text-white">Fechar</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>

      <ConfirmModal
        isOpen={confirmOpen}
        title={confirmAction === 'approve' ? 'Confirmar aprovação' : 'Confirmar rejeição'}
        message={confirmAction === 'approve' ? 'Você deseja aprovar este comprovante? Esta ação liberará as cotas.' : 'Você deseja rejeitar este comprovante? Esta ação não poderá ser desfeita.'}
        confirmText="Confirma"
        cancelText="Cancela"
        type={confirmAction === 'approve' ? 'info' : 'danger'}
        loading={confirmLoading}
        onConfirm={() => {
          if (confirmAction === 'approve') {
            void performApprove();
          } else if (confirmAction === 'reject') {
            void performReject();
          }
        }}
        onCancel={() => {
          if (!confirmLoading) {
            setConfirmOpen(false);
            setConfirmAction(null);
          }
        }}
      />
    </div>
  );
}
