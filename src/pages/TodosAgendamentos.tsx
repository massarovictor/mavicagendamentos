import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useFilters } from '@/hooks/useFilters';
import { usePagination } from '@/hooks/usePagination';
import { useNotifications } from '@/hooks/useNotifications';
import { Agendamento } from '@/types';
import { Calendar, Check, User, Clock, CheckCircle, XCircle, Search, ClipboardList, List, BarChart } from 'lucide-react';
import { formatAulas, formatDate } from '@/utils/format';
import { NumeroAula } from '@/types';

// Opções de status
const statusOptions = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'aprovado', label: 'Aprovados' },
  { value: 'rejeitado', label: 'Rejeitados' }
];

const getStatusBadge = (status: string) => {
  const baseClass = "text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 w-fit";
  switch (status) {
    case 'aprovado':
      return (
        <span className={`${baseClass} status-success`}>
          <CheckCircle className="w-3.5 h-3.5" />
          Aprovado
        </span>
      );
    case 'rejeitado':
      return (
        <span className={`${baseClass} status-error`}>
          <XCircle className="w-3.5 h-3.5" />
          Rejeitado
        </span>
      );
    case 'pendente':
      return (
        <span className={`${baseClass} status-warning`}>
          <Clock className="w-3.5 h-3.5" />
          Pendente
        </span>
      );
    default:
      return <span className={`${baseClass} status-info`}>{status}</span>;
  }
};

const TodosAgendamentos = () => {
  const { agendamentos, espacos, usuarios, loading, error, actions } = useSupabaseData();
  const notifications = useNotifications();
  const filters = useFilters();

  const filteredAgendamentos = useMemo(() => {
    let filtered = agendamentos;

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

    if (filters.filters.statusFilter && filters.filters.statusFilter !== 'todos') {
      filtered = filtered.filter(a => a.status === filters.filters.statusFilter);
    }

    return filtered.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }, [agendamentos, espacos, usuarios, filters.filters]);

  const pagination = usePagination(filteredAgendamentos, { initialPageSize: 10 });

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const agendamentosHoje = agendamentos.filter(a => a.data === today).length;
    const pendentes = agendamentos.filter(a => a.status === 'pendente').length;
    const aprovados = agendamentos.filter(a => a.status === 'aprovado').length;
    return { agendamentosHoje, pendentes, aprovados, total: agendamentos.length };
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

  if (loading) {
    return <LoadingSpinner message="Carregando agendamentos..." />;
  }

  if (error) {
    return <ErrorState title="Erro ao carregar dados" message={error} showRetry onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="section-title">Todos os Agendamentos</h1>
          <p className="subtle-text">Visualize e gerencie todos os agendamentos do sistema.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="enhanced-card">
          <CardContent className="refined-spacing">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <ClipboardList className="w-6 h-6 icon-accent" />
              </div>
              <div className="metric-display">{stats.total}</div>
            </div>
            <div className="space-y-1">
              <div className="card-title">Total</div>
              <div className="caption-text">Agendamentos</div>
            </div>
          </CardContent>
        </Card>
        <Card className="enhanced-card">
          <CardContent className="refined-spacing">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-chart-3/10 rounded-lg">
                <Calendar className="w-6 h-6 text-chart-3" />
              </div>
              <div className="metric-display">{stats.agendamentosHoje}</div>
            </div>
            <div className="space-y-1">
              <div className="card-title">Hoje</div>
              <div className="caption-text">Agendamentos para hoje</div>
            </div>
          </CardContent>
        </Card>
        <Card className="enhanced-card">
          <CardContent className="refined-spacing">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-status-success/10 rounded-lg">
                <CheckCircle className="w-6 h-6 text-status-success" />
              </div>
              <div className="metric-display">{stats.aprovados}</div>
            </div>
            <div className="space-y-1">
              <div className="card-title">Aprovados</div>
              <div className="caption-text">Agendamentos confirmados</div>
            </div>
          </CardContent>
        </Card>
        <Card className="enhanced-card border-status-warning-border/50">
          <CardContent className="refined-spacing">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-status-warning/10 rounded-lg">
                <Clock className="w-6 h-6 text-status-warning" />
              </div>
              <div className="metric-display text-status-warning">{stats.pendentes}</div>
            </div>
            <div className="space-y-1">
              <div className="card-title">Pendentes</div>
              <div className="caption-text">Requerem ação</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle>Filtrar Agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Buscar por espaço, usuário ou observações..."
                  value={filters.filters.searchTerm || ''}
                  onChange={(e) => filters.updateFilter('searchTerm', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-56">
              <Label htmlFor="status" className="sr-only">Filtrar por status</Label>
              <Select 
                value={filters.filters.statusFilter || 'todos'} 
                onValueChange={(value) => filters.updateFilter('statusFilter', value)}
              >
                <SelectTrigger>
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
            <Button 
              variant="outline" 
              onClick={filters.clearFilters}
              className="w-full sm:w-auto"
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="dashboard-grid">
        <div className="dashboard-main">
          <Card className="enhanced-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="w-5 h-5 text-muted-foreground" />
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
                    accessor: (agendamento) => getStatusBadge(agendamento.status),
                    mobileLabel: 'Status'
                  },
                  {
                    key: 'observacoes',
                    header: 'Observações',
                    accessor: (agendamento) => (
                      <span className="text-sm text-muted-foreground truncate block max-w-[150px]" title={agendamento.observacoes}>
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
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleStatusChange(agendamento.id, 'aprovado')}
                              className="text-status-success-foreground hover:bg-status-success-subtle"
                              title="Aprovar"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleStatusChange(agendamento.id, 'rejeitado')}
                              className="text-status-error-foreground hover:bg-status-error-subtle"
                              title="Rejeitar"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </>
                    ),
                    mobileLabel: 'Ações'
                  }
                ]}
                emptyState={
                  <div className="text-center py-8">
                    <div className="text-muted-foreground">
                      <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">Nenhum agendamento encontrado</p>
                      <p className="text-sm">Tente ajustar os filtros ou criar um novo agendamento</p>
                    </div>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </div>
        <div className="dashboard-side">
          <Card className="enhanced-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="w-5 h-5 icon-muted" />
                Resumo de Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-status-success" />
                  <span className="text-sm text-muted-foreground">Aprovados</span>
                </div>
                <span className="font-semibold">{agendamentos.filter(a => a.status === 'aprovado').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-status-warning" />
                  <span className="text-sm text-muted-foreground">Pendentes</span>
                </div>
                <span className="font-semibold">{stats.pendentes}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-status-error" />
                  <span className="text-sm text-muted-foreground">Rejeitados</span>
                </div>
                <span className="font-semibold">{agendamentos.filter(a => a.status === 'rejeitado').length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TodosAgendamentos;
