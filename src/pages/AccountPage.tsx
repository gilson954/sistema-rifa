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
  CheckCircle,
  ShoppingBag,
  Mail,
  User,
  Lock,
  Phone,
  CreditCard
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

  // Validate form data
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

  // CPF validation function
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

  // Format CPF for display
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
        alert(translateAuthError(error.message || 'Erro ao salvar dados. Tente novamente.'));
      } else {
        setShowEditModal(false);
        alert('Dados salvos com sucesso!');
      }
    } catch (err: any) {
      console.error('Error saving user data:', err);
      alert(translateAuthError(err.message || 'Erro ao salvar dados. Tente novamente.'));
    }
  };

  const handleSendResetLink = async () => {
    if (!user?.email) {
      alert('Email do usuário não encontrado');
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
        alert(translateAuthError(error.message));
      } else {
        setResetLinkSent(true);
        alert(`✅ Link de redefinição enviado para ${user.email}!\n\nVerifique sua caixa de entrada (e também a pasta de spam).`);
      }
    } catch (err: any) {
      console.error('Error sending reset link:', err);
      alert(translateAuthError(err.message || 'Erro ao enviar link de redefinição. Tente novamente.'));
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-purple-900/20 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl p-12">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 dark:border-purple-900"></div>
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-purple-600 absolute top-0 left-0"></div>
              </div>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-purple-900/20 p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-700 dark:to-pink-700 rounded-3xl p-8 shadow-2xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold shadow-lg overflow-hidden">
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{avatarInitial(userData.name || user?.email)}</span>
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Minha Conta</h1>
                  <p className="text-white/80 text-sm mt-1">Gerencie suas informações pessoais</p>
                </div>
              </div>
              <button
                onClick={handleEditData}
                className="group flex items-center space-x-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Pencil className="h-4 w-4 text-white group-hover:rotate-12 transition-transform duration-300" />
                <span className="text-white font-medium">Editar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Data Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-6 md:p-8 transition-all duration-300 hover:shadow-2xl">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <User className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dados Principais
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group p-5 bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-900/50 dark:to-purple-900/20 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:shadow-md">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                <User className="h-4 w-4" />
                <span>Nome Completo</span>
              </label>
              <p className="text-lg text-gray-900 dark:text-white font-semibold">{userData.name || '-'}</p>
            </div>
            
            <div className="group p-5 bg-gradient-to-br from-gray-50 to-pink-50/30 dark:from-gray-900/50 dark:to-pink-900/20 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:shadow-md">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </label>
              <p className="text-lg text-gray-900 dark:text-white font-semibold break-all">{userData.email || '-'}</p>
            </div>

            <div className="group p-5 bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900/50 dark:to-blue-900/20 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:shadow-md">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                <CreditCard className="h-4 w-4" />
                <span>CPF</span>
              </label>
              <p className="text-lg text-gray-900 dark:text-white font-semibold">{userData.cpf || '-'}</p>
            </div>

            <div className="group p-5 bg-gradient-to-br from-gray-50 to-green-50/30 dark:from-gray-900/50 dark:to-green-900/20 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:shadow-md">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                <Phone className="h-4 w-4" />
                <span>Telefone</span>
              </label>
              <p className="text-lg text-gray-900 dark:text-white font-semibold">
                {userData.phoneNumber ? `${selectedCountry.dialCode} ${userData.phoneNumber}` : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Reset Password Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-6 md:p-8 transition-all duration-300 hover:shadow-2xl">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Resetar Senha
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            Você receberá um link via email para redefinir a sua senha
          </p>

          <button
            onClick={handleSendResetLink}
            disabled={sendingResetLink}
            className="group w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-blue-400 disabled:to-cyan-400 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl hover:scale-[1.02]"
          >
            {sendingResetLink ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Enviando...</span>
              </>
            ) : resetLinkSent ? (
              <>
                <span>Link enviado!</span>
                <CheckCircle className="h-5 w-5" />
              </>
            ) : (
              <>
                <span>Enviar Link de Redefinição</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </>
            )}
          </button>
        </div>

        {/* Purchase History */}
        {getCompletedOrders().length > 0 && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-6 md:p-8 transition-all duration-300 hover:shadow-2xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Histórico de Compras
              </h2>
            </div>
            <div className="space-y-3">
              {getCompletedOrders().slice(0, 5).map((order, index) => (
                <div
                  key={order.id}
                  className="group bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-900/50 dark:to-purple-900/20 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border border-gray-200/50 dark:border-gray-700/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white mb-1">
                        Rifaqui - Taxa de Publicação
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xl text-gray-900 dark:text-white mb-1">
                        R$ {(order.amount_total / 100).toFixed(2).replace('.', ',')}
                      </div>
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        ✓ Pago
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delete Account Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-red-200/50 dark:border-red-900/50 shadow-xl p-6 md:p-8 transition-all duration-300 hover:shadow-2xl">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Zona de Perigo
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            Lembre-se de que esta ação é irreversível e removerá permanentemente todas as suas informações e dados pessoais 
            de nossa plataforma, você não pode ter rifas em andamento
          </p>

          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="group bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl hover:scale-[1.02]"
          >
            <Trash2 className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
            <span>{deleting ? 'Excluindo...' : 'Excluir Minha Conta'}</span>
          </button>
        </div>
      </div>

      {/* Edit Data Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-lg shadow-2xl transform transition-all duration-300 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Editar Dados Pessoais
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Atualize suas informações
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:rotate-90"
              >
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </label>
                <input
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                  className={`w-full bg-gray-50 dark:bg-gray-900 border-2 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all duration-200 ${
                    errors.email ? 'border-red-500 focus:border-red-500' : 'border-purple-200 dark:border-purple-800 focus:border-purple-500'
                  }`}
                  placeholder="seu@email.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-2 flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <CreditCard className="h-4 w-4" />
                  <span>CPF (opcional)</span>
                </label>
                <input
                  type="text"
                  value={userData.cpf}
                  onChange={handleCPFChange}
                  placeholder="000.000.000-00"
                  className={`w-full bg-gray-50 dark:bg-gray-900 border-2 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all duration-200 ${
                    errors.cpf ? 'border-red-500 focus:border-red-500' : 'border-purple-200 dark:border-purple-800 focus:border-purple-500'
                  }`}
                />
                {errors.cpf && (
                  <p className="text-red-500 text-sm mt-2 flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{errors.cpf}</span>
                  </p>
                )}
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
            </div>

            <button
              onClick={handleSaveData}
              className="group w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 mt-8 shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              <span>Salvar Alterações</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-md shadow-2xl transform transition-all duration-300 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Confirmar Exclusão
              </h2>
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:rotate-90"
              >
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>
            
            <div className="mb-8">
              <div className="flex items-start space-x-4 p-5 bg-red-50 dark:bg-red-900/20 rounded-2xl border-2 border-red-200 dark:border-red-800">
                <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Você tem certeza de que quer excluir sua conta de forma permanente? Essa ação não pode ser desfeita e seu e-mail não poderá ser reutilizado.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                disabled={deleting}
                className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white py-3.5 rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02]"
              >
                Cancelar
              </button>
              
              <button
                onClick={confirmDeleteAccount}
                disabled={deleting}
                className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:from-red-400 disabled:to-pink-400 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl hover:scale-[1.02]"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <span>Confirmar Exclusão</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountPage;ibold text-gray-700 dark:text-gray-300 mb-3">
                  <User className="h-4 w-4" />
                  <span>Nome Completo</span>
                </label>
                <input
                  type="text"
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-purple-200 dark:border-purple-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
                  placeholder="Seu nome completo"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-2 flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm font-sem