import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { useFilters } from '@/hooks/useFilters';
import { usePagination } from '@/hooks/usePagination';
import { Calendar, Clock, Search, BookOpen, CheckCircle, XCircle, ListChecks } from 'lucide-react';
import { formatAulas, formatDate, formatDateTime } from '@/utils/format';
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

const MeusAgendamentos = () => {
  const { agendamentos, espacos, loading } = useSupabaseData();
  const { usuario } = useAuth();
  const filters = useFilters();

  const meusAgendamentos = React.useMemo(() => 
    agendamentos.filter(a => a.usuarioId === usuario?.id), 
    [agendamentos, usuario]
  );
  
  const filteredAgendamentos = React.useMemo(() => {
    let filtered = meusAgendamentos;

    if (filters.filters.searchTerm) {
      const searchLower = filters.filters.searchTerm.toLowerCase();
      filtered = filtered.filter(a => {
        const espacoNome = espacos.find(e => e.id === a.espacoId)?.nome || '';
        return (
          espacoNome.toLowerCase().includes(searchLower) ||
          a.observacoes?.toLowerCase().includes(searchLower)
        );
      });
    }

    if (filters.filters.statusFilter && filters.filters.statusFilter !== 'todos') {
      filtered = filtered.filter(a => a.status === filters.filters.statusFilter);
    }

    return filtered;
  }, [meusAgendamentos, espacos, filters.filters]);

  const pagination = usePagination(filteredAgendamentos, { initialPageSize: 10 });
  
  const getEspacoNome = (espacoId: number) => {
    return espacos.find(e => e.id === espacoId)?.nome || 'Espaço não encontrado';
  };

  const agendamentosPendentes = meusAgendamentos.filter(a => a.status === 'pendente');
  const agendamentosAprovados = meusAgendamentos.filter(a => a.status === 'aprovado');
  const agendamentosRejeitados = meusAgendamentos.filter(a => a.status === 'rejeitado');
  const proximosAgendamentos = agendamentosAprovados.filter(a => 
    new Date(a.data) >= new Date(new Date().toISOString().split('T')[0])
  ).slice(0, 3);

  if (loading) {
    return <LoadingSpinner message="Carregando agendamentos..." />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="section-title">Meus Agendamentos</h1>
          <p className="subtle-text">Visualize e acompanhe seus agendamentos.</p>
        </div>
      </div>
      
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle>Filtrar Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Buscar por espaço ou observação..."
                  value={filters.filters.searchTerm || ''}
                  onChange={(e) => filters.updateFilter('searchTerm', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="enhanced-card">
          <CardContent className="refined-spacing">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <ListChecks className="w-6 h-6 icon-accent" />
              </div>
              <div className="metric-display">{meusAgendamentos.length}</div>
            </div>
            <div className="space-y-1">
              <div className="card-title">Total</div>
              <div className="caption-text">Meus Agendamentos</div>
            </div>
          </CardContent>
        </Card>
        <Card className="enhanced-card">
          <CardContent className="refined-spacing">
             <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-status-success/10 rounded-lg">
                <CheckCircle className="w-6 h-6 text-status-success" />
              </div>
              <div className="metric-display">{agendamentosAprovados.length}</div>
            </div>
            <div className="space-y-1">
              <div className="card-title">Aprovados</div>
              <div className="caption-text">Agendamentos confirmados</div>
            </div>
          </CardContent>
        </Card>
        <Card className="enhanced-card border-status-error-border/50">
          <CardContent className="refined-spacing">
             <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-status-error/10 rounded-lg">
                    <XCircle className="w-6 h-6 text-status-error" />
                </div>
                <div className="metric-display text-status-error">{agendamentosRejeitados.length}</div>
            </div>
            <div className="space-y-1">
              <div className="card-title">Rejeitados</div>
              <div className="caption-text">Agendamentos negados</div>
            </div>
          </CardContent>
        </Card>
        <Card className="enhanced-card border-status-warning-border/50">
          <CardContent className="refined-spacing">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-status-warning/10 rounded-lg">
                <Clock className="w-6 h-6 text-status-warning" />
              </div>
              <div className="metric-display text-status-warning">{agendamentosPendentes.length}</div>
            </div>
            <div className="space-y-1">
              <div className="card-title">Pendentes</div>
              <div className="caption-text">Aguardando aprovação</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                    Histórico Completo
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
                        key: 'data',
                        header: 'Data',
                        accessor: (agendamento) => formatDate(agendamento.data),
                        mobileLabel: 'Data'
                    },
                    {
                        key: 'horario',
                        header: 'Horário',
                        accessor: (agendamento) => formatAulas(agendamento.aulaInicio as NumeroAula, agendamento.aulaFim as NumeroAula),
                        mobileLabel: 'Horário',
                        hiddenOnMobile: false
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
                        <span className="text-sm text-muted-foreground truncate block max-w-[200px]">
                            {agendamento.observacoes || '-'}
                        </span>
                        ),
                        mobileLabel: 'Observações',
                        hiddenOnMobile: true
                    }
                    ]}
                    emptyState={
                    <div className="text-center py-8">
                        <div className="text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">Nenhum agendamento encontrado</p>
                        <p className="text-sm">Tente ajustar os filtros ou criar um novo agendamento</p>
                        </div>
                    </div>
                    }
                />
              </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-status-success" />
                  Próximos Agendamentos
                </CardTitle>
                <CardDescription>Seus agendamentos aprovados mais próximos</CardDescription>
              </CardHeader>
              <CardContent>
                {proximosAgendamentos.length > 0 ? (
                  <div className="space-y-3">
                    {proximosAgendamentos.map((agendamento) => (
                      <div key={agendamento.id} className="p-3 bg-status-success-subtle border border-status-success-border rounded-lg hover:shadow-sm transition-shadow">
                        <div className="font-semibold text-status-success-foreground">
                          {getEspacoNome(agendamento.espacoId)}
                        </div>
                        <div className="text-sm text-status-success-foreground/80">
                          {formatDateTime(agendamento.data, agendamento.aulaInicio as NumeroAula)} ({formatAulas(agendamento.aulaInicio as NumeroAula, agendamento.aulaFim as NumeroAula)})
                        </div>
                        {agendamento.observacoes && (
                          <div className="text-xs text-status-success-foreground/80 mt-1 truncate">
                            {agendamento.observacoes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">Nenhum agendamento próximo</p>
                      <p className="text-sm">Agendamentos aprovados aparecerão aqui</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-status-warning" />
                  Pendentes de Aprovação
                </CardTitle>
                <CardDescription>Agendamentos aguardando sua aprovação</CardDescription>
              </CardHeader>
              <CardContent>
                {agendamentosPendentes.length > 0 ? (
                  <div className="space-y-3">
                    {agendamentosPendentes.slice(0, 3).map((agendamento) => (
                      <div key={agendamento.id} className="p-3 bg-status-warning-subtle border border-status-warning-border rounded-lg hover:shadow-sm transition-shadow">
                        <div className="font-semibold text-status-warning-foreground">
                          {getEspacoNome(agendamento.espacoId)}
                        </div>
                        <div className="text-sm text-status-warning-foreground/80">
                          {formatDateTime(agendamento.data, agendamento.aulaInicio as NumeroAula)} ({formatAulas(agendamento.aulaInicio as NumeroAula, agendamento.aulaFim as NumeroAula)})
                        </div>
                        {agendamento.observacoes && (
                          <div className="text-xs text-status-warning-foreground/80 mt-1 truncate">
                            {agendamento.observacoes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">Nenhum agendamento pendente</p>
                      <p className="text-sm">Seus agendamentos pendentes aparecerão aqui</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default MeusAgendamentos;
