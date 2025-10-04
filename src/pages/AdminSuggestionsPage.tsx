import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Bug,
  Lightbulb,
  Zap,
  ChevronDown,
  X,
  ArrowLeft,
  Trash2,
  Paperclip,
  Download,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SuggestionsAPI, Suggestion } from '../lib/api/suggestions';
import { useNotification } from '../context/NotificationContext';
import ConfirmModal from '../components/ConfirmModal';

const AdminSuggestionsPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
  // Modal states
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [suggestionToDelete, setSuggestionToDelete] = useState<Suggestion | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch suggestions
  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await SuggestionsAPI.getAllSuggestions();
      
      if (error) {
        showError('Erro ao carregar sugestões');
        console.error('Error fetching suggestions:', error);
      } else {
        setSuggestions(data || []);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      showError('Erro inesperado ao carregar sugestões');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  // Filter suggestions
  useEffect(() => {
    let filtered = suggestions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(suggestion =>
        suggestion.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        suggestion.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        suggestion.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        suggestion.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(suggestion => suggestion.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(suggestion => suggestion.type === typeFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(suggestion => suggestion.priority === priorityFilter);
    }

    setFilteredSuggestions(filtered);
  }, [suggestions, searchTerm, statusFilter, typeFilter, priorityFilter]);

  const handleGoBack = () => {
    navigate('/admin/dashboard');
  };

  const handleViewDetails = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setShowDetailsModal(true);
  };

  const handleUpdateStatus = async (suggestionId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const { data, error } = await SuggestionsAPI.updateSuggestionStatus({
        id: suggestionId,
        status: newStatus as any
      });

      if (error) {
        throw error;
      }

      // Update local state
      setSuggestions(prev => 
        prev.map(s => s.id === suggestionId ? { ...s, status: newStatus as any } : s)
      );

      if (selectedSuggestion && selectedSuggestion.id === suggestionId) {
        setSelectedSuggestion(prev => prev ? { ...prev, status: newStatus as any } : null);
      }

      showSuccess('Status atualizado com sucesso!');
    } catch (error: any) {
      console.error('Error updating suggestion status:', error);
      showError(error?.message || 'Erro ao atualizar status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteSuggestion = (suggestion: Suggestion) => {
    setSuggestionToDelete(suggestion);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteSuggestion = async () => {
    if (!suggestionToDelete) return;

    setDeleting(true);
    try {
      const { error } = await SuggestionsAPI.deleteSuggestion(suggestionToDelete.id);

      if (error) {
        throw error;
      }

      // Update local state
      setSuggestions(prev => prev.filter(s => s.id !== suggestionToDelete.id));
      
      if (selectedSuggestion && selectedSuggestion.id === suggestionToDelete.id) {
        setShowDetailsModal(false);
        setSelectedSuggestion(null);
      }

      showSuccess('Sugestão excluída com sucesso!');
    } catch (error: any) {
      console.error('Error deleting suggestion:', error);
      showError(error?.message || 'Erro ao excluir sugestão');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setSuggestionToDelete(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug_report':
        return <Bug className="h-4 w-4 text-red-500" />;
      case 'feature_request':
        return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case 'improvement':
        return <Zap className="h-4 w-4 text-blue-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'bug_report':
        return 'Relato de Problema';
      case 'feature_request':
        return 'Nova Funcionalidade';
      case 'improvement':
        return 'Melhoria Existente';
      default:
        return 'Outro';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Nova</span>;
      case 'in_progress':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Em Andamento</span>;
      case 'resolved':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Resolvida</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Rejeitada</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Alta</span>;
      case 'medium':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Média</span>;
      case 'low':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Baixa</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">{priority}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGoBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Gerenciar Sugestões
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {filteredSuggestions.length} de {suggestions.length} sugestões
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar sugestões..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Todos os Status</option>
                <option value="new">Nova</option>
                <option value="in_progress">Em Andamento</option>
                <option value="resolved">Resolvida</option>
                <option value="rejected">Rejeitada</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full appearance-none px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Todos os Tipos</option>
                <option value="bug_report">Relato de Problema</option>
                <option value="feature_request">Nova Funcionalidade</option>
                <option value="improvement">Melhoria Existente</option>
                <option value="other">Outro</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Priority Filter */}
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full appearance-none px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Todas as Prioridades</option>
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Suggestions Table */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          {filteredSuggestions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                {suggestions.length === 0 ? 'Nenhuma sugestão encontrada' : 'Nenhuma sugestão corresponde aos filtros'}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {suggestions.length === 0 
                  ? 'Quando os usuários enviarem sugestões, elas aparecerão aqui.'
                  : 'Tente ajustar os filtros de busca.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Assunto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Prioridade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Anexo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Data de Envio
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredSuggestions.map((suggestion) => (
                    <tr key={suggestion.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {suggestion.user_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {suggestion.user_email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                          {suggestion.subject}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(suggestion.type)}
                          <span className="text-sm text-gray-900 dark:text-white">
                            {getTypeLabel(suggestion.type)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPriorityBadge(suggestion.priority)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(suggestion.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {suggestion.attachment_url ? (
                          <div className="flex justify-center">
                            <Paperclip className="h-4 w-4 text-green-600 dark:text-green-400" title="Possui anexo" />
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(suggestion.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewDetails(suggestion)}
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors duration-200"
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSuggestion(suggestion)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200"
                            title="Excluir sugestão"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedSuggestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Detalhes da Sugestão
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Informações do Usuário
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Nome:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {selectedSuggestion.user_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {selectedSuggestion.user_email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Suggestion Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {selectedSuggestion.subject}
                </h3>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(selectedSuggestion.type)}
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {getTypeLabel(selectedSuggestion.type)}
                    </span>
                  </div>
                  {getPriorityBadge(selectedSuggestion.priority)}
                  {getStatusBadge(selectedSuggestion.status)}
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {selectedSuggestion.message}
                  </p>
                </div>
              </div>

              {/* Attachment */}
              {selectedSuggestion.attachment_url && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Anexo
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {selectedSuggestion.attachment_name?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                            <FileText className="h-8 w-8 text-red-600 dark:text-red-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {selectedSuggestion.attachment_name || 'Arquivo anexado'}
                          </p>
                          {selectedSuggestion.attachment_size && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(selectedSuggestion.attachment_size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          )}
                        </div>
                      </div>
                      <a
                        href={selectedSuggestion.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                      >
                        <Download className="h-4 w-4" />
                        <span>Baixar</span>
                      </a>
                    </div>
                    {selectedSuggestion.attachment_name?.match(/\.(jpg|jpeg|png|gif)$/i) && (
                      <div className="mt-4">
                        <img
                          src={selectedSuggestion.attachment_url}
                          alt="Anexo"
                          className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Atualizar Status
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'new', label: 'Nova', icon: Clock, color: 'bg-blue-600 hover:bg-blue-700' },
                    { value: 'in_progress', label: 'Em Andamento', icon: Clock, color: 'bg-yellow-600 hover:bg-yellow-700' },
                    { value: 'resolved', label: 'Resolvida', icon: CheckCircle, color: 'bg-green-600 hover:bg-green-700' },
                    { value: 'rejected', label: 'Rejeitada', icon: XCircle, color: 'bg-red-600 hover:bg-red-700' }
                  ].map((status) => {
                    const IconComponent = status.icon;
                    const isSelected = selectedSuggestion.status === status.value;
                    
                    return (
                      <button
                        key={status.value}
                        onClick={() => handleUpdateStatus(selectedSuggestion.id, status.value)}
                        disabled={updating || isSelected}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-white ${
                          isSelected 
                            ? 'opacity-50 cursor-not-allowed' 
                            : status.color
                        }`}
                      >
                        <IconComponent className="h-4 w-4" />
                        <span>{status.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Metadata */}
              <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>Criada em: {formatDate(selectedSuggestion.created_at)}</div>
                  <div>Atualizada em: {formatDate(selectedSuggestion.updated_at)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Excluir Sugestão"
        message={`Tem certeza que deseja excluir a sugestão "${suggestionToDelete?.subject}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
        loading={deleting}
        onConfirm={confirmDeleteSuggestion}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setSuggestionToDelete(null);
        }}
      />
    </div>
  );
};

export default AdminSuggestionsPage;