import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Transaction {
  quota_number: number;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  value: number;
  status: string;
  transaction_date: string;
}

export interface SalesMetrics {
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

export interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_records: number;
}

export interface SalesHistoryData {
  transactions: Transaction[];
  metrics: SalesMetrics;
  pagination: PaginationInfo;
}

export interface SalesHistoryFilters {
  searchField: string;
  searchValue: string;
  statusFilters: string[];
  orderBy: string;
  page: number;
  pageSize: number;
}

export const useSalesHistory = (campaignId: string) => {
  const [data, setData] = useState<SalesHistoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<SalesHistoryFilters>({
    searchField: 'name',
    searchValue: '',
    statusFilters: [],
    orderBy: 'recent',
    page: 1,
    pageSize: 20
  });

  // Fetch sales history data
  const fetchSalesHistory = useCallback(async () => {
    if (!campaignId) return;

    setLoading(true);
    setError(null);

    try {
      const { data: result, error: rpcError } = await supabase.rpc('get_campaign_sales_history', {
        p_campaign_id: campaignId,
        p_search_field: filters.searchField,
        p_search_value: filters.searchValue,
        p_status_filters: filters.statusFilters,
        p_order_by: filters.orderBy,
        p_page: filters.page,
        p_page_size: filters.pageSize
      });

      if (rpcError) {
        console.error('Error fetching sales history:', rpcError);
        setError('Erro ao carregar histórico de vendas');
        setData(null);
      } else {
        setData(result as SalesHistoryData);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Erro inesperado ao carregar dados');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [campaignId, filters]);

  // Load data when filters change
  useEffect(() => {
    fetchSalesHistory();
  }, [fetchSalesHistory]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<SalesHistoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      searchField: 'name',
      searchValue: '',
      statusFilters: [],
      orderBy: 'recent',
      page: 1,
      pageSize: 20
    });
  }, []);

  // Search function
  const search = useCallback((searchField: string, searchValue: string) => {
    updateFilters({
      searchField,
      searchValue,
      page: 1 // Reset to first page when searching
    });
  }, [updateFilters]);

  // Apply filters function
  const applyFilters = useCallback((statusFilters: string[], orderBy: string) => {
    updateFilters({
      statusFilters,
      orderBy,
      page: 1 // Reset to first page when filtering
    });
  }, [updateFilters]);

  // Change page function
  const changePage = useCallback((page: number) => {
    updateFilters({ page });
  }, [updateFilters]);

  // Export data function
  const exportData = useCallback(async (): Promise<Transaction[]> => {
    if (!campaignId) return [];

    try {
      const { data: result, error: rpcError } = await supabase.rpc('get_campaign_sales_history', {
        p_campaign_id: campaignId,
        p_search_field: filters.searchField,
        p_search_value: filters.searchValue,
        p_status_filters: filters.statusFilters,
        p_order_by: filters.orderBy,
        p_page: 1,
        p_page_size: 10000 // Large number to get all records
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      const salesData = result as SalesHistoryData;
      return salesData.transactions || [];
    } catch (err) {
      console.error('Error exporting data:', err);
      throw err;
    }
  }, [campaignId, filters]);

  return {
    data,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    search,
    applyFilters,
    changePage,
    exportData,
    refetch: fetchSalesHistory
  };
};