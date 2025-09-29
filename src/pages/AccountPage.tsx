// src/pages/AccountPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Pencil,
  Link,
  Trash2,
  X,
  ArrowRight,
  ChevronDown,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import CountryPhoneSelect from '../components/CountryPhoneSelect';
import { useStripe } from '../hooks/useStripe';
import { translateAuthError } from '../utils/errorTranslators';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

const AccountPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { orders, getCompletedOrders } = useStripe();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    cpf: '',
  });
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: 'BR',
    name: 'Brasil',
    dialCode: '+55',
    flag: '🇧🇷'
  });
  const [phoneNumberInput, setPhoneNumberInput] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('name, email, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          // fallback to auth email
          setUserData(prev => ({
            ...prev,
            name: prev.name || '',
            email: user.email || ''
          }));
        } else if (profile) {
          setUserData(prev => ({
            ...prev,
            name: profile.name || '',
            email: profile.email || ''
          }));
          setProfileImageUrl(profile.avatar_url || null);
        } else {
          setUserData(prev => ({
            ...prev,
            name: prev.name || '',
            email: user.email || ''
          }));
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Validate form data
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!userData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!userData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (userData.cpf.trim()) {
      const cpfNumbers = userData.cpf.replace(/\D/g, '');
      if (cpfNumbers.length !== 11) {
        newErrors.cpf = 'CPF deve ter 11 dígitos';
      }
    }

    if (phoneNumberInput.trim()) {
      const phoneNumbers = phoneNumberInput.replace(/\D/g, '');
      if (selectedCountry.code === 'BR' && phoneNumbers.length !== 11) {
        newErrors.phoneNumber = 'Número de celular deve ter 11 dígitos';
      } else if ((selectedCountry.code === 'US' || selectedCountry.code === 'CA') && phoneNumbers.length !== 10) {
        newErrors.phoneNumber = 'Número de telefone deve ter 10 dígitos';
      } else if (phoneNumbers.length < 7) {
        newErrors.phoneNumber = 'Número de telefone inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditData = () => {
    setErrors({});
    setShowEditModal(true);
  };

  const handleSaveData = async () => {
    if (!validateForm()) return;
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: userData.name,
          email: userData.email
          // intencional: mantive atualização somente de name/email como no original
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        alert(translateAuthError(error.message || 'Erro ao salvar dados. Tente novamente.'));
      } else {
        setShowEditModal(false);
      }
    } catch (err: any) {
      console.error('Error saving user data:', err);
      alert(translateAuthError(err.message || 'Erro ao salvar dados. Tente novamente.'));
    }
  };

  const handleSendResetLink = () => {
    // lógica real pode ser integrada com backend -> por enquanto placeholder
    console.log('Sending password reset link');
    alert('Link de redefinição enviado (placeholder).');
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!user) return;

    setDeleting(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/delete-user-account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.id })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(translateAuthError(result.message || 'Erro ao excluir conta'));
      }

      alert('Conta excluída com sucesso');
      await signOut();
      window.location.href = '/login';
    } catch (err: any) {
      console.error('Error deleting account:', err);
      alert(translateAuthError(err.message || 'Erro ao excluir conta. Tente novamente.'));
    } finally {
      setDeleting(false);
      setShowDeleteConfirmModal(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-2xl p-6 shadow-sm border border-gray-200/10 dark:border-gray-800/20 bg-white/6 dark:bg-gray-900/40">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper to display initials if no avatar url
  const avatarInitial = (nameOrEmail: string | undefined) => {
    const source = nameOrEmail || user?.email || '';
    if (!source) return 'U';
    return source.trim()[0].toUpperCase();
  };

  return (
    <div className="bg-transparent min-h-screen">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Card wrapper */}
        <div className="rounded-2xl p-6 shadow-sm border border-gray-200/10 dark:border-gray-800/20 bg-white/6 dark:bg-gray-900/40">
          {/* Top header of card */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Minha conta</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie seus dados pessoais, redefina senha ou exclua sua conta.</p>
            </div>

            <div className="flex items-center space-x-3">
              {/* Removed "Alterar foto" button as requested */}

              {/* Small edit icon */}
              <button
                onClick={handleEditData}
                title="Editar"
                className="p-2 rounded-lg bg-gray-800/40 hover:bg-gray-800/30 transition"
              >
                <Pencil className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>

          {/* Content grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Avatar / basic info */}
            <div className="col-span-1 flex items-center gap-4 p-4 rounded-xl bg-white/3 dark:bg-black/10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-400 flex items-center justify-center text-white text-lg font-semibold shadow overflow-hidden">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span>{avatarInitial(userData.name || user?.email)}</span>
                )}
              </div>
              <div>
                <div className="text-sm text-gray-400">Usuário</div>
                <div className="font-medium text-gray-900 dark:text-white">{userData.name || '-'}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{userData.email || '-'}</div>
              </div>
            </div>

            {/* Main fields */}
            <div className="col-span-2 p-4 rounded-xl bg-white/3 dark:bg-black/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400">Nome</label>
                  <div className="mt-1 font-medium text-gray-900 dark:text-white">{userData.name || '-'}</div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400">Email</label>
                  <div className="mt-1 font-medium text-gray-900 dark:text-white">{userData.email || '-'}</div>
                </div>
              </div>

              {/* Reset password */}
              <div className="mt-6">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Resetar senha</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Você receberá um link via e-mail para redefinir a sua senha.</p>

                <div className="mt-4">
                  <button
                    onClick={handleSendResetLink}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition transform hover:-translate-y-0.5
                               animate-gradient-x bg-[length:200%_200%] bg-gradient-to-br from-purple-600 via-pink-500 to-indigo-600"
                  >
                    <span>Enviar link</span>
                    <Link className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Delete account */}
              <div className="mt-6">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Excluir minha conta</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Lembre-se de que esta ação é irreversível e removerá permanentemente todas as suas informações e dados pessoais de nossa plataforma; você não pode ter rifas em andamento.
                </p>

                <div className="mt-4">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-500 text-white font-medium hover:opacity-95 transition disabled:opacity-50"
                  >
                    <span>{deleting ? 'Excluindo...' : 'Quero excluir'}</span>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Optional purchase history (kept smaller / below) */}
          {getCompletedOrders().length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-400 mb-3">Histórico de Compras recentes</h4>
              <div className="space-y-3">
                {getCompletedOrders().slice(0, 3).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-white/3 dark:bg-black/10">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Rifaqui - Taxa de Publicação</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{new Date(order.created_at).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900 dark:text-white">R$ {(order.amount_total / 100).toFixed(2).replace('.', ',')}</div>
                      <div className="text-sm text-green-600 dark:text-green-400">Pago</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Edit Data Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Editar dados pessoais</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Preencha os campos abaixo para editar seus dados pessoais.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Nome completo</label>
                <input
                  type="text"
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-white dark:bg-gray-700 border border-purple-500 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg bg-white dark:bg-gray-700 border text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">CPF (opcional)</label>
                <input
                  type="text"
                  value={userData.cpf}
                  onChange={(e) => setUserData({ ...userData, cpf: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg bg-white dark:bg-gray-700 border text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.cpf ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.cpf && <p className="text-red-500 text-sm mt-1">{errors.cpf}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Telefone (opcional)</label>
                <div className="flex gap-2">
                  <div className="w-36">
                    <CountryPhoneSelect
                      value={selectedCountry}
                      onChange={(c: Country) => setSelectedCountry(c)}
                    />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumberInput}
                    onChange={(e) => setPhoneNumberInput(e.target.value)}
                    className={`flex-1 px-4 py-3 rounded-lg bg-white dark:bg-gray-700 border text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.phoneNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Número de telefone"
                  />
                </div>
                {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
              </div>

              <button
                onClick={handleSaveData}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-br from-purple-600 via-blue-500 to-indigo-600 text-white font-semibold"
              >
                <span>Salvar</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Excluir</h2>
              <button onClick={() => setShowDeleteConfirmModal(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-start space-x-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Você tem certeza de que quer excluir sua conta de forma permanente? Essa ação não pode ser desfeita e seu e-mail não poderá ser reutilizado.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                disabled={deleting}
                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-900 dark:text-white py-3 rounded-lg font-medium transition"
              >
                Cancelar
              </button>

              <button
                onClick={confirmDeleteAccount}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-3 rounded-lg font-medium transition"
              >
                {deleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <span>Confirmar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountPage;
