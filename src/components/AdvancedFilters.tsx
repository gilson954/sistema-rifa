import React, { useState } from 'react';
import { Filter, X, Search, Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';

interface FilterOptions {
  priceRange: {
    min: number;
    max: number;
  };
  ticketRange: {
    min: number;
    max: number;
  };
  status: string[];
  sortBy: string;
  searchTerm: string;
}

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  initialFilters: FilterOptions;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  initialFilters
}) => {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      priceRange: { min: 0, max: 1000 },
      ticketRange: { min: 0, max: 10000 },
      status: [],
      sortBy: 'newest',
      searchTerm: ''
    };
    setFilters(resetFilters);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros Avançados
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Search className="h-4 w-4 inline mr-1" />
              Buscar por título
            </label>
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              placeholder="Digite o título da campanha..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <DollarSign className="h-4 w-4 inline mr-1" />
              Faixa de Preço por Cota
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Mínimo</label>
                <input
                  type="number"
                  value={filters.priceRange.min}
                  onChange={(e) => setFilters({
                    ...filters,
                    priceRange: { ...filters.priceRange, min: Number(e.target.value) }
                  })}
                  placeholder="R$ 0,00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Máximo</label>
                <input
                  type="number"
                  value={filters.priceRange.max}
                  onChange={(e) => setFilters({
                    ...filters,
                    priceRange: { ...filters.priceRange, max: Number(e.target.value) }
                  })}
                  placeholder="R$ 1.000,00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Ticket Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Users className="h-4 w-4 inline mr-1" />
              Quantidade de Cotas
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Mínimo</label>
                <input
                  type="number"
                  value={filters.ticketRange.min}
                  onChange={(e) => setFilters({
                    ...filters,
                    ticketRange: { ...filters.ticketRange, min: Number(e.target.value) }
                  })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Máximo</label>
                <input
                  type="number"
                  value={filters.ticketRange.max}
                  onChange={(e) => setFilters({
                    ...filters,
                    ticketRange: { ...filters.ticketRange, max: Number(e.target.value) }
                  })}
                  placeholder="10.000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status da Campanha
            </label>
            <div className="space-y-2">
              {[
                { value: 'active', label: 'Ativas', color: 'text-green-600' },
                { value: 'draft', label: 'Rascunho', color: 'text-yellow-600' },
                { value: 'completed', label: 'Finalizadas', color: 'text-blue-600' },
                { value: 'cancelled', label: 'Canceladas', color: 'text-red-600' }
              ].map((status) => (
                <label key={status.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.status.includes(status.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFilters({
                          ...filters,
                          status: [...filters.status, status.value]
                        });
                      } else {
                        setFilters({
                          ...filters,
                          status: filters.status.filter(s => s !== status.value)
                        });
                      }
                    }}
                    className="w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <span className={`ml-2 text-sm ${status.color} dark:text-gray-300`}>
                    {status.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <TrendingUp className="h-4 w-4 inline mr-1" />
              Ordenar por
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="newest">Mais recentes</option>
              <option value="oldest">Mais antigas</option>
              <option value="price_low">Menor preço</option>
              <option value="price_high">Maior preço</option>
              <option value="tickets_low">Menos cotas</option>
              <option value="tickets_high">Mais cotas</option>
              <option value="progress">Progresso de vendas</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
          >
            Limpar filtros
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilters;