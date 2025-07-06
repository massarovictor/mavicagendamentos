import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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

      <div className="space-y-6">
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
                },
                {
                    key: 'status',
                    header: 'Status',
                    accessor: (agendamento) => getStatusBadge(agendamento.status),
                    mobileLabel: 'Status'
                },
                ]}
            />
          </CardContent>
           <CardFooter className="flex justify-end">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={pagination.previousPage} disabled={!pagination.canGoPrevious}>Anterior</Button>
                <span className="text-sm">{pagination.currentPage} / {pagination.totalPages}</span>
                <Button variant="outline" size="sm" onClick={pagination.nextPage} disabled={!pagination.canGoNext}>Próximo</Button>
            </div>
          </CardFooter>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="enhanced-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                Próximos Agendamentos
              </CardTitle>
              <CardDescription>Seus agendamentos aprovados mais próximos</CardDescription>
            </CardHeader>
            <CardContent>
              {proximosAgendamentos.length > 0 ? (
                <ul className="space-y-4">
                  {proximosAgendamentos.map(agendamento => (
                    <li key={agendamento.id} className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="p-2 bg-primary/10 rounded-md">
                          <Calendar className="w-5 h-5 icon-accent" />
                      </div>
                      <div>
                        <p className="font-semibold">{getEspacoNome(agendamento.espacoId)}</p>
                        <p className="text-sm text-muted-foreground">{formatDateTime(agendamento.data, agendamento.aulaInicio as NumeroAula)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="font-semibold">Nenhum agendamento próximo</p>
                    <p className="text-sm text-muted-foreground">Agendamentos aprovados aparecerão aqui</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="enhanced-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                Pendentes de Aprovação
              </CardTitle>
              <CardDescription>Agendamentos aguardando sua aprovação</CardDescription>
            </CardHeader>
            <CardContent>
              {agendamentosPendentes.length > 0 ? (
                <ul className="space-y-4">
                  {agendamentosPendentes.slice(0, 3).map(agendamento => (
                    <li key={agendamento.id} className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="p-2 bg-status-warning/10 rounded-md">
                          <Clock className="w-5 h-5 text-status-warning" />
                      </div>
                      <div>
                        <p className="font-semibold">{getEspacoNome(agendamento.espacoId)}</p>
                        <p className="text-sm text-muted-foreground">{formatDateTime(agendamento.data, agendamento.aulaInicio as NumeroAula)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="font-semibold">Nenhum agendamento pendente</p>
                    <p className="text-sm text-muted-foreground">Seus agendamentos pendentes aparecerão aqui</p>
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
