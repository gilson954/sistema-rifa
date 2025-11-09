// src/pages/AccountPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Pencil,
  Link,
  Trash2,
  X,
  ArrowRight,
  ChevronDown,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { supabase } from '../lib/supabase';
import CountryPhoneSelect from '../components/CountryPhoneSelect';
import { useStripe } from '../hooks/useStripe';
import { translateAuthError } from '../utils/errorTranslators';
import ConfirmModal from '../components/ConfirmModal';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

// Add countries array at the top of the file (after imports)
const countries: Country[] = [
  { code: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canadá', dialCode: '+1', flag: '🇨🇦' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colômbia', dialCode: '+57', flag: '🇨🇴' },
  { code: 'PE', name: 'Peru', dialCode: '+51', flag: '🇵🇪' },
  { code: 'UY', name: 'Uruguai', dialCode: '+598', flag: '🇺🇾' },
  { code: 'PY', name: 'Paraguai', dialCode: '+595', flag: '🇵🇾' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
];

const AccountPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { orders, getCompletedOrders } = useStripe();
  const { showSuccess, showError, showInfo } = useNotification();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    cpf: '',
    phoneNumber: ''
  });
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: 'BR',
    name: 'Brasil',
    dialCode: '+55',
    flag: '🇧🇷'
  });
  const [loading, setLoading] = useState(true);
  const [sendingResetLink, setSendingResetLink] = useState(false);
  const [resetLinkSent, setResetLinkSent] = useState(false);

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
          .select('name, email, avatar_url, cpf, phone_number')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          setUserData(prev => ({
            ...prev,
            name: prev.name || '',
            email: user.email || '',
            cpf: '',
            phoneNumber: ''
          }));
        } else if (profile) {
          let countryCode = '+55';
          let phoneOnly = '';
          
          if (profile.phone_number) {
            const phoneMatch = profile.phone_number.match(/^(\+\d+)\s(.+)$/);
            if (phoneMatch) {
              countryCode = phoneMatch[1];
              phoneOnly = phoneMatch[2];
            } else {
              phoneOnly = profile.phone_number;
            }
          }
          
          const matchingCountry = countries.find(c => c.dialCode === countryCode) || selectedCountry;
          setSelectedCountry(matchingCountry);
          
          setUserData(prev => ({
            ...prev,
            name: profile.name || '',
            email: profile.email || '',
            cpf: profile.cpf || '',
            phoneNumber: phoneOnly
          }));
          setProfileImageUrl(profile.avatar_url || null);
        } else {
          setUserData(prev => ({
            ...prev,
            name: prev.name || '',
            email: user.email || '',
            cpf: '',
            phoneNumber: ''
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!userData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (userData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!userData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email.trim())) {
      newErrors.email = 'Email inválido';
    }

    if (userData.cpf.trim()) {
      const cpfNumbers = userData.cpf.replace(/\D/g, '');
      if (cpfNumbers.length !== 11) {
        newErrors.cpf = 'CPF deve ter 11 dígitos';
      } else if (!isValidCPF(cpfNumbers)) {
        newErrors.cpf = 'CPF inválido';
      }
    }

    if (userData.phoneNumber.trim()) {
      const phoneNumbers = userData.phoneNumber.replace(/\D/g, '');
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

  const isValidCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    let sum = 0;
    let remainder;
    
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
    
    return true;
  };

  const formatCPF = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    const limitedNumbers = numbers.slice(0, 11);
    
    if (limitedNumbers.length <= 3) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 6) {
      return `${limitedNumbers.slice(0, 3)}.${limitedNumbers.slice(3)}`;
    } else if (limitedNumbers.length <= 9) {
      return `${limitedNumbers.slice(0, 3)}.${limitedNumbers.slice(3, 6)}.${limitedNumbers.slice(6)}`;
    } else {
      return `${limitedNumbers.slice(0, 3)}.${limitedNumbers.slice(3, 6)}.${limitedNumbers.slice(6, 9)}-${limitedNumbers.slice(9)}`;
    }
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCPF = formatCPF(e.target.value);
    setUserData({ ...userData, cpf: formattedCPF });
  };

  const handleEditData = () => {
    setErrors({});
    setShowEditModal(true);
  };

  const handleSaveData = async () => {
    if (!validateForm()) return;
    if (!user) return;

    try {
      const fullPhoneNumber = userData.phoneNumber.trim() 
        ? `${selectedCountry.dialCode} ${userData.phoneNumber.trim()}`
        : null;
      
      const cleanCPF = userData.cpf.trim() 
        ? userData.cpf.replace(/\D/g, '')
        : null;

      const { error } = await supabase
        .from('profiles')
        .update({
          name: userData.name,
          email: userData.email,
          cpf: cleanCPF,
          phone_number: fullPhoneNumber
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        showError(translateAuthError(error.message || 'Erro ao salvar dados. Tente novamente.'));
      } else {
        setShowEditModal(false);
        showSuccess('Dados salvos com sucesso!');
      }
    } catch (err: any) {
      console.error('Error saving user data:', err);
      showError(translateAuthError(err.message || 'Erro ao salvar dados. Tente novamente.'));
    }
  };

  const handleSendResetLink = async () => {
    if (!user?.email) {
      showError('Email do usuário não encontrado');
      return;
    }

    setSendingResetLink(true);
    setResetLinkSent(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Error sending reset link:', error);
        showError(translateAuthError(error.message));
      } else {
        setResetLinkSent(true);
        showSuccess(`Link de redefinição enviado para ${user.email}! Verifique sua caixa de entrada (e também a pasta de spam).`);
      }
    } catch (err: any) {
      console.error('Error sending reset link:', err);
      showError(translateAuthError(err.message || 'Erro ao enviar link de redefinição. Tente novamente.'));
    } finally {
      setSendingResetLink(false);
    }
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

      showSuccess('Conta excluída com sucesso');
      await signOut();
      window.location.href = '/login';
    } catch (err: any) {
      console.error('Error deleting account:', err);
      showError(translateAuthError(err.message || 'Erro ao excluir conta. Tente novamente.'));
    } finally {
      setDeleting(false);
      setShowDeleteConfirmModal(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-transparent">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-200/10 dark:border-gray-800/20 bg-white/6 dark:bg-gray-900/40">
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-purple-600" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const avatarInitial = (nameOrEmail: string | undefined) => {
    const source = nameOrEmail || user?.email || '';
    if (!source) return 'U';
    return source.trim()[0].toUpperCase();
  };

  return (
    <div className="bg-transparent min-h-screen">
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
      <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-200/10 dark:border-gray-800/20 bg-white/6 dark:bg-gray-900/40">
          <div className="flex items-start justify-between mb-4 sm:mb-6 gap-2 sm:gap-3">
            <div>
              <h1 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white">Minha conta</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie seus dados pessoais, redefina senha ou exclua sua conta.</p>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={handleEditData}
                title="Editar"
                className="p-1.5 sm:p-2 rounded-lg bg-gray-800/40 hover:bg-gray-800/30 transition"
              >
                <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
            <div className="col-span-1 flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-white/3 dark:bg-black/10">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-400 flex items-center justify-center text-white text-base sm:text-lg font-semibold shadow overflow-hidden">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span>{avatarInitial(userData.name || user?.email)}</span>
                )}
              </div>
              <div>
                <div className="text-xs sm:text-sm text-gray-400">Usuário</div>
                <div className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{userData.name || '-'}</div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{userData.email || '-'}</div>
              </div>
            </div>

            <div className="col-span-2 p-3 sm:p-4 rounded-xl bg-white/3 dark:bg-black/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm text-gray-400">Nome</label>
                  <div className="mt-1 text-sm sm:text-base font-medium text-gray-900 dark:text-white">{userData.name || '-'}</div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm text-gray-400">Email</label>
                  <div className="mt-1 text-sm sm:text-base font-medium text-gray-900 dark:text-white">{userData.email || '-'}</div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm text-gray-400">CPF</label>
                  <div className="mt-1 text-sm sm:text-base font-medium text-gray-900 dark:text-white">{userData.cpf || '-'}</div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm text-gray-400">Telefone</label>
                  <div className="mt-1 text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                    {userData.phoneNumber ? `${selectedCountry.dialCode} ${userData.phoneNumber}` : '-'}
                  </div>
                </div>
              </div>

              <div className="mt-4 sm:mt-6">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Resetar senha</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Você receberá um link via e-mail para redefinir a sua senha.</p>

                <div className="mt-3 sm:mt-4">
                  <button
                    onClick={handleSendResetLink}
                    disabled={sendingResetLink}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold text-white transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                               animate-gradient-x bg-[length:200%_200%] bg-gradient-to-br from-purple-600 via-pink-500 to-indigo-600"
                  >
                    {sendingResetLink ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                        <span>Enviando...</span>
                      </>
                    ) : resetLinkSent ? (
                      <>
                        <span>Link enviado!</span>
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      </>
                    ) : (
                      <>
                        <span>Enviar link</span>
                        <Link className="h-3 w-3 sm:h-4 sm:w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-4 sm:mt-6">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Excluir minha conta</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Lembre-se de que esta ação é irreversível e removerá permanentemente todas as suas informações e dados pessoais de nossa plataforma; você não pode ter rifas em andamento.
                </p>

                <div className="mt-3 sm:mt-4">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg bg-gradient-to-r from-red-600 to-rose-500 text-white font-medium hover:opacity-95 transition disabled:opacity-50"
                  >
                    <span>{deleting ? 'Excluindo...' : 'Quero excluir'}</span>
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {getCompletedOrders().length > 0 && (
            <div className="mt-4 sm:mt-6">
              <h4 className="text-xs sm:text-sm font-semibold text-gray-400 mb-2 sm:mb-3">Histórico de Compras recentes</h4>
              <div className="space-y-2 sm:space-y-3">
                {getCompletedOrders().slice(0, 3).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-white/3 dark:bg-black/10">
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Rifaqui - Taxa de Publicação</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(order.created_at).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">R$ {(order.amount_total / 100).toFixed(2).replace('.', ',')}</div>
                      <div className="text-xs text-green-600 dark:text-green-400">Pago</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Editar dados pessoais</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-4">Preencha os campos abaixo para editar seus dados pessoais.</p>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">Nome completo</label>
                <input
                  type="text"
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm rounded-lg bg-white dark:bg-gray-700 border border-purple-500 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {errors.name && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">Email</label>
                <input
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm rounded-lg bg-white dark:bg-gray-700 border text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.email && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">CPF (opcional)</label>
                <input
                  type="text"
                  value={userData.cpf}
                  onChange={handleCPFChange}
                  placeholder="000.000.000-00"
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm rounded-lg bg-white dark:bg-gray-700 border text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.cpf ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.cpf && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.cpf}</p>}
              </div>

              <div>
                <CountryPhoneSelect
                  selectedCountry={selectedCountry}
                  onCountryChange={(c: Country) => setSelectedCountry(c)}
                  phoneNumber={userData.phoneNumber}
                  onPhoneChange={(value: string) => setUserData({ ...userData, phoneNumber: value })}
                  placeholder="Número de telefone"
                  error={errors.phoneNumber}
                />
              </div>

              <button
                onClick={handleSaveData}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 sm:py-3 text-xs sm:text-sm rounded-lg bg-gradient-to-br from-purple-600 via-blue-500 to-indigo-600 text-white font-semibold"
              >
                <span>Salvar</span>
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Excluir</h2>
              <button onClick={() => setShowDeleteConfirmModal(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </button>
            </div>

            <div className="mb-4 sm:mb-6">
              <div className="flex items-start space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  Você tem certeza de que quer excluir sua conta de forma permanente? Essa ação não pode ser desfeita e seu e-mail não poderá ser reutilizado.
                </p>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                disabled={deleting}
                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-900 dark:text-white py-2 sm:py-3 text-xs sm:text-sm rounded-lg font-medium transition"
              >
                Cancelar
              </button>

              <button
                onClick={confirmDeleteAccount}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-2 sm:py-3 text-xs sm:text-sm rounded-lg font-medium transition"
              >
                {deleting ? (
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mx-auto" />
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