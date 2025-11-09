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

const [isMobile, setIsMobile] = useState(false);

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

  // Detecção real de mobile via JavaScript
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
          // fallback to auth email
          setUserData(prev => ({
            ...prev,
            name: prev.name || '',
            email: user.email || '',
            cpf: '',
            phoneNumber: ''
          }));
        } else if (profile) {
          // Parse phone number to extract country and number
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
          
          // Find matching country
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
    // Remove any non-numeric characters
    const cleanCPF = cpf.replace(/\D/g, '');
    
    // Check if CPF has 11 digits
    if (cleanCPF.length !== 11) return false;
    
    // Check for known invalid CPFs (all same digits)
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Validate CPF algorithm
    let sum = 0;
    let remainder;
    
    // Validate first digit
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
    
    // Validate second digit
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
      // Prepare phone number for storage (combine country code and number)
      const fullPhoneNumber = userData.phoneNumber.trim() 
        ? `${selectedCountry.dialCode} ${userData.phoneNumber.trim()}`
        : null;
      
      // Prepare CPF for storage (only numbers)
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
        <div 
          className="mx-auto px-4 py-6 sm:px-6 lg:px-8 sm:py-8"
          style={{
            maxWidth: isMobile ? '100%' : '56rem'
          }}
        >
          <div 
            className="rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200/10 dark:border-gray-800/20 bg-white/6 dark:bg-gray-900/40"
            style={{
              padding: isMobile ? '12px' : undefined
            }}
          >
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-purple-600" />
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
    <div 
      className="bg-transparent min-h-screen"
      style={{
        // Barra de rolagem customizada elegante
        scrollbarColor: isMobile ? '#a855f7 rgba(139, 92, 246, 0.1)' : undefined,
        scrollbarWidth: isMobile ? 'thin' : undefined,
      }}
    >
      <style>
        {`
          /* Scrollbar para mobile (mais fina e discreta) */
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
          
          /* Scrollbar para desktop (mais robusta) */
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
      <main 
        className="mx-auto px-4 py-6 sm:px-6 lg:px-8 sm:py-8"
        style={{
          maxWidth: isMobile ? '100%' : '56rem',
          padding: isMobile ? '16px 12px' : undefined
        }}
      >
        {/* Card wrapper */}
        <div 
          className="rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200/10 dark:border-gray-800/20 bg-white/6 dark:bg-gray-900/40"
          style={{
            padding: isMobile ? '12px' : undefined
          }}
        >
          {/* Top header of card */}
          <div 
            className="flex items-start justify-between mb-4 sm:mb-6"
            style={{
              marginBottom: isMobile ? '12px' : undefined,
              gap: isMobile ? '8px' : undefined
            }}
          >
            <div>
              <h1 
                className="font-semibold text-gray-900 dark:text-white"
                style={{
                  fontSize: isMobile ? '15px' : '1.25rem'
                }}
              >
                Minha conta
              </h1>
              <p 
                className="text-gray-500 dark:text-gray-400 mt-1"
                style={{
                  fontSize: isMobile ? '11px' : '0.875rem',
                  marginTop: isMobile ? '4px' : undefined
                }}
              >
                Gerencie seus dados pessoais, redefina senha ou exclua sua conta.
              </p>
            </div>

            <div 
              className="flex items-center"
              style={{
                gap: isMobile ? '6px' : '12px'
              }}
            >
              {/* Small edit icon */}
              <button
                onClick={handleEditData}
                title="Editar"
                className="rounded-lg bg-gray-800/40 hover:bg-gray-800/30 transition"
                style={{
                  padding: isMobile ? '6px' : '8px'
                }}
              >
                <Pencil 
                  className="text-white"
                  style={{
                    width: isMobile ? '14px' : '16px',
                    height: isMobile ? '14px' : '16px'
                  }}
                />
              </button>
            </div>
          </div>

          {/* Content grid */}
          <div 
            className="grid grid-cols-1 md:grid-cols-3"
            style={{
              gap: isMobile ? '8px' : '24px'
            }}
          >
            {/* Avatar / basic info */}
            <div 
              className="col-span-1 flex items-center rounded-xl bg-white/3 dark:bg-black/10"
              style={{
                gap: isMobile ? '8px' : '16px',
                padding: isMobile ? '8px' : '16px'
              }}
            >
              <div 
                className="rounded-full bg-gradient-to-br from-purple-600 to-blue-400 flex items-center justify-center text-white font-semibold shadow overflow-hidden"
                style={{
                  width: isMobile ? '48px' : '64px',
                  height: isMobile ? '48px' : '64px',
                  fontSize: isMobile ? '16px' : '18px'
                }}
              >
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span>{avatarInitial(userData.name || user?.email)}</span>
                )}
              </div>
              <div>
                <div 
                  className="text-gray-400"
                  style={{
                    fontSize: isMobile ? '11px' : '0.875rem'
                  }}
                >
                  Usuário
                </div>
                <div 
                  className="font-medium text-gray-900 dark:text-white"
                  style={{
                    fontSize: isMobile ? '13px' : '1rem'
                  }}
                >
                  {userData.name || '-'}
                </div>
                <div 
                  className="text-gray-500 dark:text-gray-400"
                  style={{
                    fontSize: isMobile ? '11px' : '0.875rem',
                    marginTop: isMobile ? '2px' : '4px'
                  }}
                >
                  {userData.email || '-'}
                </div>
              </div>
            </div>

            {/* Main fields */}
            <div 
              className="col-span-2 rounded-xl bg-white/3 dark:bg-black/10"
              style={{
                padding: isMobile ? '8px' : '16px'
              }}
            >
              <div 
                className="grid grid-cols-1 md:grid-cols-2"
                style={{
                  gap: isMobile ? '8px' : '16px'
                }}
              >
                <div>
                  <label 
                    className="block text-gray-400"
                    style={{
                      fontSize: isMobile ? '11px' : '0.875rem'
                    }}
                  >
                    Nome
                  </label>
                  <div 
                    className="font-medium text-gray-900 dark:text-white"
                    style={{
                      marginTop: isMobile ? '2px' : '4px',
                      fontSize: isMobile ? '13px' : '1rem'
                    }}
                  >
                    {userData.name || '-'}
                  </div>
                </div>
                <div>
                  <label 
                    className="block text-gray-400"
                    style={{
                      fontSize: isMobile ? '11px' : '0.875rem'
                    }}
                  >
                    Email
                  </label>
                  <div 
                    className="font-medium text-gray-900 dark:text-white"
                    style={{
                      marginTop: isMobile ? '2px' : '4px',
                      fontSize: isMobile ? '13px' : '1rem'
                    }}
                  >
                    {userData.email || '-'}
                  </div>
                </div>
                <div>
                  <label 
                    className="block text-gray-400"
                    style={{
                      fontSize: isMobile ? '11px' : '0.875rem'
                    }}
                  >
                    CPF
                  </label>
                  <div 
                    className="font-medium text-gray-900 dark:text-white"
                    style={{
                      marginTop: isMobile ? '2px' : '4px',
                      fontSize: isMobile ? '13px' : '1rem'
                    }}
                  >
                    {userData.cpf || '-'}
                  </div>
                </div>
                <div>
                  <label 
                    className="block text-gray-400"
                    style={{
                      fontSize: isMobile ? '11px' : '0.875rem'
                    }}
                  >
                    Telefone
                  </label>
                  <div 
                    className="font-medium text-gray-900 dark:text-white"
                    style={{
                      marginTop: isMobile ? '2px' : '4px',
                      fontSize: isMobile ? '13px' : '1rem'
                    }}
                  >
                    {userData.phoneNumber ? `${selectedCountry.dialCode} ${userData.phoneNumber}` : '-'}
                  </div>
                </div>
              </div>

              {/* Reset password */}
              <div 
                style={{
                  marginTop: isMobile ? '12px' : '24px'
                }}
              >
                <h3 
                  className="font-semibold text-gray-900 dark:text-white"
                  style={{
                    fontSize: isMobile ? '13px' : '1rem'
                  }}
                >
                  Resetar senha
                </h3>
                <p 
                  className="text-gray-500 dark:text-gray-400"
                  style={{
                    fontSize: isMobile ? '11px' : '0.875rem',
                    marginTop: isMobile ? '4px' : '4px'
                  }}
                >
                  Você receberá um link via e-mail para redefinir a sua senha.
                </p>

                <div 
                  style={{
                    marginTop: isMobile ? '8px' : '16px'
                  }}
                >
                  <button
                    onClick={handleSendResetLink}
                    disabled={sendingResetLink}
                    className="w-full inline-flex items-center justify-center rounded-lg font-semibold text-white transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                               animate-gradient-x bg-[length:200%_200%] bg-gradient-to-br from-purple-600 via-pink-500 to-indigo-600"
                    style={{
                      gap: isMobile ? '6px' : '8px',
                      padding: isMobile ? '8px 16px' : '12px 24px',
                      fontSize: isMobile ? '11px' : '0.875rem'
                    }}
                  >
                    {sendingResetLink ? (
                      <>
                        <div 
                          className="animate-spin rounded-full border-b-2 border-white"
                          style={{
                            width: isMobile ? '12px' : '16px',
                            height: isMobile ? '12px' : '16px'
                          }}
                        />
                        <span>Enviando...</span>
                      </>
                    ) : resetLinkSent ? (
                      <>
                        <span>Link enviado!</span>
                        <CheckCircle 
                          style={{
                            width: isMobile ? '12px' : '16px',
                            height: isMobile ? '12px' : '16px'
                          }}
                        />
                      </>
                    ) : (
                      <>
                        <span>Enviar link</span>
                        <Link 
                          style={{
                            width: isMobile ? '12px' : '16px',
                            height: isMobile ? '12px' : '16px'
                          }}
                        />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Delete account */}
              <div 
                style={{
                  marginTop: isMobile ? '12px' : '24px'
                }}
              >
                <h3 
                  className="font-semibold text-gray-900 dark:text-white"
                  style={{
                    fontSize: isMobile ? '13px' : '1rem'
                  }}
                >
                  Excluir minha conta
                </h3>
                <p 
                  className="text-gray-500 dark:text-gray-400 leading-relaxed"
                  style={{
                    fontSize: isMobile ? '11px' : '0.875rem',
                    marginTop: isMobile ? '4px' : '4px'
                  }}
                >
                  Lembre-se de que esta ação é irreversível e removerá permanentemente todas as suas informações e dados pessoais de nossa plataforma; você não pode ter rifas em andamento.
                </p>

                <div 
                  style={{
                    marginTop: isMobile ? '8px' : '16px'
                  }}
                >
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="inline-flex items-center rounded-lg bg-gradient-to-r from-red-600 to-rose-500 text-white font-medium hover:opacity-95 transition disabled:opacity-50"
                    style={{
                      gap: isMobile ? '6px' : '8px',
                      padding: isMobile ? '6px 12px' : '8px 16px',
                      fontSize: isMobile ? '11px' : '0.875rem'
                    }}
                  >
                    <span>{deleting ? 'Excluindo...' : 'Quero excluir'}</span>
                    <Trash2 
                      style={{
                        width: isMobile ? '12px' : '16px',
                        height: isMobile ? '12px' : '16px'
                      }}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Optional purchase history (kept smaller / below) */}
          {getCompletedOrders().length > 0 && (
            <div 
              style={{
                marginTop: isMobile ? '12px' : '24px'
              }}
            >
              <h4 
                className="font-semibold text-gray-400"
                style={{
                  fontSize: isMobile ? '11px' : '0.875rem',
                  marginBottom: isMobile ? '8px' : '12px'
                }}
              >
                Histórico de Compras recentes
              </h4>
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: isMobile ? '6px' : '12px'
                }}
              >
                {getCompletedOrders().slice(0, 3).map((order) => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between rounded-lg bg-white/3 dark:bg-black/10"
                    style={{
                      padding: isMobile ? '8px' : '12px'
                    }}
                  >
                    <div>
                      <div 
                        className="font-medium text-gray-900 dark:text-white"
                        style={{
                          fontSize: isMobile ? '12px' : '1rem'
                        }}
                      >
                        Rifaqui - Taxa de Publicação
                      </div>
                      <div 
                        className="text-gray-500 dark:text-gray-400"
                        style={{
                          fontSize: isMobile ? '10px' : '0.875rem'
                        }}
                      >
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div 
                        className="font-medium text-gray-900 dark:text-white"
                        style={{
                          fontSize: isMobile ? '12px' : '1rem'
                        }}
                      >
                        R$ {(order.amount_total / 100).toFixed(2).replace('.', ',')}
                      </div>
                      <div 
                        className="text-green-600 dark:text-green-400"
                        style={{
                          fontSize: isMobile ? '10px' : '0.875rem'
                        }}
                      >
                        Pago
                      </div>
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
          <div 
            className="w-full rounded-lg bg-white dark:bg-gray-800"
            style={{
              maxWidth: isMobile ? '100%' : '28rem',
              padding: isMobile ? '16px' : '24px'
            }}
          >
            <div 
              className="flex items-center justify-between"
              style={{
                marginBottom: isMobile ? '12px' : '16px'
              }}
            >
              <h2 
                className="font-semibold text-gray-900 dark:text-white"
                style={{
                  fontSize: isMobile ? '15px' : '18px'
                }}
              >
                Editar dados pessoais
              </h2>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <X 
                  className="text-gray-400"
                  style={{
                    width: isMobile ? '18px' : '20px',
                    height: isMobile ? '18px' : '20px'
                  }}
                />
              </button>
            </div>

            <p 
              className="text-gray-500 dark:text-gray-400"
              style={{
                fontSize: isMobile ? '11px' : '0.875rem',
                marginBottom: isMobile ? '12px' : '16px'
              }}
            >
              Preencha os campos abaixo para editar seus dados pessoais.
            </p>

            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? '12px' : '16px'
              }}
            >
              <div>
                <label 
                  className="block text-gray-700 dark:text-gray-300"
                  style={{
                    fontSize: isMobile ? '11px' : '0.875rem',
                    marginBottom: isMobile ? '4px' : '8px'
                  }}
                >
                  Nome completo
                </label>
                <input
                  type="text"
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  className="w-full rounded-lg bg-white dark:bg-gray-700 border border-purple-500 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{
                    padding: isMobile ? '8px 12px' : '12px 16px',
                    fontSize: isMobile ? '13px' : '1rem'
                  }}
                />
                {errors.name && (
                  <p 
                    className="text-red-500"
                    style={{
                      fontSize: isMobile ? '10px' : '0.875rem',
                      marginTop: '4px'
                    }}
                  >
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label 
                  className="block text-gray-700 dark:text-gray-300"
                  style={{
                    fontSize: isMobile ? '11px' : '0.875rem',
                    marginBottom: isMobile ? '4px' : '8px'
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                  className={`w-full rounded-lg bg-white dark:bg-gray-700 border text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  style={{
                    padding: isMobile ? '8px 12px' : '12px 16px',
                    fontSize: isMobile ? '13px' : '1rem'
                  }}
                />
                {errors.email && (
                  <p 
                    className="text-red-500"
                    style={{
                      fontSize: isMobile ? '10px' : '0.875rem',
                      marginTop: '4px'
                    }}
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label 
                  className="block text-gray-700 dark:text-gray-300"
                  style={{
                    fontSize: isMobile ? '11px' : '0.875rem',
                    marginBottom: isMobile ? '4px' : '8px'
                  }}
                >
                  CPF (opcional)
                </label>
                <input
                  type="text"
                  value={userData.cpf}
                  onChange={handleCPFChange}
                  placeholder="000.000.000-00"
                  className={`w-full rounded-lg bg-white dark:bg-gray-700 border text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.cpf ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  style={{
                    padding: isMobile ? '8px 12px' : '12px 16px',
                    fontSize: isMobile ? '13px' : '1rem'
                  }}
                />
                {errors.cpf && (
                  <p 
                    className="text-red-500"
                    style={{
                      fontSize: isMobile ? '10px' : '0.875rem',
                      marginTop: '4px'
                    }}
                  >
                    {errors.cpf}
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
                className="w-full inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 via-blue-500 to-indigo-600 text-white font-semibold"
                style={{
                  gap: isMobile ? '6px' : '8px',
                  padding: isMobile ? '10px 16px' : '12px 16px',
                  fontSize: isMobile ? '13px' : '1rem'
                }}
              >
                <span>Salvar</span>
                <ArrowRight 
                  style={{
                    width: isMobile ? '14px' : '16px',
                    height: isMobile ? '14px' : '16px'
                  }}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div 
            className="w-full rounded-lg bg-white dark:bg-gray-800"
            style={{
              maxWidth: isMobile ? '100%' : '28rem',
              padding: isMobile ? '16px' : '24px'
            }}
          >
            <div 
              className="flex items-center justify-between"
              style={{
                marginBottom: isMobile ? '12px' : '16px'
              }}
            >
              <h2 
                className="font-semibold text-gray-900 dark:text-white"
                style={{
                  fontSize: isMobile ? '15px' : '18px'
                }}
              >
                Excluir
              </h2>
              <button 
                onClick={() => setShowDeleteConfirmModal(false)} 
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <X 
                  className="text-gray-400"
                  style={{
                    width: isMobile ? '18px' : '20px',
                    height: isMobile ? '18px' : '20px'
                  }}
                />
              </button>
            </div>

            <div 
              style={{
                marginBottom: isMobile ? '16px' : '24px'
              }}
            >
              <div 
                className="flex items-start"
                style={{
                  gap: isMobile ? '8px' : '12px',
                  marginBottom: isMobile ? '12px' : '16px'
                }}
              >
                <AlertTriangle 
                  className="text-red-500 flex-shrink-0"
                  style={{
                    width: isMobile ? '20px' : '24px',
                    height: isMobile ? '20px' : '24px',
                    marginTop: '2px'
                  }}
                />
                <p 
                  className="text-gray-700 dark:text-gray-300 leading-relaxed"
                  style={{
                    fontSize: isMobile ? '12px' : '1rem'
                  }}
                >
                  Você tem certeza de que quer excluir sua conta de forma permanente? Essa ação não pode ser desfeita e seu e-mail não poderá ser reutilizado.
                </p>
              </div>
            </div>

            <div 
              className="flex"
              style={{
                gap: isMobile ? '8px' : '12px'
              }}
            >
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                disabled={deleting}
                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-900 dark:text-white rounded-lg font-medium transition"
                style={{
                  padding: isMobile ? '8px' : '12px',
                  fontSize: isMobile ? '12px' : '1rem'
                }}
              >
                Cancelar
              </button>

              <button
                onClick={confirmDeleteAccount}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition"
                style={{
                  padding: isMobile ? '8px' : '12px',
                  fontSize: isMobile ? '12px' : '1rem'
                }}
              >
                {deleting ? (
                  <div 
                    className="animate-spin rounded-full border-b-2 border-white mx-auto"
                    style={{
                      width: isMobile ? '14px' : '16px',
                      height: isMobile ? '14px' : '16px'
                    }}
                  />
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