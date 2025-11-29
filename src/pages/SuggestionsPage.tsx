import React, { useState, useEffect } from 'react';
import { Send, Lightbulb, Bug, Zap, MessageSquare, AlertTriangle, CheckCircle, User, Mail, FileText, Upload, X, File } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion'; // 1. Importação do Framer Motion
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { SuggestionsAPI, CreateSuggestionInput } from '../lib/api/suggestions';
import { supabase } from '../lib/supabase';

// 2. Definições de Variants (para organização e reutilização de animações)
const pageContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: {
      duration: 0.3,
      when: "beforeChildren",
      staggerChildren: 0.15, // Escalonar as principais seções (Header, Form, Info)
    }
  },
};

const sectionItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const formContainerVariants: Variants = {
  visible: {
    transition: {
      staggerChildren: 0.1, // Escalonar os campos individuais do formulário
    },
  },
};

const formItemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const cardButtonVariants: Variants = {
  hover: { scale: 1.02, transition: { duration: 0.2 } },
  tap: { scale: 0.98 },
  selected: { 
    scale: 1.05, 
    boxShadow: '0 10px 15px -3px rgba(168, 85, 247, 0.3), 0 4px 6px -2px rgba(168, 85, 247, 0.2)', // Sombra para destacar
    transition: { type: "spring", stiffness: 400, damping: 15 }, // Efeito de mola
  }
};

const priorityButtonVariants: Variants = {
    hover: { scale: 1.05, transition: { duration: 0.15 } },
    tap: { scale: 0.95 },
};

