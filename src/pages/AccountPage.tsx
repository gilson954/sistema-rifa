// src/pages/AccountPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Pencil,
  Upload,
  Link,
  Trash2,
  X,
  ArrowRight,
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
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

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

  // Busca os dados do usuário
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('name, email, cpf, phone, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Erro ao buscar perfil:', error);
        } else if (profile) {
          setUserData({
            name: profile.name || '',
            email: profile.email || '',
            cpf: profile.cpf || '',
          });
          setPhoneNumberInput(profile.phone || '');
          setProfileImageUrl(profile.avatar_url || null);
        }
      } catch (err) {
        console.error('Erro ao buscar perfil:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Validação do formulário
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!userData.name.trim()) newErrors.name = 'Nome é obrigatório';

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
        newErrors.phoneNumber = 'Celular deve ter 11 dígitos';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Salvar edição
  const handleSaveData = async () => {
    if (!validateForm()) return;
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: userData.name,
          email: userData.email,
          cpf: userData.cpf,
          phone: phoneNumberInput,
        })
        .eq('id', user.id);

      if (error) {
        throw new Error(error.message);
      }

      setShowEditModal(false);
    } catch (err: any) {
      alert(translateAuthError(err.message || 'Erro ao salvar dados.'));
    }
  };

  // Upload da foto
  const handleUploadPhoto = async () => {
    if (!selectedImage || !user) {
      alert('Selecione uma imagem.');
      return;
    }
    setUploading(true);
    try {
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, selectedImage, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfileImageUrl(data.publicUrl);
      setShowPhotoModal(false);
    } catch (err: any) {
      alert(translateAuthError(err.message || 'Erro ao enviar foto.'));
    } finally {
      setUploading(false);
    }
  };

  // Excluir conta
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
        throw new Error(result.message);
      }

      alert('Conta excluída com sucesso');
      await signOut();
      window.location.href = '/login';
    } catch (err: any) {
      alert(translateAuthError(err.message || 'Erro ao excluir conta.'));
    } finally {
      setDeleting(false);
      setShowDeleteConfirmModal(false);
    }
  };

  // Resetar senha
  const handleSendResetLink = () => {
    alert('Link de redefinição enviado (placeholder).');
  };

  // Inicial do avatar
  const avatarInitial = (nameOrEmail: string | undefined) => {
    const source = nameOrEmail || user?.email || '';
    return source ? source.trim()[0].toUpperCase() : 'U';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="bg-transparent min-h-screen">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-2xl p-6 shadow-sm border border-gray-200/10 dark:border-gray-800/20 bg-white/6 dark:bg-gray-900/40">
          {/* Cabeçalho */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Minha conta</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Gerencie seus dados pessoais, redefina senha ou exclua sua conta.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowPhotoModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-white animate-gradient-x bg-gradient-to-br from-purple-600 via-blue-500 to-indigo-600"
              >
                <Upload className="h-4 w-4" />
                Alterar foto
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className="p-2 rounded-lg bg-gray-800/40 hover:bg-gray-800/30 transition"
              >
                <Pencil className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>

          {/* Info principal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 flex items-center gap-4 p-4 rounded-xl bg-white/3 dark:bg-black/10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-400 flex items-center justify-center text-white text-lg font-semibold shadow">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  avatarInitial(userData.name || user?.email)
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{userData.name || '-'}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{userData.email || '-'}</div>
              </div>
            </div>

            <div className="col-span-2 p-4 rounded-xl bg-white/3 dark:bg-black/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><span className="text-sm text-gray-400">Nome:</span> {userData.name || '-'}</div>
                <div><span className="text-sm text-gray-400">Email:</span> {userData.email || '-'}</div>
                <div><span className="text-sm text-gray-400">CPF:</span> {userData.cpf || '-'}</div>
                <div><span className="text-sm text-gray-400">Telefone:</span> {phoneNumberInput || '-'}</div>
              </div>
            </div>
          </div>

          {/* Reset senha */}
          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 dark:text-white">Resetar senha</h3>
            <button
              onClick={handleSendResetLink}
              className="mt-3 w-full px-6 py-3 rounded-lg text-white font-semibold animate-gradient-x bg-gradient-to-br from-purple-600 via-pink-500 to-indigo-600"
            >
              Enviar link
            </button>
          </div>

          {/* Excluir conta */}
          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 dark:text-white">Excluir conta</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Esta ação é irreversível.
            </p>
            <button
              onClick={() => setShowDeleteConfirmModal(true)}
              disabled={deleting}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-500 text-white"
            >
              {deleting ? 'Excluindo...' : 'Quero excluir'}
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Modal edição */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Editar dados</h2>
            <input
              type="text"
              value={userData.name}
              onChange={(e) => setUserData({ ...userData, name: e.target.value })}
              placeholder="Nome"
              className="w-full mb-3 p-2 rounded border"
            />
            <input
              type="email"
              value={userData.email}
              onChange={(e) => setUserData({ ...userData, email: e.target.value })}
              placeholder="Email"
              className="w-full mb-3 p-2 rounded border"
            />
            <input
              type="text"
              value={userData.cpf}
              onChange={(e) => setUserData({ ...userData, cpf: e.target.value })}
              placeholder="CPF"
              className="w-full mb-3 p-2 rounded border"
            />
            <input
              type="tel"
              value={phoneNumberInput}
              onChange={(e) => setPhoneNumberInput(e.target.value)}
              placeholder="Telefone"
              className="w-full mb-3 p-2 rounded border"
            />
            <button
              onClick={handleSaveData}
              className="w-full px-4 py-2 bg-gradient-to-br from-purple-600 via-blue-500 to-indigo-600 text-white rounded-lg"
            >
              Salvar
            </button>
          </div>
        </div>
      )}

      {/* Modal excluir conta */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Excluir conta</h2>
            <p className="mb-4">Tem certeza? Esta ação é irreversível.</p>
            <button
              onClick={confirmDeleteAccount}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}

      {/* Modal foto */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Alterar foto</h2>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setSelectedImage(f);
                if (f) {
                  const reader = new FileReader();
                  reader.onload = (ev) => setImagePreview(ev.target?.result as string);
                  reader.readAsDataURL(f);
                } else {
                  setImagePreview(null);
                }
              }}
            />
            {imagePreview && (
              <div className="w-32 h-32 rounded-full overflow-hidden mt-4">
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              </div>
            )}
            <button
              onClick={handleUploadPhoto}
              disabled={uploading}
              className="mt-4 w-full px-4 py-2 bg-gradient-to-br from-purple-600 via-blue-500 to-indigo-600 text-white rounded-lg"
            >
              {uploading ? 'Enviando...' : 'Salvar foto'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountPage;
