import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Search, Phone, User, Ticket } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { ManualPixAPI } from '../lib/api/manualPix';
import ConfirmModal from '../components/ConfirmModal';
import { CampaignAPI } from '../lib/api/campaigns';
import { supabase } from '../lib/supabase';

type PendingRow = {
  id: string;
  order_id: string;
  campaign_id: string;
  organizer_id: string;
  customer_phone: string | null;
  customer_name: string | null;
  image_url: string;
  signed_url?: string | null;
  quotas: number[];
  total_value: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

const CampaignPixApprovalPage = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();
  const { campaignId } = useParams<{ campaignId: string }>();

  const [rows, setRows] = useState<PendingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [campaignTitle, setCampaignTitle] = useState<string>('');

  useEffect(() => {
    document.title = 'Aprovação de PIX - Campanha';
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!campaignId) return;
      setLoading(true);
      const { data: camp } = await CampaignAPI.getCampaignById(campaignId);
      setCampaignTitle(camp?.title || '');
      const { data, error } = await ManualPixAPI.listPendingByCampaign(campaignId);
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
    if (!q) return rows;
    return rows.filter(r =>
      (r.order_id?.toLowerCase().includes(q)) ||
      (r.customer_name || '').toLowerCase().includes(q) ||
      (r.customer_phone || '').toLowerCase().includes(q) ||
      r.quotas.join(',').includes(q)
    );
  }, [rows, search]);

  

  return (
    <div className="min-h-screen text-gray-900 dark:text-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <button onClick={() => navigate('/dashboard/pix-approval')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold">Campanha • {campaignTitle}</h1>
        </div>

        <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-200/20 dark:border-gray-700/30 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por pedido, cliente, telefone ou cota"
                className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 border border-gray-200/30 dark:border-gray-700/30 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-3 py-2">Pedido</th>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">Cotas</th>
                  <th className="px-3 py-2">Valor</th>
                  <th className="px-3 py-2">Telefone</th>
                  <th className="px-3 py-2">Comprovante</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-3 py-6"><div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-800 rounded-lg" /></td></tr>
                ) : filteredRows.length === 0 ? (
                  <tr><td colSpan={8} className="px-3 py-6 text-gray-600 dark:text-gray-400">Nenhuma transação pendente</td></tr>
                ) : (
                  filteredRows.map((r) => (
                    <tr key={r.id} className="border-t border-gray-200/30 dark:border-gray-700/30">
                      <td className="px-3 py-2 font-mono text-xs">{r.order_id}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{r.customer_name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Ticket className="h-4 w-4" />
                          <span>{r.quotas.join(', ')}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">R$ {r.total_value.toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{r.customer_phone || '—'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <button onClick={() => setPreviewUrl(r.signed_url || r.image_url)} className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200/30 dark:border-gray-700/30">
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <span className={r.status === 'pending' ? 'text-amber-600' : r.status === 'approved' ? 'text-green-600' : 'text-red-600'}>
                          {r.status === 'pending' ? 'Pendente' : r.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            disabled={r.status !== 'pending'}
                            onClick={() => setConfirmId(r.id)}
                            className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs disabled:opacity-50"
                          >
                            Aprovar
                          </button>
                          <button
                            disabled={r.status !== 'pending'}
                            onClick={async () => {
                              const { error } = await ManualPixAPI.rejectProof(r.id);
                              if (error) showError('Falha ao rejeitar');
                              else {
                                setRows(prev => prev.map(x => x.id === r.id ? { ...x, status: 'rejected' } : x));
                                showSuccess('Comprovante rejeitado');
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs disabled:opacity-50"
                          >
                            Rejeitar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <ConfirmModal
          isOpen={!!confirmId}
          title="Confirmar aprovação"
          message="Ao confirmar, todas as cotas deste pedido serão liberadas como 'Comprada'. Esta ação é irreversível. Deseja continuar?"
          confirmText="Aprovar"
          cancelText="Cancelar"
          loading={processing}
          onCancel={() => setConfirmId(null)}
          onConfirm={async () => {
            if (!confirmId) return;
            const row = rows.find(r => r.id === confirmId);
            if (!row) { setConfirmId(null); return; }
            setProcessing(true);
            const { error } = await ManualPixAPI.approveProof(row.id, row.order_id, row.campaign_id);
            setProcessing(false);
            if (error) {
              showError('Falha ao aprovar pagamento');
              return;
            }
            setRows(prev => prev.map(r => r.id === row.id ? { ...r, status: 'approved' } : r));
            setConfirmId(null);
            showSuccess('Pagamento aprovado e cotas liberadas');
          }}
          type="info"
        />

        {previewUrl && (
          <div className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
            <div className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
              <img src={previewUrl} alt="Comprovante" className="w-full rounded-2xl border border-gray-700" />
              <div className="mt-3 flex justify-end">
                <button onClick={() => setPreviewUrl(null)} className="px-4 py-2 rounded-xl bg-gray-900 text-white">Fechar</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CampaignPixApprovalPage;