const SuggestionsPage = () => {
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

  type SuggestionType = CreateSuggestionInput['type'];
  type SuggestionPriority = CreateSuggestionInput['priority'];

  const handleTypeChange = (type: SuggestionType) => {
    setFormData(prev => ({ ...prev, type }));
    if (errors.type) {
      setErrors(prev => ({ ...prev, type: '' }));
    }
  };

  const handlePriorityChange = (priority: SuggestionPriority) => {
    setFormData(prev => ({ ...prev, priority }));
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
      const { error } = await SuggestionsAPI.createSuggestion(formData, user?.id);

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
      
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      const message = typeof error === 'object' && error && 'message' in error ? (error as { message?: string }).message || 'Erro ao enviar sugestão. Tente novamente.' : 'Erro ao enviar sugestão. Tente novamente.';
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Renderização Condicional com AnimatePresence para o estado de Loading
  if (loading) {
    return (
      <AnimatePresence mode="wait">
        <motion.div 
          key="loading-state" 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-transparent"
        >
          <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-200/10 dark:border-gray-800/20 bg-white/6 dark:bg-gray-900/40">
              <div className="flex items-center justify-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-purple-600" />
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }


  // 4. Conteúdo da Página Principal com Animações
  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key="loaded-page" 
        className="bg-transparent min-h-screen"
        variants={pageContainerVariants}
        initial="hidden"
        animate="visible"
        exit="hidden" // Usar estado 'hidden' para animação de saída
      >
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
        <motion.main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
          
          {/* Header */}
          <motion.div 
            className="mb-6 sm:mb-8 relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-xl border border-purple-200/30 dark:border-purple-800/30 bg-gradient-to-br from-purple-50/80 to-blue-50/80 dark:from-purple-900/20 dark:to-blue-900/20 backdrop-blur-sm"
            variants={sectionItemVariants}
          >
            <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
            
            <div className="relative flex items-center space-x-3 sm:space-x-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Envie-nos seu Feedback
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
                  Sua opinião é valiosa! Sugira uma melhoria, reporte um bug ou proponha uma nova funcionalidade.
                </p>
              </div>
            </div>
          </motion.div>
          
          {/* Main Form Content */}
          <motion.div 
            className="rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-xl border border-gray-200/10 dark:border-gray-800/20 bg-white dark:bg-gray-900"
            variants={sectionItemVariants}
          >
            <motion.form 
              onSubmit={handleSubmit} 
              className="space-y-6 sm:space-y-8"
              variants={formContainerVariants} // Container para o staggering dos campos
              initial="hidden"
              animate="visible"
            >
              
              {/* Informações do Usuário */}
              <motion.div className="space-y-6 sm:space-y-8" variants={formItemVariants}>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  1. Suas Informações
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Nome */}
                  <motion.div variants={formItemVariants}>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2"> 
                      Seu Nome * </label>
                    <div className="relative">
                      <User className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      <input 
                        type="text" 
                        name="user_name" 
                        value={formData.user_name} 
                        onChange={handleInputChange} 
                        placeholder="Digite seu nome completo" 
                        className={`w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-xs sm:text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 ${ 
                          errors.user_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600' 
                        }`} 
                        required 
                      />
                    </div>
                    {errors.user_name && (
                      <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" /> {errors.user_name}
                      </p>
                    )}
                  </motion.div>
                  
                  {/* Email */}
                  <motion.div variants={formItemVariants}>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2"> 
                      Seu Email * </label>
                    <div className="relative">
                      <Mail className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      <input 
                        type="email" 
                        name="user_email" 
                        value={formData.user_email} 
                        onChange={handleInputChange} 
                        placeholder="seu@email.com" 
                        className={`w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-xs sm:text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 ${ 
                          errors.user_email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600' 
                        }`} 
                        required 
                      />
                    </div>
                    {errors.user_email && (
                      <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" /> {errors.user_email}
                      </p>
                    )}
                  </motion.div>
                </div>
              </motion.div>

              {/* Tipo de Feedback */}
              <motion.div className="space-y-4" variants={formItemVariants}>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  2. Tipo de Sugestão *
                </h2>
                <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                  <AnimatePresence>
                    {feedbackTypes.map((type) => {
                      const isSelected = formData.type === type.value;
                      const Icon = type.icon;
                      
                      return (
                        <motion.button
                          key={type.value}
                          type="button"
                          onClick={() => handleTypeChange(type.value)}
                          className={`
                            p-2 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 
                            flex flex-col items-start text-left space-y-2
                            ${
                              isSelected 
                                ? `${type.borderColor} ${type.bgColor} ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-purple-500/50` 
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-600'
                            }
                          `}
                          variants={cardButtonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          animate={isSelected ? "selected" : "animate"}
                        >
                            <motion.div
                                className={`p-2 rounded-lg ${type.bgColor}`}
                                initial={false}
                                animate={{ 
                                    rotate: isSelected ? 10 : 0, 
                                    scale: isSelected ? 1.1 : 1 
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                            >
                                <Icon className={`h-5 w-5 ${type.color}`} />
                            </motion.div>
                          <div className="flex-1 min-w-0 mt-2">
                            <div className={`text-xs sm:text-sm font-semibold ${isSelected ? type.color : 'text-gray-900 dark:text-white'}`}>
                              {type.label}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {type.description}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
              </motion.div>

              {/* Assunto */}
              <motion.div variants={formItemVariants}>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2"> 
                  Assunto/Título * </label>
                <div className="relative">
                  <FileText className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <input 
                    type="text" 
                    name="subject" 
                    value={formData.subject} 
                    onChange={handleInputChange} 
                    placeholder="Ex: Não consigo acessar a página X" 
                    className={`w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-xs sm:text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 ${ 
                      errors.subject ? 'border-red-500' : 'border-gray-300 dark:border-gray-600' 
                    }`} 
                    required 
                  />
                </div>
                {errors.subject && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" /> {errors.subject}
                  </p>
                )}
              </motion.div>

              {/* Prioridade */}
              <motion.div variants={formItemVariants}>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-4"> 
                  3. Nível de Urgência * </label>
                <div className="flex flex-wrap gap-2 sm:gap-4">
                  {priorityOptions.map((option) => (
                    <motion.button 
                      key={option.value} 
                      type="button" 
                      onClick={() => handlePriorityChange(option.value)} 
                      className={`
                        px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm rounded-lg border-2 font-medium 
                        transition-all duration-200 
                        ${ 
                          formData.priority === option.value 
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 shadow-lg' 
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                      variants={priorityButtonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <motion.span 
                          className={formData.priority === option.value ? option.color : ''}
                          animate={{ fontWeight: formData.priority === option.value ? 700 : 500 }}
                      >
                        {option.label}
                      </motion.span>
                    </motion.button>
                  ))}
                </div>
                {errors.priority && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" /> {errors.priority}
                  </p>
                )}
              </motion.div>

              {/* Mensagem */}
              <motion.div variants={formItemVariants}>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2"> 
                  4. Detalhes da Sugestão * </label>
                <textarea 
                  name="message" 
                  value={formData.message} 
                  onChange={handleInputChange} 
                  rows={5} 
                  placeholder="Descreva sua sugestão em detalhes..." 
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 ${ 
                    errors.message ? 'border-red-500' : 'border-gray-300 dark:border-gray-600' 
                  }`} 
                  required
                />
                {errors.message && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" /> {errors.message}
                  </p>
                )}
              </motion.div>

              {/* Anexo */}
              <motion.div variants={formItemVariants}>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2"> 
                  5. Anexo (Opcional) 
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <motion.div 
                        className={`
                          px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg border-2 border-dashed 
                          flex items-center space-x-2 transition-colors duration-200 
                          ${
                            errors.attachment 
                              ? 'border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400'
                          }
                        `}
                        whileHover={{ scale: 1.03, boxShadow: '0 4px 6px rgba(168, 85, 247, 0.1)' }}
                        whileTap={{ scale: 0.98 }}
                    >
                      <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>{selectedFile ? 'Trocar Arquivo' : 'Selecionar Arquivo'}</span>
                    </motion.div>
                  </label>
                  <input 
                    id="file-upload" 
                    type="file" 
                    className="hidden" 
                    onChange={handleFileChange} 
                    accept="image/*,application/pdf"
                  />

                  {selectedFile && (
                    <motion.div 
                        className="flex items-center space-x-3 p-2 border rounded-lg bg-gray-50 dark:bg-gray-700/50"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {filePreview && selectedFile.type.startsWith('image/') ? (
                          <img src={filePreview} alt="Preview" className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                        ) : (
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <File className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate"> 
                            {selectedFile.name} 
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400"> 
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB 
                          </p>
                        </div>
                      </div>
                      <motion.button 
                          type="button" 
                          onClick={handleRemoveFile} 
                          className="p-1.5 sm:p-2 rounded-full text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                          whileHover={{ scale: 1.2, rotate: 90 }}
                          whileTap={{ scale: 0.9 }}
                      >
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                      </motion.button>
                    </motion.div>
                  )}
                </div>
                {errors.attachment && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" /> {errors.attachment}
                  </p>
                )}
              </motion.div>

              {/* Botão de Envio */}
              <motion.div variants={formItemVariants}>
                <motion.button 
                  type="submit" 
                  disabled={submitting}
                  className={`
                    w-full flex items-center justify-center space-x-2 px-6 py-3 text-sm sm:text-base 
                    font-semibold rounded-lg shadow-lg transition-all duration-300 ease-in-out
                    ${submitting 
                        ? 'bg-purple-400 dark:bg-purple-600 cursor-not-allowed opacity-70' 
                        : 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white hover:shadow-xl'
                    }
                  `}
                  whileHover={{ scale: submitting ? 1 : 1.02 }}
                  whileTap={{ scale: submitting ? 1 : 0.98 }}
                >
                  {submitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      <span>Enviando...</span>
                    </div>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Enviar Sugestão</span>
                    </>
                  )}
                </motion.button>
              </motion.div>
            </motion.form>
          </motion.div>

          {/* Info Box */}
          <motion.div 
            className="mt-6 sm:mt-8 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-200/50 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/20 backdrop-blur-sm"
            variants={sectionItemVariants}
          >
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                  Como suas sugestões nos ajudam
                </h3>
                <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
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
                    <span>Melhoramos a experiência geral do usuário de forma contínua</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.main>
      </motion.div>
    </AnimatePresence>
  );
};

export default SuggestionsPage;
