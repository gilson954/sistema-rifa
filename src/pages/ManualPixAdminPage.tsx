import { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import PixLogo from '../components/pix/PixLogo';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { ManualPixAPI } from '../lib/api/manualPix';

type Proof = {
  id: string;
  order_id: string;
  campaign_id: string;
  organizer_id: string;
  customer_phone: string | null;
  customer_name: string | null;
  image_url: string;
  signed_url?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

export default function ManualPixAdminPage() {
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [pending, setPending] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await ManualPixAPI.listPendingProofs(user.id);
      if (error) showError('Erro ao carregar comprovantes');
      setPending((data as Proof[]) || []);
      setLoading(false);
    };
    load();
  }, [user, showError]);

  return (
    <div className="min-h-screen text-gray-900 dark:text-white">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <PixLogo variant="icon" className="h-5 w-5" />
          <h1 className="text-xl sm:text-2xl font-bold">Aprovação de PIX manual</h1>
        </div>

        <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/20 dark:border-gray-700/30 p-3 sm:p-4">
          {loading ? (
            <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          ) : pending.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">Nenhum comprovante pendente</p>
          ) : (
            <div className="space-y-3">
              {pending.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 border border-gray-200/30 dark:border-gray-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img src={p.signed_url || p.image_url} alt="Comprovante" className="w-16 h-16 rounded-lg object-cover" />
                    <div>
                      <p className="text-sm font-semibold">Pedido {p.order_id}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Cliente: {p.customer_name || '—'} • {p.customer_phone || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        const { error } = await ManualPixAPI.approveProof(p.id, p.order_id, p.campaign_id);
                        if (error) {
                          showError('Falha ao aprovar');
                        } else {
                          setPending((prev) => prev.filter((x) => x.id !== p.id));
                          showSuccess('Pagamento aprovado e números liberados');
                        }
                      }}
                      className="px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={async () => {
                        const { error } = await ManualPixAPI.rejectProof(p.id);
                        if (error) {
                          showError('Falha ao rejeitar');
                        } else {
                          setPending((prev) => prev.filter((x) => x.id !== p.id));
                          showSuccess('Comprovante rejeitado');
                        }
                      }}
                      className="px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
