import React, { useState, useEffect } from 'react';
import { Pencil, Upload, Link, Trash2, X, ArrowRight, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const AccountPage = () => {
  const { user } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    cpf: '',
    email: '',
    phone: '+55'
  });
  const [loading, setLoading] = useState(true);

  // Fetch user profile data when component mounts or user changes
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        setLoading(true);
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('name, email, avatar_url')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching profile:', error);
          } else if (profile) {
            setUserData(prev => ({
              ...prev,
              name: profile.name || '',
              email: profile.email || ''
            }));
            setProfileImageUrl(profile.avatar_url);
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

  const handleEditData = () => {
    setShowEditModal(true);
  };

  const handleAddPhoto = () => {
    setShowPhotoModal(true);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.');
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveData = async () => {
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
          alert('Erro ao salvar dados. Tente novamente.');
        } else {
          console.log('Profile updated successfully');
          setShowEditModal(false);
        }
      } catch (error) {
        console.error('Error saving user data:', error);
        alert('Erro ao salvar dados. Tente novamente.');
      }
    }
  };

  const handleUploadPhoto = () => {
    if (!selectedImage) {
      alert('Por favor, selecione uma imagem primeiro.');
      return;
    }
    
    uploadProfileImage();
  };

  const uploadProfileImage = async () => {
    if (!selectedImage || !user) return;

    setUploading(true);
    try {
      // Create a unique filename
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, selectedImage, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update user profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setProfileImageUrl(publicUrl);
      
      // Reset modal state
      setSelectedImage(null);
      setImagePreview(null);
      setShowPhotoModal(false);
      
      alert('Foto de perfil atualizada com sucesso!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleSendResetLink = () => {
    // Handle sending password reset link
    console.log('Sending password reset link');
  };

  const handleDeleteAccount = () => {
    // Handle account deletion
    console.log('Account deletion requested');
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
      {/* Main Data Section */}
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
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Cpf</label>
            <p className="text-gray-900 dark:text-white font-medium">{userData.cpf || '-'}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Telefone</label>
            <p className="text-gray-900 dark:text-white font-medium">{userData.phone}</p>
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
          className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          <span>Quero excluir</span>
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

              {/* CPF */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cpf
                </label>
                <input
                  type="text"
                  value={userData.cpf}
                  onChange={(e) => setUserData({ ...userData, cpf: e.target.value })}
                  placeholder="Cpf"
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
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
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Seu telefone
                </label>
                <div className="flex space-x-2">
                  <div className="relative">
                    <select className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-8 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200">
                      <option value="+55">🇧🇷 +55</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  <input
                    type="text"
                    placeholder="seu número"
                    className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>
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

    </div>
  );
};

export default AccountPage;