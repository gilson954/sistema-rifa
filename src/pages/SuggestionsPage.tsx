import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Lightbulb, Bug, Zap, MessageSquare, AlertTriangle, CheckCircle, User, Mail, FileText, Upload, X, File, Image } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { SuggestionsAPI, CreateSuggestionInput } from '../lib/api/suggestions';
import { supabase } from '../lib/supabase';

const containerVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.03, duration: 0.35 } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.2 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
  exit: { opacity: 0, y: 6, transition: { duration: 0.18 } }
};

const SuggestionsPage: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  const [formData, setFormData] = useState<CreateSuggestionInput>({
    user_name: '',
    user_email: '',
    subject: '',
    type: 'feature_request',
    priority: 'medium',
    message: '',
    attachment: null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Carregar dados do usuário
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', user.id)
          .single();

        if (profile) {
          setFormData(prev => ({
            ...prev,
            user_name: profile.name || '',
            user_email: profile.email || user.email || ''
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            user_email: user.email || ''
          }));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  const feedbackTypes = [
    {
      value: 'bug_report',
      label: 'Relato de Problema',
      description: 'Reportar bugs ou erros no sistema',
      icon: Bug,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800'
    },
    {
      value: 'feature_request',
      label: 'Nova Funcionalidade',
      description: 'Sugerir novas funcionalidades',
      icon: Lightbulb,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800'
    },
    {
      value: 'improvement',
      label: 'Melhoria Existente',
      description: 'Melhorar funcionalidades atuais',
      icon: Zap,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    {
      value: 'other',
      label: 'Outro',
      description: 'Outros tipos de feedback',
      icon: MessageSquare,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800'
    }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Baixa', color: 'text-green-600 dark:text-green-400' },
    { value: 'medium', label: 'Média', color: 'text-yellow-600 dark:text-yellow-400' },
    { value: 'high', label: 'Alta', color: 'text-red-600 dark:text-red-400' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = SuggestionsAPI.validateAttachment(file);
    if (!validation.valid) {
      setErrors(prev => ({ ...prev, attachment: validation.error || '' }));
      return;
    }

    setSelectedFile(file);
    setFormData(prev => ({ ...prev, attachment: file }));
    setErrors(prev => ({ ...prev, attachment: '' }));

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFormData(prev => ({ ...prev, attachment: null }));
    setErrors(prev => ({ ...prev, attachment: '' }));
  };

  const handleTypeChange = (type: string) => {
    setFormData(prev => ({ ...prev, type: type as any }));
    if (errors.type) {
      setErrors(prev => ({ ...prev, type: '' }));
    }
  };

  const handlePriorityChange = (priority: string) => {
    setFormData(prev => ({ ...prev, priority: priority as any }));
    if (errors.priority) {
      setErrors(prev => ({ ...prev, priority: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.user_name.trim()) {
      newErrors.user_name = 'Nome é obrigatório';
    } else if (formData.user_name.trim().length < 2) {
      newErrors.user_name = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!formData.user_email.trim()) {
      newErrors.user_email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.user_email.trim())) {
      newErrors.user_email = 'Email inválido';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Assunto é obrigatório';
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = 'Assunto deve ter pelo menos 5 caracteres';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Mensagem é obrigatória';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Mensagem deve ter pelo menos 10 caracteres';
    } else if (formData.message.trim().length > 5000) {
      newErrors.message = 'Mensagem deve ter no máximo 5000 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await SuggestionsAPI.createSuggestion(formData, user?.id);

      if (error) {
        throw error;
      }

      showSuccess('Sugestão enviada com sucesso! Obrigado pelo seu feedback.');

      setFormData({
        user_name: formData.user_name,
        user_email: formData.user_email,
        subject: '',
        type: 'feature_request',
        priority: 'medium',
        message: '',
        attachment: null
      });
      setSelectedFile(null);
      setFilePreview(null);
      
    } catch (error: any) {
      console.error('Error submitting suggestion:', error);
      showError(error?.message || 'Erro ao enviar sugestão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <motion.div initial="hidden" animate="visible" exit="exit" variants={containerVariants} className="bg-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-2xl p-6 shadow-sm border border-gray-200/10 dark:border-gray-800/20 bg-white/6 dark:bg-gray-900/40">
            <div className="flex items-center justify-center py-12">
              <motion.div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" aria-hidden />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const selectedType = feedbackTypes.find(type => type.value === formData.type);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
      className="bg-transparent min-h-screen"
    >
      <motion.main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" variants={itemVariants}>
        {/* Header */}
        <motion.div layout variants={itemVariants} className="mb-8 relative overflow-hidden rounded-2xl p-8 shadow-xl border border-purple-200/30 dark:border-purple-800/30 bg-gradient-to-br from-purple-50/80 to-blue-50/80 dark:from-purple-900/20 dark:to-blue-900/20 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          
          <div className="relative flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <MessageSquare className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Enviar Sugestão</h1>
              <p className="text-gray-600 dark:text-gray-300">Sua opinião é importante para nós! Ajude-nos a melhorar o sistema.</p>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div layout variants={itemVariants} className="rounded-2xl p-6 shadow-sm border border-gray-200/10 dark:border-gray-800/20 bg-white/6 dark:bg-gray-900/40">
          <motion.form onSubmit={handleSubmit} className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.35 } }}>
            
            {/* Dados do Usuário */}
            <motion.div layout variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div layout>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Seu Nome Completo *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="user_name"
                    value={formData.user_name}
                    onChange={handleInputChange}
                    placeholder="Digite seu nome completo"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 ${errors.user_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    required
                  />
                </div>
                {errors.user_name && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {errors.user_name}
                  </p>
                )}
              </motion.div>

              <motion.div layout>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Seu Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    name="user_email"
                    value={formData.user_email}
                    onChange={handleInputChange}
                    placeholder="seu@email.com"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 ${errors.user_email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    required
                  />
                </div>
                {errors.user_email && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {errors.user_email}
                  </p>
                )}
              </motion.div>
            </motion.div>

            {/* Assunto */}
            <motion.div layout variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assunto da Sugestão *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Resumo da sua sugestão"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 ${errors.subject ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  required
                />
              </div>
              {errors.subject && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {errors.subject}
                </p>
              )}
            </motion.div>

            {/* Tipo de Feedback */}
            <motion.div layout variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Tipo de Feedback *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feedbackTypes.map((type) => {
                  const IconComponent = type.icon;
                  const isSelected = formData.type === type.value;
                  
                  return (
                    <motion.button
                      key={type.value}
                      type="button"
                      onClick={() => handleTypeChange(type.value)}
                      layout
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22 }}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${isSelected ? `${type.bgColor} ${type.borderColor} shadow-lg` : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? type.bgColor : 'bg-gray-100 dark:bg-gray-700'}`}>
                          <IconComponent className={`h-5 w-5 ${isSelected ? type.color : 'text-gray-500 dark:text-gray-400'}`} />
                        </div>
                        <div>
                          <div className={`font-semibold ${isSelected ? type.color : 'text-gray-900 dark:text-white'}`}>
                            {type.label}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {type.description}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Prioridade */}
            <motion.div layout variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Nível de Urgência *
              </label>
              <div className="flex flex-wrap gap-4">
                {priorityOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    type="button"
                    onClick={() => handlePriorityChange(option.value)}
                    layout
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`px-6 py-3 rounded-lg border-2 font-medium transition-all duration-200 hover:scale-105 ${formData.priority === option.value ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 shadow-lg' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}
                  >
                    <span className={formData.priority === option.value ? option.color : ''}>
                      {option.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Mensagem */}
            <motion.div layout variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Detalhes da Sugestão *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={6}
                placeholder="Descreva sua sugestão em detalhes..."
                className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 resize-none ${errors.message ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                required
              />
              <div className="flex justify-between items-center mt-2">
                {errors.message ? (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {errors.message}
                  </p>
                ) : (
                  <div></div>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formData.message.length}/5000 caracteres
                </p>
              </div>
            </motion.div>

            {/* File Upload */}
            <motion.div layout variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Anexar Arquivo (Opcional)
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Anexe capturas de tela ou documentos (PNG, JPG, GIF, PDF - máx. 10MB)
              </p>

              <AnimatePresence initial={false}>
                {!selectedFile ? (
                  <motion.div key="uploader" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="relative">
                    <input
                      type="file"
                      id="file-upload"
                      accept="image/png,image/jpeg,image/jpg,image/gif,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 ${errors.attachment ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'}`}
                    >
                      <Upload className={`h-8 w-8 mb-2 ${errors.attachment ? 'text-red-500' : 'text-gray-400'}`} />
                      <p className={`text-sm font-medium ${errors.attachment ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'}`}>
                        Clique para selecionar ou arraste o arquivo aqui
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        PNG, JPG, GIF, PDF (máx. 10MB)
                      </p>
                    </label>
                  </motion.div>
                ) : (
                  <motion.div key="preview" layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {filePreview ? (
                          <motion.img src={filePreview} alt="Preview" initial={{ scale: 0.98 }} animate={{ scale: 1 }} className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <File className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {selectedFile?.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(selectedFile?.size ? (selectedFile.size / 1024 / 1024).toFixed(2) : '0')} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors duration-200"
                        title="Remover arquivo"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {errors.attachment && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {errors.attachment}
                </p>
              )}
            </motion.div>

            {/* Botão de Envio */}
            <motion.div layout variants={itemVariants} className="pt-4">
              <motion.button
                type="submit"
                disabled={submitting}
                whileTap={{ scale: 0.995 }}
                className="w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 text-white flex items-center justify-center space-x-3"
              >
                {submitting ? (
                  <>
                    <motion.div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" aria-hidden />
                    <span>Enviando sugestão...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-6 w-6" />
                    <span>Enviar Sugestão</span>
                  </>
                )}
              </motion.button>
            </motion.div>

            <motion.p layout className="text-center text-sm text-gray-500 dark:text-gray-400">
              * Campos obrigatórios
            </motion.p>
          </motion.form>
        </motion.div>

        {/* Info Card */}
        <motion.div layout variants={itemVariants} className="mt-8 rounded-2xl p-6 border border-blue-200/30 dark:border-blue-800/30 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Como suas sugestões nos ajudam
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">•</span>
                  <span>Identificamos problemas que podem ter passado despercebidos</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">•</span>
                  <span>Priorizamos funcionalidades baseadas no feedback dos usuários</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">•</span>
                  <span>Melhoramos a experiência geral da plataforma</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.main>
    </motion.div>
  );
};

export default SuggestionsPage;
