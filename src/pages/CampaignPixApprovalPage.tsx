import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '../components/StatusBadge';
import { useNotification } from '../context/NotificationContext';
import { ManualPixAPI } from '../lib/api/manualPix';
import { CampaignAPI } from '../lib/api/campaigns';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/currency';

type PendingRow = {
  id: string;
  order_id: string;
  campaign_id: string;
  organizer_id: string;
  customer_phone: string | null;
  customer_name: string | null;
  customer_email?: string | null;
  image_url: string;
  signed_url?: string | null;
  quotas_count?: number;
  total_value: number;
  payment_method?: string;
  reserved_at?: string | null;
  whatsapp_url?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  created_at: string;
};

const CampaignPixApprovalPage = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();
  const { campaignId } = useParams<{ campaignId: string }>();

  const [rows, setRows] = useState<PendingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [campaignTitle, setCampaignTitle] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<{ pending: boolean; approved: boolean; rejected: boolean; expired: boolean }>({ pending: true, approved: true, rejected: true, expired: true });
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    document.title = 'Minhas vendas';
  }, []);
  useEffect(() => {
    // hydrate filters/search from URL
    const q = params.get('q') || '';
    const s = params.get('status'); // comma-separated statuses
    const min = params.get('min');
    const max = params.get('max');
    const df = params.get('from');
    const dt = params.get('to');
    setSearch(q);
    if (s) {
      const parts = s.split(',');
      setStatusFilter({
        pending: parts.includes('pending'),
        approved: parts.includes('approved'),
        rejected: parts.includes('rejected'),
        expired: parts.includes('expired')
      });
    }
    if (min) setMinValue(min);
    if (max) setMaxValue(max);
    if (df) setDateFrom(df);
    if (dt) setDateTo(dt);
  }, [params]);

  const normalizeNumberInput = (v: string) => {
    if (!v) return '';
    const cleaned = v.replace(/\./g, '').replace(/,/g, '.');
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? cleaned : '';
  };

  const parseNumber = (v: string) => {
    if (!v) return undefined;
    const cleaned = v.replace(/\./g, '').replace(/,/g, '.');
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : undefined;
  };

  const isAllStatusesSelected = (sf: { pending: boolean; approved: boolean; rejected: boolean; expired: boolean }) => sf.pending && sf.approved && sf.rejected && sf.expired;

  const applyFiltersToParams = (overrides?: {
    search?: string;
    statusFilter?: { pending: boolean; approved: boolean; rejected: boolean; expired: boolean };
    minValue?: string;
    maxValue?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const currentSearch = overrides?.search ?? search;
    const currentStatus = overrides?.statusFilter ?? statusFilter;
    const currentMin = overrides?.minValue ?? minValue;
    const currentMax = overrides?.maxValue ?? maxValue;
    const currentFrom = overrides?.dateFrom ?? dateFrom;
    const currentTo = overrides?.dateTo ?? dateTo;

    const entries: [string, string][] = [];
    if (currentSearch.trim()) entries.push(['q', currentSearch.trim()]);

    if (!isAllStatusesSelected(currentStatus)) {
      const statuses = [
        currentStatus.pending && 'pending',
        currentStatus.approved && 'approved',
        currentStatus.rejected && 'rejected',
        currentStatus.expired && 'expired'
      ].filter(Boolean).join(',');
      if (statuses) entries.push(['status', statuses]);
    }

    const normalizedMin = normalizeNumberInput(currentMin);
    const normalizedMax = normalizeNumberInput(currentMax);
    if (normalizedMin) entries.push(['min', normalizedMin]);
    if (normalizedMax) entries.push(['max', normalizedMax]);
    if (currentFrom) entries.push(['from', currentFrom]);
    if (currentTo) entries.push(['to', currentTo]);

    setParams(new URLSearchParams(entries));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    const clearedStatus = { pending: true, approved: true, rejected: true, expired: true };
    setStatusFilter(clearedStatus);
    setMinValue('');
    setMaxValue('');
    setDateFrom('');
    setDateTo('');
    setSearch('');
    setCurrentPage(1);
    applyFiltersToParams({
      search: '',
      statusFilter: clearedStatus,
      minValue: '',
      maxValue: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  useEffect(() => {
    const load = async () => {
      if (!campaignId) return;
      setLoading(true);
      const { data: camp } = await CampaignAPI.getCampaignById(campaignId);
      setCampaignTitle(camp?.title || '');
      const { data, error } = await ManualPixAPI.listOrdersByCampaign(campaignId);
      if (error) showError('Erro ao carregar transações');
      setRows((data as PendingRow[]) || []);
      setLoading(false);
    };
    load();
  }, [campaignId, showError]);

  useEffect(() => {
    if (!campaignId) return;
    const channel = supabase
      .channel(`manual_proofs_${campaignId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'manual_payment_proofs', filter: `campaign_id=eq.${campaignId}` }, (payload) => {
        const updated = payload.new as any;
        setRows(prev => prev.map(r => r.id === updated.id ? { ...r, status: updated.status } : r));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [campaignId]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const passSearch = (r: PendingRow) => !q ||
      (r.order_id?.toLowerCase().includes(q)) ||
      (r.customer_name || '').toLowerCase().includes(q) ||
      (r.customer_phone || '').toLowerCase().includes(q) ||
      String(r.total_value || '').includes(q) ||
      String(r.quotas_count || '').includes(q);

    const passStatus = (r: PendingRow) =>
      (r.status === 'pending' && statusFilter.pending) ||
      (r.status === 'approved' && statusFilter.approved) ||
      (r.status === 'rejected' && statusFilter.rejected) ||
      (r.status === 'expired' && statusFilter.expired);

    const passValue = (r: PendingRow) => {
      const min = parseNumber(minValue);
      const max = parseNumber(maxValue);
      if (min !== undefined && r.total_value < min) return false;
      if (max !== undefined && r.total_value > max) return false;
      return true;
    };

    const passDate = (r: PendingRow) => {
      const ref = r.reserved_at || r.created_at;
      const d = ref ? new Date(ref) : undefined;
      if (!d) return true;
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        if (d < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (d > to) return false;
      }
      return true;
    };

    return rows.filter(r => passSearch(r) && passStatus(r) && passValue(r) && passDate(r));
  }, [rows, search, statusFilter, minValue, maxValue, dateFrom, dateTo]);

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const da = new Date(a.reserved_at || a.created_at);
      const db = new Date(b.reserved_at || b.created_at);
      return db.getTime() - da.getTime();
    });
  }, [filteredRows]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const pagedRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const formatTimeLabel = (iso?: string) => {
    const d = iso ? new Date(iso) : new Date();
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return sameDay ? `Hoje, ${time}` : d.toLocaleDateString();
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
      <motion.main initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <button onClick={() => navigate('/dashboard/pix-approval')} className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold mx-auto">Minhas vendas</h1>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-200/20 dark:border-gray-700/30 p-4">
          <motion.div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2 flex-1">
              <motion.div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 border border-gray-200/30 dark:border-gray-700/30 flex-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { applyFiltersToParams(); } }}
                  placeholder="Buscar"
                  className="w-full bg-transparent outline-none text-sm"
                />
                <Search className="h-4 w-4 text-gray-500" />
              </motion.div>
            </div>
          </motion.div>

          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Resultados ({filteredRows.length})</div>
          </div>

          {/* Filtros de Status sempre visíveis */}
          <div className="rounded-2xl border border-gray-200/40 dark:border-gray-700/40 p-3 bg-white/70 dark:bg-gray-900/60 mb-4">
            <div>
              <div className="text-xs text-gray-600 mb-1">Status</div>
              <div className="flex items-center gap-2 flex-wrap">
                <motion.button aria-pressed={statusFilter.pending} onClick={() => { const next = { ...statusFilter, pending: !statusFilter.pending }; setStatusFilter(next); applyFiltersToParams({ statusFilter: next }); }} className={`px-2 py-1 rounded-lg border text-xs bg-transparent ${statusFilter.pending ? 'text-yellow-700 border-yellow-500' : 'text-gray-700 border-gray-300'}`} whileHover={{ scale: 1.05, boxShadow: '0 0 12px rgba(245, 158, 11, 0.25)' }} transition={{ duration: 0.3 }}>Pendente</motion.button>
                <motion.button aria-pressed={statusFilter.approved} onClick={() => { const next = { ...statusFilter, approved: !statusFilter.approved }; setStatusFilter(next); applyFiltersToParams({ statusFilter: next }); }} className={`px-2 py-1 rounded-lg border text-xs bg-transparent ${statusFilter.approved ? 'text-green-700 border-green-500' : 'text-gray-700 border-gray-300'}`} whileHover={{ scale: 1.05, boxShadow: '0 0 12px rgba(34, 197, 94, 0.25)' }} transition={{ duration: 0.3 }}>Aprovado</motion.button>
                <motion.button aria-pressed={statusFilter.rejected} onClick={() => { const next = { ...statusFilter, rejected: !statusFilter.rejected }; setStatusFilter(next); applyFiltersToParams({ statusFilter: next }); }} className={`px-2 py-1 rounded-lg border text-xs bg-transparent ${statusFilter.rejected ? 'text-red-700 border-red-500' : 'text-gray-700 border-gray-300'}`} whileHover={{ scale: 1.05, boxShadow: '0 0 12px rgba(239, 68, 68, 0.25)' }} transition={{ duration: 0.3 }}>Rejeitado</motion.button>
                <motion.button aria-pressed={statusFilter.expired} onClick={() => { const next = { ...statusFilter, expired: !statusFilter.expired }; setStatusFilter(next); applyFiltersToParams({ statusFilter: next }); }} className={`px-2 py-1 rounded-lg border text-xs bg-transparent ${statusFilter.expired ? 'text-gray-700 border-gray-400' : 'text-gray-700 border-gray-300'}`} whileHover={{ scale: 1.05, boxShadow: '0 0 12px rgba(156, 163, 175, 0.25)' }} transition={{ duration: 0.3 }}>Expirado</motion.button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="animate-pulse h-14 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          ) : pagedRows.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">Resultados (0)</p>
          ) : (
            <div className="space-y-4">
              

              {(() => {
                const chips: { label: string; onClear: () => void }[] = [];
                const statusesSelected = [
                  statusFilter.pending && 'Pendente',
                  statusFilter.approved && 'Aprovado',
                  statusFilter.rejected && 'Rejeitado',
                  statusFilter.expired && 'Expirado'
                ].filter(Boolean) as string[];
                if (statusesSelected.length > 0 && statusesSelected.length < 4) {
                  chips.push({ label: `Status: ${statusesSelected.join(', ')}`, onClear: () => { setStatusFilter({ pending: true, approved: true, rejected: true, expired: true }); applyFiltersToParams(); } });
                }
                
                if (search.trim()) {
                  chips.push({ label: `Busca: ${search.trim()}`, onClear: () => { setSearch(''); applyFiltersToParams(); } });
                }
                return chips.length > 0 ? (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-2">
                    {chips.map((c, idx) => (
                      <motion.button key={idx} onClick={c.onClear} className="inline-flex items-center gap-2 rounded-full border border-purple-300/40 dark:border-purple-800/30 bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 px-3 py-1 text-xs" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <span>{c.label}</span>
                        <span className="font-bold">×</span>
                      </motion.button>
                    ))}
                  </motion.div>
                ) : null;
              })()}

              <AnimatePresence>
                {pagedRows.map((r) => (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="px-2">
                    <motion.div
                      role="button"
                      tabIndex={0}
                      aria-label={`Abrir pedido ${r.order_id}`}
                      onClick={() => navigate(`/dashboard/pix-approval/${r.campaign_id}/pendente/${r.order_id}`)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/dashboard/pix-approval/${r.campaign_id}/pendente/${r.order_id}`); }}
                      className="flex items-start justify-between py-3 border-b cursor-pointer"
                      style={{ borderColor: r.status === 'approved' ? '#22C55E' : r.status === 'rejected' ? '#EF4444' : r.status === 'expired' ? '#9CA3AF' : '#F59E0B' }}
                      whileHover={{ scale: 1.05, boxShadow: r.status === 'approved' ? '0 3px 16px rgba(34, 197, 94, 0.2)' : r.status === 'rejected' ? '0 3px 16px rgba(239, 68, 68, 0.2)' : r.status === 'expired' ? '0 3px 16px rgba(156, 163, 175, 0.2)' : '0 3px 16px rgba(245, 158, 11, 0.2)' }}
                      transition={{ duration: 0.3 }}
                    >
                    <div className="flex items-start gap-3">
                        <div>
                          <div className="text-base font-semibold text-gray-900 dark:text-white">
                            <span className="inline-flex items-center gap-2">
                              {r.status === 'pending' && (<StatusBadge status="pending" />)}
                              {r.status === 'approved' && (<StatusBadge status="approved" />)}
                              {r.status === 'rejected' && (<StatusBadge status="rejected" />)}
                              {r.status === 'expired' && (<StatusBadge status="expired" />)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300">{r.customer_name || '—'}</div>
                          <div className={`text-sm font-semibold ${r.status === 'approved' ? 'text-green-700' : (r.status === 'rejected') ? 'text-red-700' : (r.status === 'expired') ? 'text-gray-700' : 'text-yellow-700'}`}>{formatCurrency(r.total_value || 0)}</div>
                          <div className="text-sm text-gray-600">{r.quotas_count || 0} números</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">{formatTimeLabel(r.reserved_at || r.created_at)}</div>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {totalPages > 1 && (
                <motion.div 
                  className="flex flex-col sm:flex-row items-center justify-between rounded-xl bg-white/60 dark:bg-gray-900/50 border border-gray-200/20 dark:border-gray-800/30 backdrop-blur-sm"
                  style={{ gap: '12px', padding: '16px', marginTop: '16px' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="font-medium text-gray-700 dark:text-gray-300 text-center sm:text-left text-sm">
                    Mostrando <span className="font-bold text-purple-600 dark:text-purple-400">{((currentPage - 1) * pageSize) + 1}</span> a <span className="font-bold text-purple-600 dark:text-purple-400">{Math.min(currentPage * pageSize, filteredRows.length)}</span> de <span className="font-bold text-purple-600 dark:text-purple-400">{filteredRows.length}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <motion.button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                      disabled={currentPage === 1} 
                      className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200/20 dark:border-gray-700/30 font-semibold transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-800 px-3 py-2 text-sm"
                      whileHover={currentPage !== 1 ? { scale: 1.05 } : {}}
                      whileTap={currentPage !== 1 ? { scale: 0.95 } : {}}
                    >
                      Anterior
                    </motion.button>
                    <motion.div 
                      className="rounded-lg font-bold bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-900 dark:text-purple-100 border border-purple-200/30 dark:border-purple-800/30 px-4 py-2 text-sm"
                      whileHover={{ scale: 1.05 }}
                    >
                      {currentPage} de {totalPages}
                    </motion.div>
                    <motion.button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                      disabled={currentPage === totalPages} 
                      className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200/20 dark:border-gray-700/30 font-semibold transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-800 px-3 py-2 text-sm"
                      whileHover={currentPage !== totalPages ? { scale: 1.05 } : {}}
                      whileTap={currentPage !== totalPages ? { scale: 0.95 } : {}}
                    >
                      Próximo
                    </motion.button>
                  </div>
                </motion.div>
              )}
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
    </div>
  );
};

export default CampaignPixApprovalPage;
