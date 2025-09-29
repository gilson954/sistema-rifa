// src/pages/AccountPage.tsx
import React, { useState, useEffect, ChangeEvent } from 'react';
import { Pencil, Upload, Link as LinkIcon, Trash2, X, ArrowRight, AlertTriangle } from 'lucide-react';
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
    flag: '🇧🇷',
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
          .select('name, email, avatar_url, cpf, phone, phone_country_code, created_at')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
        }

        if (profile) {
          setUserData((prev) => ({
            ...prev,
            name: profile.name || '',
            email: profile.email || '',
            cpf: profile.cpf || '',
          }));
          setProfileImageUrl(profile.avatar_url || null);
          if (profile.phone) setPhoneNumberInput(profile.phone);
          if (profile.phone_country_code) {
            setSelectedCountry((c) => ({ ...c, code: profile.phone_country_code } as Country));
          }
        } else {
          // fallback
          setUserData((prev) => ({ ...prev, email: user.email || '' }));
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!userData.name.trim()) newErrors.name = 'Nome é obrigatório';

    if (!userData.email.trim()) newErrors.email = 'Email é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(userData.email)) newErrors.email = 'Email inválido';

    if (userData.cpf.trim()) {
      const cpfNumbers = userData.cpf.replace(/\D/g, '');
      if (cpfNumbers.length !== 11) newErrors.cpf = 'CPF deve ter 11 dígitos';
    }

    if (phoneNumberInput.trim()) {
      const phoneNumbers = phoneNumberInput.replace(/\D/g, '');
      if (selectedCountry.code === 'BR' && phoneNumbers.length !== 11) newErrors.phoneNumber = 'Número de celular deve ter 11 dígitos';
      else if ((selectedCountry.code === 'US' || selectedCountry.code === 'CA') && phoneNumbers.length !== 10) newErrors.phoneNumber = 'Número de telefone deve ter 10 dígitos';
      else if (phoneNumbers.length < 7) newErrors.phoneNumber = 'Número de telefone inválido';
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
          email: userData.email,
          cpf: userData.cpf || null,
          phone: phoneNumberInput || null,
          phone_country_code: selectedCountry.code || null,
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

  const handleSendResetLink = async () => {
    // This should integrate with your auth provider - here we simply show a confirmation
    try {
      // Example: supabase.auth.api.resetPasswordForEmail
      // But to keep this file generic we show an alert
      alert('Um link de redefinição de senha foi enviado para o seu e-mail (simulação).');
    } catch (err) {
      console.error('Error sending reset link:', err);
      alert('Erro ao enviar link. Tente novamente.');
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
        body: JSON.stringify({ user_id: user.id }),
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

  // Avatar: select & upload
  const handleSelectImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setSelectedImage(file);

    const reader = new FileReader();
    reader.onload = () => setImagePreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = async () => {
    if (!selectedImage || !user) return;
    setUploading(true);

    try {
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, selectedImage, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Erro ao enviar imagem. Tente novamente.');
        return;
      }

      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = publicData.publicUrl;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error saving avatar url:', updateError);
        alert('Erro ao salvar URL da imagem.');
        return;
      }

      setProfileImageUrl(publicUrl);
      setShowPhotoModal(false);
      setSelectedImage(null);
      setImagePreview(null);
    } catch (err) {
      console.error('Error uploading photo:', err);
      alert('Erro ao enviar imagem. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header card */}
      <div className="rounded-2xl p-4 shadow-sm border border-gray-200/20 dark:border-gray-800/30 bg-white/6 dark:bg-gray-900/50 backdrop-blur-sm mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Minha conta</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Gerencie seus dados pessoais, redefina senha ou exclua sua conta.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPhotoModal(true)}
            className="inline-flex items-center gap-2 bg-[length:200%_200%] animate-gradient-x bg-gradient-to-br from-purple-600 via-blue-500 to-indigo-600 text-white px-4 py-2 rounded-full shadow-sm hover:-translate-y-0.5 transition transform"
          >
            <Upload className="h-4 w-4" />
            Alterar foto
          </button>

          <button onClick={handleEditData} className="p-2 bg-white/5 rounded-lg">
            <Pencil className="h-5 w-5 text-gray-200" />
          </button>
        </div>
      </div>

      {/* Main card with profile info */}
      <div className="rounded-2xl p-6 shadow-sm border border-gray-200/10 dark:border-gray-800/30 bg-white/6 dark:bg-gray-900/40 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-2xl font-semibold overflow-hidden">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                (userData.name || user?.email || 'U')[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{userData.name || '-'}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{userData.email || '-'}</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">Conta desde</div>
            <div className="font-medium text-gray-900 dark:text-white">{user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-'}</div>
          </div>
        </div>

        {/* compact extra fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">CPF</label>
            <div className="text-gray-900 dark:text-white font-medium">{userData.cpf || '-'}</div>
          </div>

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Telefone</label>
            <div className="text-gray-900 dark:text-white font-medium">{phoneNumberInput || '-'}</div>
          </div>

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">País</label>
            <div className="text-gray-900 dark:text-white font-medium">{selectedCountry?.name || '-'}</div>
          </div>
        </div>
      </div>

      {/* Reset password card */}
      <div className="rounded-2xl p-6 shadow-sm border border-gray-200/10 dark:border-gray-800/30 bg-white/6 dark:bg-gray-900/40 mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Resetar senha</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Você receberá um link via e-mail para redefinir a sua senha</p>
        </div>

        <div>
          <button
            onClick={handleSendResetLink}
            className="inline-flex items-center gap-2 bg-[length:200%_200%] animate-gradient-x bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-500 text-white px-4 py-2 rounded-full font-medium shadow-sm transition transform hover:-translate-y-0.5"
          >
            <span>Enviar link</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Delete account card */}
      <div className="rounded-2xl p-6 shadow-sm border border-red-700/20 bg-red-900/5 dark:bg-red-900/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-red-500">Excluir minha conta</h3>
            <p className="text-sm text-red-200/80 mt-1">Esta ação é irreversível e removerá permanentemente todas as suas informações e dados pessoais de nossa plataforma.</p>
          </div>

          <div>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full font-medium transition-colors duration-200"
            >
              {deleting ? 'Excluindo...' : 'Quero excluir'}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Editar dados pessoais</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"><X className="h-5 w-5 text-gray-400" /></button>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Preencha os campos abaixo para editar seus dados pessoais</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome completo</label>
                <input
                  type="text"
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  className="w-full bg-white dark:bg-gray-700 border border-purple-500 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                  className={`w-full bg-white dark:bg-gray-700 border rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200 ${
                    errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CPF</label>
                <input
                  type="text"
                  value={userData.cpf}
                  onChange={(e) => setUserData({ ...userData, cpf: e.target.value })}
                  className={`w-full bg-white dark:bg-gray-700 border rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200 ${
                    errors.cpf ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.cpf && <p className="text-red-500 text-sm mt-1">{errors.cpf}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Telefone</label>
                <CountryPhoneSelect
                  value={phoneNumberInput}
                  country={selectedCountry}
                  onCountryChange={(c: Country) => setSelectedCountry(c)}
                  onChange={(val: string) => setPhoneNumberInput(val)}
                />
                {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowEditModal(false)} className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-3 rounded-lg font-medium">Cancelar</button>
              <button onClick={handleSaveData} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Alterar foto</h2>
              <button onClick={() => { setShowPhotoModal(false); setSelectedImage(null); setImagePreview(null); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><X className="h-5 w-5 text-gray-400" /></button>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Selecione uma imagem para utilizar como avatar.</p>

            <div className="mb-4">
              <input type="file" accept="image/*" onChange={handleSelectImage} />
            </div>

            {imagePreview && (
              <div className="mb-4">
                <img src={imagePreview} alt="preview" className="w-40 h-40 object-cover rounded-lg" />
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setShowPhotoModal(false); setSelectedImage(null); setImagePreview(null); }} className="flex-1 bg-gray-200 dark:bg-gray-700 py-3 rounded-lg">Cancelar</button>
              <button onClick={handleUploadPhoto} disabled={!selectedImage || uploading} className="flex-1 bg-[length:200%_200%] animate-gradient-x bg-gradient-to-br from-purple-600 via-blue-500 to-indigo-600 text-white py-3 rounded-lg">{uploading ? 'Enviando...' : 'Enviar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Excluir</h2>
              <button onClick={() => setShowDeleteConfirmModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><X className="h-5 w-5 text-gray-400" /></button>
            </div>

            <div className="mb-6">
              <div className="flex items-start space-x-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">Você tem certeza de que quer excluir sua conta de forma permanente? Essa ação não pode ser desfeita e seu e-mail não poderá ser reutilizado.</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button onClick={() => setShowDeleteConfirmModal(false)} disabled={deleting} className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white py-3 rounded-lg font-medium">Cancelar</button>
              <button onClick={confirmDeleteAccount} disabled={deleting} className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium">{deleting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : 'Confirmar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountPage;
