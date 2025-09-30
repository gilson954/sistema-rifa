// src/pages/AccountPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Pencil,
  Link,
  Trash2,
  X,
  ArrowRight,
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
          
          setUserData({
            name: profile.name || '',
            email: profile.email || user.email || '',
            cpf: profile.cpf || '',
            phoneNumber: phoneOnly
          });
          setProfileImageUrl(profile.avatar_url || null);
        } else {
          setUserData({
            name: '',
            email: user.email || '',
            cpf: '',
            phoneNumber: ''
          });
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user?.id]);

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
      <div className="min-h-screen bg-[#0f0f1e] flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-700"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-purple-500 absolute top-0 left-0"></div>
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
    <div className="min-h-screen bg-[#0f0f1e] py-8 px-4 sm:px-6 lg:px-8">
      <main className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Card */}
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16162a] rounded-2xl p-6 border border-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl font-bold text-white shadow-lg overflow-hidden">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{avatarInitial(userData.name || user?.email)}</span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Minha conta</h1>
                <p className="text-gray-400 text-sm mt-1">Gerencie suas informações pessoais</p>
              </div>
            </div>

            <button
              onClick={handleEditData}
              className="p-3 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-all duration-200 group"
            >
              <Pencil className="h-5 w-5 text-purple-400 group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </div>

        {/* Main Data Card */}
        <div className="bg-[#1a1a2e] rounded-2xl border border-gray-800/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Informações Pessoais</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#16162a] rounded-lg border border-gray-800/50">
              <label className="flex items-center space-x-2 text-xs font-medium text-gray-400 mb-2">
                <User className="h-3.5 w-3.5" />
                <span>Nome</span>
              </label>
              <div className="text-base font-medium text-white">{userData.name || '-'}</div>
            </div>

            <div className="p-4 bg-[#16162a] rounded-lg border border-gray-800/50">
              <label className="flex items-center space-x-2 text-xs font-medium text-gray-400 mb-2">
                <Mail className="h-3.5 w-3.5" />
                <span>Email</span>
              </label>
              <div className="text-base font-medium text-white break-all">{userData.email || '-'}</div>
            </div>

            <div className="p-4 bg-[#16162a] rounded-lg border border-gray-800/50">
              <label className="flex items-center space-x-2 text-xs font-medium text-gray-400 mb-2">
                <CreditCard className="h-3.5 w-3.5" />
                <span>CPF</span>
              </label>
              <div className="text-base font-medium text-white">{userData.cpf || '-'}</div>
            </div>

            <div className="p-4 bg-[#16162a] rounded-lg border border-gray-800/50">
              <label className="flex items-center space-x-2 text-xs font-medium text-gray-400 mb-2">
                <Phone className="h-3.5 w-3.5" />
                <span>Telefone</span>
              </label>
              <div className="text-base font-medium text-white">
                {userData.phoneNumber ? `${selectedCountry.dialCode} ${userData.phoneNumber}` : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Reset Password Card */}
        <div className="bg-[#1a1a2e] rounded-2xl border border-gray-800/50 p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Lock className="h-5 w-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Redefinir Senha</h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Você receberá um link via e-mail para redefinir sua senha.
          </p>

          <button
            onClick={handleSendResetLink}
            disabled={sendingResetLink}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {sendingResetLink ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Enviando...</span>
              </>
            ) : resetLinkSent ? (
              <>
                <span>Link enviado!</span>
                <CheckCircle className="h-4 w-4" />
              </>
            ) : (
              <>
                <span>Enviar link de redefinição</span>
                <Link className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {/* Purchase History */}
        {getCompletedOrders().length > 0 && (
          <div className="bg-[#1a1a2e] rounded-2xl border border-gray-800/50 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <ShoppingBag className="h-5 w-5 text-purple-400" />
              </div>
              <h4 className="text-lg font-semibold text-white">Histórico de Compras</h4>
            </div>
            <div className="space-y-3">
              {getCompletedOrders().slice(0, 3).map((order) => (
                <div key={order.id} className="bg-[#16162a] rounded-lg p-4 border border-gray-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-white mb-1">Rifaqui - Taxa de Publicação</div>
                      <div className="text-sm text-gray-400">{new Date(order.created_at).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-white mb-1">R$ {(order.amount_total / 100).toFixed(2).replace('.', ',')}</div>
                      <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                        ✓ Pago
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delete Account Card */}
        <div className="bg-[#1a1a2e] rounded-2xl border border-red-900/30 p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Excluir Conta</h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Esta ação é irreversível e removerá permanentemente todas as suas informações.
          </p>

          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 font-medium transition-all duration-200"
          >
            <span>{deleting ? 'Excluindo...' : 'Excluir minha conta'}</span>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </main>

      {/* Edit Data Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#1a1a2e] rounded-2xl p-6 border border-gray-800/50 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Editar Informações</h2>
                <p className="text-sm text-gray-400 mt-1">Atualize seus dados pessoais</p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-400 mb-2">
                  <User className="h-4 w-4" />
                  <span>Nome completo</span>
                </label>
                <input
                  type="text"
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-[#16162a] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Seu nome completo"
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-2 flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-400 mb-2">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </label>
                <input
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg bg-[#16162a] border ${
                    errors.email ? 'border-red-500/50' : 'border-gray-700'
                  } text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors`}
                  placeholder="seu@email.com"
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-2 flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-400 mb-2">
                  <CreditCard className="h-4 w-4" />
                  <span>CPF (opcional)</span>
                </label>
                <input
                  type="text"
                  value={userData.cpf}
                  onChange={handleCPFChange}
                  placeholder="000.000.000-00"
                  className={`w-full px-4 py-3 rounded-lg bg-[#16162a] border ${
                    errors.cpf ? 'border-red-500/50' : 'border-gray-700'
                  } text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors`}
                />
                {errors.cpf && (
                  <p className="text-red-400 text-sm mt-2 flex items-center space-x-1">
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

              <button
                onClick={handleSaveData}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium transition-all duration-200"
              >
                <span>Salvar Alterações</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#1a1a2e] rounded-2xl p-6 border border-gray-800/50 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Confirmar Exclusão</h2>
              <button 
                onClick={() => setShowDeleteConfirmModal(false)} 
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-start space-x-3 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300 leading-relaxed">
                  Você tem certeza de que quer excluir sua conta de forma permanente? Essa ação não pode ser desfeita e seu e-mail não poderá ser reutilizado.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                disabled={deleting}
                className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-all duration-200"
              >
                Cancelar
              </button>

              <button
                onClick={confirmDeleteAccount}
                disabled={deleting}
                className="flex-1 bg-gradient-to-r from-re