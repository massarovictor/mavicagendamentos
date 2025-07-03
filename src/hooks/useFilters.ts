import { useState, useMemo, useCallback } from 'react';
import { Agendamento, Espaco, Usuario } from '@/types';
import { FilterUtils } from '@/utils/validations';

interface FilterState {
  searchTerm: string;
  statusFilter: string;
  dateFilter: string;
  userFilter: number | null;
  espacoFilter: number | null;
}

const initialFilterState: FilterState = {
  searchTerm: '',
  statusFilter: 'todos',
  dateFilter: '',
  userFilter: null,
  espacoFilter: null
};

export const useFilters = () => {
  const [filters, setFilters] = useState<FilterState>(initialFilterState);

  const updateFilter = useCallback(<K extends keyof FilterState>(
    key: K, 
    value: FilterState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilterState);
  }, []);

  const applyFilters = useCallback((
    agendamentos: Agendamento[],
    espacos: Espaco[],
    usuarios: Usuario[]
  ) => {
    let filtered = agendamentos;

    // Filtro por status
    filtered = FilterUtils.filterAgendamentosByStatus(filtered, filters.statusFilter);

    // Filtro por usuário
    filtered = FilterUtils.filterAgendamentosByUser(filtered, filters.userFilter || undefined);

    // Filtro por espaço
    filtered = FilterUtils.filterAgendamentosByEspaco(filtered, filters.espacoFilter || undefined);

    // Filtro por data
    if (filters.dateFilter) {
      filtered = FilterUtils.filterAgendamentosByDate(filtered, filters.dateFilter, filters.dateFilter);
    }

    // Filtro por busca
    filtered = FilterUtils.searchAgendamentos(filtered, filters.searchTerm, espacos, usuarios);

    return filtered;
  }, [filters]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchTerm !== '' ||
      filters.statusFilter !== 'todos' ||
      filters.dateFilter !== '' ||
      filters.userFilter !== null ||
      filters.espacoFilter !== null
    );
  }, [filters]);

  return {
    filters,
    updateFilter,
    clearFilters,
    applyFilters,
    hasActiveFilters
  };
}; 