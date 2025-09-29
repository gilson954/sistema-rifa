// src/pages/AccountPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Pencil,
  Upload,
  Link,
  Trash2,
  X,
  ArrowRight,
  ChevronDown,
  AlertTriangle,
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
  const { getCompletedOrders } = useStripe();

  // UI state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Profile data
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

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch user profile data on mount / when user changes
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
          .select('name, email, avatar_url, cpf, phone_number, country_code')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
        } else if (profile) {
          setUserData((prev) => ({
            ...prev,
            name: profile.name || '',
            email: profile.email || user.email || '',
            cpf: profile.cpf || '',
          }));

          setProfileImageUrl(profile.avatar_url || null);
          setPhoneNumberInput(profile.phone_number || '');
          if (profile.country_code) {
            setSelectedCountry((c) => ({ ...c, code: profile.country_code }));
          }
        } else {
          setUserData((prev) => ({
            ...prev,
            name: '',
            email: user.email || '',
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

  /* Validation */
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
      if (cpfNumbers.length !== 11) newErrors.cpf = 'CPF deve ter 11 dígitos';
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

  /* Edit handlers */
  const handleEditData = () => {
    setErrors({});
    setShowEditModal(true);
  };

  const handleSaveData = async () => {
    if (!validateForm()) return;

    if (!user) return;

    try {
      const updates: Record<string, any> = {
        name: userData.name,
        email: userData.email,
      };

      // include optional fields if you want them stored
      if (userData.cpf) updates.cpf = userData.cpf;
      if (phoneNumberInput) {
        updates.phone_number = phoneNumberInput;
        updates.country_code = selectedCountry.code;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
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

  /* Password reset — envia link via Supabase */
  const handleSendResetLink = async () => {
    if (!user?.email) {
      alert('Email não encontrado.');
      return;
    }

    try {
      setLoading(true);
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo });
      setLoading(false);
      if (error) {
        alert(translateAuthError(error.message || 'Erro ao enviar link.'));
      } else {
        alert('Link de redefinição enviado para seu e-mail.');
      }
    } catch (err: any) {
      setLoading(false);
      console.error('Error sending reset link:', err);
      alert(translateAuthError(err.message || 'Erro ao enviar link.'));
    }
  };

  /* Delete account (backend function) */
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

  /* Avatar upload handlers (optional) */
  const handleOpenPhotoModal = () => setShowPhotoModal(true);

  const handleSelectImage = (file?: File) => {
    if (!file) return;
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleUploadImage = async () => {
    if (!selectedImage || !user) return;
    setUploading(true);
    try {
      const fileExt = selectedImage.name.split('.').pop();
      const filePath = `profiles/${user.id}/${Date.now()}.${fileExt}`;

      // upload to bucket "avatars" (adjust bucket name if needed)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, selectedImage, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = publicData.publicUrl;

      // save to profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfileImageUrl(publicUrl);
      setShowPhotoModal(false);
      setSelectedImage(null);
      setImagePreview(null);
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      alert('Erro ao enviar imagem. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  /* Loading skeleton while fetching */
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6 rounded-2xl border border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  /* Render */
  return (
    <div className="space-y-6">
      {/* PAGE HEADER CARD */}
      <div className="rounded-2xl border border-gray-200/20 dark:border-gray-800/30 bg-white/60 dark:bg-gray-900/50 backdrop-blur-sm p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Minha conta</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie seus dados pessoais, redefina senha ou exclua sua conta.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenPhotoModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-semibold shadow-sm transition transform hover:-translate-y-0.5 bg-gradient-to-br from-purple-600 to-blue-600"
            >
              <Upload className="h-4 w-4" />
              <span>Alterar foto</span>
            </button>

            <button
              onClick={handleEditData}
              className="p-2 rounded-md bg-white/10 dark:bg-white/5 border border-gray-200/10 dark:border-gray-800/20 hover:scale-[1.02] transition-transform"
              title="Editar dados"
            >
              <Pencil className="h-5 w-5 text-gray-700 dark:text-gray-200" />
            </button>
          </div>
        </div>
      </div>

      {/* PROFILE CARD */}
      <div className="rounded-2xl border border-gray-200/20 dark:border-gray-800/30 bg-white/60 dark:bg-gray-900/50 backdrop-blur-sm shadow-sm divide-y divide-gray-200/20 dark:divide-gray-800/30">
        <div className="p-6 flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold"
            style={{
              background: 'linear-gradient(90deg,#FF0066,#00A1FF,#9B4DE5)',
              backgroundSize: '200% 200%',
              animation: 'gradient-x 6s linear infinite',
            }}
          >
            {profileImageUrl ? (
              <img src={profileImageUrl} alt="avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              (userData.name && userData.name[0]?.toUpperCase()) || 'U'
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-base font-semibold text-gray-900 dark:text-white">{userData.name || '-'}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{userData.email || '-'}</div>
              </div>

              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">Conta desde</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Optional: purchase history summary */}
        {getCompletedOrders().length > 0 && (
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Histórico de Compras</h2>
            <div className="space-y-3">
              {getCompletedOrders().slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="rounded-lg p-4 border border-gray-200/10 dark:border-gray-800/20 bg-white/5 dark:bg-gray-900/30 flex items-center justify-between"
                >
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

      {/* Reset Password Card */}
      <div className="rounded-2xl border border-gray-200/20 dark:border-gray-800/30 bg-white/60 dark:bg-gray-900/50 backdrop-blur-sm p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Link className="h-4 w-4 text-gray-400" /> Resetar senha
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Você receberá um link via e-mail para redefinir a sua senha.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSendResetLink}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-semibold shadow-sm transition transform hover:-translate-y-0.5
                         bg-[length:200%_200%] bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 animate-gradient-x disabled:opacity-60"
            >
              {loading ? 'Enviando...' : 'Enviar link'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Card */}
      <div className="rounded-2xl border border-red-300/30 dark:border-red-800/30 bg-red-50/60 dark:bg-red-900/20 backdrop-blur-sm p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Excluir minha conta
            </h3>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1 leading-relaxed">
              Esta ação é irreversível e removerá permanentemente todas as suas informações e dados pessoais de nossa plataforma.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="px-4 py-2 rounded-full font-medium transition-colors duration-200 bg-red-600 hover:bg-red-700 text-white shadow-sm"
            >
              {deleting ? 'Excluindo...' : 'Quero excluir'}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Data Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200/20 dark:border-gray-800/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Editar dados pessoais</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Preencha os campos abaixo para editar seus dados pessoais</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome completo</label>
                <input
                  type="text"
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  className="w-full bg-white dark:bg-gray-700 border border-purple-500 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                  className={`w-full bg-white dark:bg-gray-700 border rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                    errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CPF (opcional)</label>
                  <input
                    type="text"
                    value={userData.cpf}
                    onChange={(e) => setUserData({ ...userData, cpf: e.target.value })}
                    placeholder="Somente números"
                    className={`w-full bg-white dark:bg-gray-700 border rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                      errors.cpf ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.cpf && <p className="text-red-500 text-sm mt-1">{errors.cpf}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Telefone (opcional)</label>
                  {/* CountryPhoneSelect is a custom component in your codebase */}
                  <CountryPhoneSelect
                    country={selectedCountry}
                    phone={phoneNumberInput}
                    onCountryChange={(c: Country) => setSelectedCountry(c)}
                    onPhoneChange={(v: string) => setPhoneNumberInput(v)}
                  />
                  {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={handleSaveData}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-semibold shadow-sm transition transform hover:-translate-y-0.5 bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600"
                >
                  Salvar
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200/20 dark:border-gray-800/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Alterar foto de perfil</h2>
              <button onClick={() => setShowPhotoModal(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Escolha uma imagem</label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleSelectImage(e.target.files ? e.target.files[0] : undefined)}
                />
                {imagePreview && (
                  <img src={imagePreview} alt="preview" className="w-16 h-16 object-cover rounded-md border" />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                  setShowPhotoModal(false);
                }}
                className="px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleUploadImage}
                disabled={!selectedImage || uploading}
                className="px-4 py-2 rounded-full text-white bg-gradient-to-br from-purple-600 to-blue-600"
              >
                {uploading ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200/20 dark:border-gray-800/30">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Excluir conta</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                  Você tem certeza de que quer excluir sua conta de forma permanente? Essa ação não pode ser desfeita e seu e-mail não poderá ser reutilizado.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteAccount}
                disabled={deleting}
                className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? 'Excluindo...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountPage;
