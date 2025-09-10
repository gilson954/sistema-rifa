import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Download, 
  BarChart3, 
  Users, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useCampaign } from '../hooks/useCampaigns';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/currency';

interface Transaction {
  quota_number: number;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  value: number;
  status: string;
  transaction_date: string;
}

interface SalesMetrics {
  unique_paid_participants: number;
  unique_reserved_unpaid_participants: number;
  total_sales_quantity: number;
  total_sales_value: number;
  total_reservations_quantity: number;
  total_reservations_value: number;
  total_reserved_unpaid_quantity: number;
  total_reserved_unpaid_value: number;
  website_visits: string;
}

interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_records: number;
}

interface SalesHistoryData {
  transactions: Transaction[];
  metrics: SalesMetrics;
  pagination: PaginationInfo;
}

const SalesHistoryPage = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { campaign, loading: campaignLoading } = useCampaign(campaignId || '');

  // Search and filter state
  const [searchField, setSearchField] = useState('name');
  const [searchValue, setSearchValue] = useState('');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [orderBy, setOrderBy] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<SalesMetrics | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [tempOrderBy, setTempOrderBy] = useState(orderBy);
  const [tempStatusFilters, setTempStatusFilters] = useState<string[]>(statusFilters);

  // Search field options
  const searchFieldOptions = [
    { value: 'name', label: 'Nome' },
    { value: 'quota_number', label: 'Número (cota)' },
    { value: 'phone', label: 'Celular' },
    { value: 'email', label: 'Email' }
  ];

  // Status filter options
  const statusFilterOptions = [
    { value: 'comprado', label: 'Compra aprovada' },
    { value: 'reservado', label: 'Reservado' },
    { value: 'reservou_nao_pagou', label: 'Reservou mas não pagou' },
    { value: 'compra_cancelada', label: 'Compra cancelada' },
    { value: 'pendente_aprovacao', label: 'Pendente aprovação' }
  ];

  // Fetch sales history data
  const fetchSalesHistory = useCallback(async () => {
    if (!campaignId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('get_campaign_sales_history', {
        p_campaign_id: campaignId,
        p_search_field: searchField,
        p_search_value: searchValue,
        p_status_filters: statusFilters,
        p_order_by: orderBy,
        p_page: currentPage,
        p_page_size: pageSize
      });

      if (error) {
        console.error('Error fetching sales history:', error);
        setError('Erro ao carregar histórico de vendas');
        setTransactions([]);
        setMetrics(null);
        setPagination(null);
      } else {
        const salesData = data as SalesHistoryData;
        setTransactions(salesData.transactions || []);
        setMetrics(salesData.metrics || null);
        setPagination(salesData.pagination || null);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Erro inesperado ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [campaignId, searchField, searchValue, statusFilters, orderBy, currentPage, pageSize]);

  // Load data when component mounts or dependencies change
  useEffect(() => {
    fetchSalesHistory();
  }, [fetchSalesHistory]);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page
    fetchSalesHistory();
  };

  // Handle filter modal confirm
  const handleFiltersConfirm = () => {
    setOrderBy(tempOrderBy);
    setStatusFilters(tempStatusFilters);
    setCurrentPage(1); // Reset to first page
    setShowFiltersModal(false);
  };

  // Handle filter modal cancel
  const handleFiltersCancel = () => {
    setTempOrderBy(orderBy);
    setTempStatusFilters(statusFilters);
    setShowFiltersModal(false);
  };

  // Handle status filter toggle
  const handleStatusFilterToggle = (status: string) => {
    setTempStatusFilters(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle export
  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!campaignId) return;

    try {
      // Fetch all data for export (no pagination)
      const { data, error } = await supabase.rpc('get_campaign_sales_history', {
        p_campaign_id: campaignId,
        p_search_field: searchField,
        p_search_value: searchValue,
        p_status_filters: statusFilters,
        p_order_by: orderBy,
        p_page: 1,
        p_page_size: 10000 // Large number to get all records
      });

      if (error) {
        alert('Erro ao exportar dados');
        return;
      }

      const salesData = data as SalesHistoryData;
      
      if (format === 'csv') {
        exportToCSV(salesData.transactions);
      } else {
        alert('Exportação PDF será implementada em breve');
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('Erro ao exportar dados');
    }
  };

  // Export to CSV
  const exportToCSV = (data: Transaction[]) => {
    const headers = ['Número', 'Nome', 'Celular', 'Email', 'Valor', 'Status', 'Data/Hora'];
    const csvContent = [
      headers.join(','),
      ...data.map(transaction => [
        transaction.quota_number,
        `"${transaction.customer_name || ''}"`,
        `"${transaction.customer_phone || ''}"`,
        `"${transaction.customer_email || ''}"`,
        transaction.value.toFixed(2),
        `"${getStatusText(transaction.status)}"`,
        `"${formatDate(transaction.transaction_date)}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historico-vendas-${campaign?.title || 'campanha'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status text and color
  const getStatusText = (status: string) => {
    switch (status) {
      case 'comprado':
        return 'Compra aprovada';
      case 'reservado':
        return 'Reservado';
      case 'disponível':
        return 'Disponível';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'comprado':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'reservado':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'disponível':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  // Handle go back
  const handleGoBack = () => {
    navigate('/dashboard');
  };

  if (campaignLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6 rounded-lg border border-gray-200 dark:border-gray-800">
        <p className="text-center text-gray-500 dark:text-gray-400">Campanha não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleGoBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Histórico de Vendas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {campaign.title}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <Download className="h-4 w-4" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <Download className="h-4 w-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      {metrics && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Relatório Resumido
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">Vendas</span>
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {metrics.total_sales_quantity}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                {formatCurrency(metrics.total_sales_value)}
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Reservas</span>
              </div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {metrics.total_reservations_quantity}
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300">
                {formatCurrency(metrics.total_reservations_value)}
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Participantes</span>
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {metrics.unique_paid_participants}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                Únicos (pagaram)
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-800 dark:text-red-200">Não Pagaram</span>
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {metrics.total_reserved_unpaid_quantity}
              </div>
              <div className="text-sm text-red-700 dark:text-red-300">
                {formatCurrency(metrics.total_reserved_unpaid_value)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters Toolbar */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Field Dropdown */}
          <div className="relative">
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {searchFieldOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Search Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={`Buscar por ${searchFieldOptions.find(opt => opt.value === searchField)?.label.toLowerCase()}...`}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <Search className="h-4 w-4" />
            <span>Buscar</span>
          </button>

          {/* Filters Button */}
          <button
            onClick={() => setShowFiltersModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <Filter className="h-4 w-4" />
            <span>Filtros</span>
            {statusFilters.length > 0 && (
              <span className="bg-white text-gray-600 px-2 py-1 rounded-full text-xs font-bold">
                {statusFilters.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando transações...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Erro ao carregar dados
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={fetchSalesHistory}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Tentar novamente
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma transação encontrada
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Não há transações para os filtros selecionados.
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Número
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Celular
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Data/Hora
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {transactions.map((transaction, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {transaction.quota_number.toString().padStart(3, '0')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {transaction.customer_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {transaction.customer_phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {transaction.customer_email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(transaction.value)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                          {getStatusText(transaction.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(transaction.transaction_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, pagination.total_records)} de {pagination.total_records} resultados
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center space-x-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed text-gray-900 dark:text-white rounded-lg transition-colors duration-200"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Anterior</span>
                  </button>
                  
                  <span className="px-4 py-2 text-gray-900 dark:text-white">
                    {currentPage} de {pagination.total_pages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.total_pages}
                    className="flex items-center space-x-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed text-gray-900 dark:text-white rounded-lg transition-colors duration-200"
                  >
                    <span>Próximo</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Filters Modal */}
      {showFiltersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filtros Avançados
              </h3>
              <button
                onClick={handleFiltersCancel}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Ordenação */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Ordenação
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="orderBy"
                      value="recent"
                      checked={tempOrderBy === 'recent'}
                      onChange={(e) => setTempOrderBy(e.target.value)}
                      className="w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Mais recente
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="orderBy"
                      value="oldest"
                      checked={tempOrderBy === 'oldest'}
                      onChange={(e) => setTempOrderBy(e.target.value)}
                      className="w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Mais antigo
                    </span>
                  </label>
                </div>
              </div>

              {/* Status Filters */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Tipos de transação
                </h4>
                <div className="space-y-2">
                  {statusFilterOptions.map(option => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={tempStatusFilters.includes(option.value)}
                        onChange={() => handleStatusFilterToggle(option.value)}
                        className="w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleFiltersCancel}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors duration-200"
              >
                Voltar
              </button>
              <button
                onClick={handleFiltersConfirm}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistoryPage;