import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X, Filter } from 'lucide-react';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  showStatusFilter?: boolean;
  dateFilter?: string;
  onDateFilterChange?: (value: string) => void;
  showDateFilter?: boolean;
  customFilters?: React.ReactNode;
  onClearFilters: () => void;
  placeholder?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  showStatusFilter = true,
  dateFilter,
  onDateFilterChange,
  showDateFilter = false,
  customFilters,
  onClearFilters,
  placeholder = "Pesquisar..."
}) => {
  const hasActiveFilters = searchTerm || statusFilter !== 'todos' || dateFilter;

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* Barra de pesquisa */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtro de status */}
        {showStatusFilter && (
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="aprovado">Aprovado</SelectItem>
              <SelectItem value="rejeitado">Rejeitado</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Filtro de data */}
        {showDateFilter && onDateFilterChange && (
          <Input
            type="date"
            value={dateFilter || ''}
            onChange={(e) => onDateFilterChange(e.target.value)}
            className="w-[180px]"
          />
        )}

        {/* Filtros customizados */}
        {customFilters}

        {/* Botão limpar filtros */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Indicador de filtros ativos */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter className="h-4 w-4" />
          <span>Filtros ativos:</span>
          {searchTerm && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Busca: "{searchTerm}"
            </span>
          )}
          {statusFilter !== 'todos' && (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
              Status: {statusFilter}
            </span>
          )}
          {dateFilter && (
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
              Data: {new Date(dateFilter).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}; 