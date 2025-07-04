import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useFilters } from '@/hooks/useFilters';
import { usePagination } from '@/hooks/usePagination';
import { useNotifications } from '@/hooks/useNotifications';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Agendamento } from '@/types';
import { Calendar, Check, User, Clock, AlertCircle, X, Search, ClipboardList } from 'lucide-react';
import { formatAulas, formatDate } from '@/utils/format';
import { NumeroAula } from '@/types';

// Opções de status
const statusOptions = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'aprovado', label: 'Aprovados' },
  { value: 'rejeitado', label: 'Rejeitados' }
];

const TodosAgendamentos = () => {
  const { agendamentos, espacos, usuarios, loading, error, actions } = useSupabaseData();
  const notifications = useNotifications();
  const filters = useFilters();

  // Aplicar filtros
  const filteredAgendamentos = useMemo(() => {
    let filtered = agendamentos;

    // Filtro de texto
    if (filters.filters.searchTerm) {
      const searchLower = filters.filters.searchTerm.toLowerCase();
      filtered = filtered.filter(a => {
        const espacoNome = espacos.find(e => e.id === a.espacoId)?.nome || '';
        const usuarioNome = usuarios.find(u => u.id === a.usuarioId)?.nome || '';
        return (
          espacoNome.toLowerCase().includes(searchLower) ||
          usuarioNome.toLowerCase().includes(searchLower) ||
          a.observacoes?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Filtro de status
    if (filters.filters.statusFilter && filters.filters.statusFilter !== 'todos') {
      filtered = filtered.filter(a => a.status === filters.filters.statusFilter);
    }

    return filtered;
  }, [agendamentos, espacos, usuarios, filters.filters]);

  // Paginação
  const pagination = usePagination(filteredAgendamentos, { initialPageSize: 10 });

  // Estatísticas
  const pageStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const agendamentosHoje = agendamentos.filter(a => a.data === today);
    const pendentes = agendamentos.filter(a => a.status === 'pendente');
    const aprovados = agendamentos.filter(a => a.status === 'aprovado');

    return [
      {
        label: 'Total',
        value: agendamentos.length,
        icon: Calendar,
        color: 'bg-blue-500'
      },
      {
        label: 'Hoje',
        value: agendamentosHoje.length,
        icon: Clock,
        color: 'bg-green-500'
      },
      {
        label: 'Pendentes',
        value: pendentes.length,
        icon: AlertCircle,
        color: 'bg-yellow-500'
      },
      {
        label: 'Aprovados',
        value: aprovados.length,
        icon: Check,
        color: 'bg-emerald-500'
      }
    ];
  }, [agendamentos]);

  const handleStatusChange = async (agendamentoId: number, novoStatus: 'aprovado' | 'rejeitado') => {
    try {
      await actions.updateAgendamentoStatus(agendamentoId, novoStatus);
    if (novoStatus === 'aprovado') {
      notifications.agendamento.approved();
    } else {
      notifications.agendamento.rejected();
      }
    } catch (error) {
      notifications.error("Erro", "Falha ao atualizar status do agendamento");
    }
  };

  const getEspacoNome = (espacoId: number) => {
    return espacos.find(e => e.id === espacoId)?.nome || 'Espaço não encontrado';
  };

  const getUsuarioNome = (usuarioId: number) => {
    return usuarios.find(u => u.id === usuarioId)?.nome || 'Usuário não encontrado';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado': return 'bg-green-100 text-green-800';
      case 'rejeitado': return 'bg-red-100 text-red-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aprovado': return 'Aprovado';
      case 'rejeitado': return 'Rejeitado';
      case 'pendente': return 'Pendente';
      default: return status;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Carregando agendamentos..." />;
  }

  if (error) {
    return <ErrorState title="Erro ao carregar dados" message={error} showRetry onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6 p-6">
      {/* PageHeader */}
      <PageHeader
        title="Todos os Agendamentos"
        subtitle="Visualize e gerencie todos os agendamentos do sistema"
        icon={Calendar}
        stats={pageStats}
      />

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium text-gray-700">Buscar agendamentos</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Buscar por espaço, usuário ou observações..."
                  value={filters.filters.searchTerm || ''}
                  onChange={(e) => filters.updateFilter('searchTerm', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Label htmlFor="status" className="text-sm font-medium text-gray-700">Filtrar por status</Label>
              <Select 
                value={filters.filters.statusFilter || 'todos'} 
                onValueChange={(value) => filters.updateFilter('statusFilter', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-auto">
              <Label className="text-sm font-medium text-gray-700">&nbsp;</Label>
              <Button 
                variant="outline" 
                onClick={filters.clearFilters}
                className="w-full mt-1"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Lista de Agendamentos
          </CardTitle>
          <CardDescription>
            Mostrando {pagination.paginationInfo.startItem} a {pagination.paginationInfo.endItem} de {pagination.paginationInfo.totalItems} agendamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTable
            data={pagination.paginatedData}
            columns={[
              {
                key: 'espaco',
                header: 'Espaço',
                accessor: (agendamento) => getEspacoNome(agendamento.espacoId),
                mobileLabel: 'Espaço'
              },
              {
                key: 'usuario',
                header: 'Usuário',
                accessor: (agendamento) => getUsuarioNome(agendamento.usuarioId),
                mobileLabel: 'Usuário',
                hiddenOnMobile: true
              },
              {
                key: 'data',
                header: 'Data',
                accessor: (agendamento) => formatDate(agendamento.data),
                mobileLabel: 'Data'
              },
              {
                key: 'aulas',
                header: 'Horário',
                accessor: (agendamento) => formatAulas(agendamento.aulaInicio as NumeroAula, agendamento.aulaFim as NumeroAula),
                mobileLabel: 'Horário',
                hiddenOnMobile: true
              },
              {
                key: 'status',
                header: 'Status',
                accessor: (agendamento) => (
                        <Badge className={getStatusColor(agendamento.status)} variant="outline">
                          {getStatusLabel(agendamento.status)}
                        </Badge>
                ),
                mobileLabel: 'Status'
              },
              {
                key: 'observacoes',
                header: 'Observações',
                accessor: (agendamento) => (
                        <span className="text-sm text-gray-600 truncate block max-w-[150px]" title={agendamento.observacoes}>
                          {agendamento.observacoes || '-'}
                        </span>
                ),
                mobileLabel: 'Observações',
                hiddenOnMobile: true
              },
              {
                key: 'acoes',
                header: 'Ações',
                accessor: (agendamento) => (
                  <>
                        {agendamento.status === 'pendente' && (
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleStatusChange(agendamento.id, 'aprovado')}
                              className="hover:bg-green-50 hover:border-green-200 text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleStatusChange(agendamento.id, 'rejeitado')}
                              className="hover:bg-red-50 hover:border-red-200 text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        {agendamento.status !== 'pendente' && (
                          <span className="text-sm text-gray-500">
                            {agendamento.status === 'aprovado' ? 'Aprovado' : 'Rejeitado'}
                          </span>
                        )}
                  </>
                ),
                mobileLabel: 'Ações'
              }
            ]}
            emptyState={
              <div className="text-center py-8">
                <div className="text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Nenhum agendamento encontrado</p>
                  <p className="text-sm">Tente ajustar os filtros ou criar um novo agendamento</p>
                </div>
          </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TodosAgendamentos;
