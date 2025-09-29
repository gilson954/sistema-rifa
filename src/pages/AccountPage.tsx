// src/pages/AccountPage.tsx
import React, { useState, useEffect } from 'react';
import { Pencil, Upload, Link, Trash2, X, ArrowRight, ChevronDown, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import CountryPhoneSelect from '../components/CountryPhoneSelect';
import { useStripe } from '../hooks/useStripe';
import { translateAuthError } from '../utils/errorTranslators'; // ✅ import adicionado

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

const AccountPage = () => {
  const { user, signOut } = useAuth();
  const { orders, getCompletedOrders } = useStripe();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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
      if (user) {
        setLoading(true);
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('name, email, avatar_url')
            .eq('id', user.id)
            .maybeSingle();

          if (error) {
            console.error('Error fetching profile:', error);
          } else if (profile) {
            setUserData(prev => ({
              ...prev,
              name: profile.name || '',
              email: profile.email || ''
            }));
            setProfileImageUrl(profile.avatar_url);
          } else {
            setUserData(prev => ({
              ...prev,
              name: '',
              email: user.email || ''
            }));
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        } finally {
          setLoading(false);
        }
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

    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            name: userData.name,
            email: userData.email
          })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating profile:', error);
          alert(translateAuthError(error.message || 'Erro ao salvar dados. Tente novamente.'));
        } else {
          setShowEditModal(false);
        }
      } catch (error: any) {
        console.error('Error saving user data:', error);
        alert(translateAuthError(error.message || 'Erro ao salvar dados. Tente novamente.'));
      }
    }
  };

  const handleSendResetLink = () => {
    console.log('Sending password reset link');
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
        // ✅ traduzir mensagem de erro
        throw new Error(translateAuthError(result.message || 'Erro ao excluir conta'));
      }

      alert('Conta excluída com sucesso');
      await signOut();
      window.location.href = '/login';
    } catch (error: any) {
      console.error('Error deleting account:', error);
      // ✅ traduzir mensagem de erro
      alert(translateAuthError(error.message || 'Erro ao excluir conta. Tente novamente.'));
    } finally {
      setDeleting(false);
      setShowDeleteConfirmModal(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300">
      {/* Histórico de Compras */}
      {getCompletedOrders().length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
            Histórico de Compras
          </h2>
          <div className="space-y-3">
            {getCompletedOrders().slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Rifaqui - Taxa de Publicação
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(order.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900 dark:text-white">
                    R$ {(order.amount_total / 100).toFixed(2).replace('.', ',')}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    Pago
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dados principais */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium text-gray-900 dark:text-white">
            Dados principais
          </h2>
          <button
            onClick={handleEditData}
            className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors duration-200"
          >
            <Pencil className="h-4 w-4 text-white" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Nome</label>
            <p className="text-gray-900 dark:text-white font-medium">{userData.name || '-'}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Email</label>
            <p className="text-gray-900 dark:text-white font-medium">{userData.email || '-'}</p>
          </div>
        </div>
      </div>

      {/* Reset Password Section */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Resetar senha
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          Você receberá um link via email para redefinir a sua senha
        </p>

        <button
          onClick={handleSendResetLink}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <span>Enviar link</span>
          <Link className="h-4 w-4" />
        </button>
      </div>

      {/* Delete Account Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Excluir minha conta
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
          Lembre-se de que esta ação é irreversível e removerá permanentemente todas as suas informações e dados pessoais 
          de nossa plataforma, você não pode ter rifas em andamento
        </p>

        <button
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          <span>{deleting ? 'Excluindo...' : 'Quero excluir'}</span>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Edit Data Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Editar dados pessoais
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Preencha os campos abaixo para editar seus dados pessoais
            </p>

            <div className="space-y-4">
              {/* Nome completo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  className="w-full bg-white dark:bg-gray-700 border border-purple-500 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                  className={`w-full bg-white dark:bg-gray-700 border rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 ${
                    errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            <button
              onClick={handleSaveData}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 mt-6"
            >
              <span>Salvar</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Excluir
              </h2>
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
              >
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

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                disabled={deleting}
                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Cancelar
              </button>
              
              <button
                onClick={confirmDeleteAccount}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {deleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
