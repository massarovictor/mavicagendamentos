import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { FilterBar } from '@/components/shared/FilterBar';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { useFilters } from '@/hooks/useFilters';
import { usePagination } from '@/hooks/usePagination';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Search, BookOpen, CheckCircle, AlertCircle, X } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatAulas, formatDate, formatDateTime } from '@/utils/format';
import { NumeroAula } from '@/types';

// Opções de status
const statusOptions = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'aprovado', label: 'Aprovados' },
  { value: 'rejeitado', label: 'Rejeitados' }
];

const MeusAgendamentos = () => {
  const { agendamentos, espacos, loading } = useSupabaseData();
  const { usuario } = useAuth();
  const filters = useFilters();

  const meusAgendamentos = agendamentos.filter(a => a.usuarioId === usuario?.id);
  
  // Aplicar filtros
  const filteredAgendamentos = React.useMemo(() => {
    let filtered = meusAgendamentos;

    // Filtro de texto
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

    // Filtro de status
    if (filters.filters.statusFilter && filters.filters.statusFilter !== 'todos') {
      filtered = filtered.filter(a => a.status === filters.filters.statusFilter);
    }

    return filtered;
  }, [meusAgendamentos, espacos, filters.filters]);

  const pagination = usePagination(filteredAgendamentos, { initialPageSize: 10 });
  
  const getEspacoNome = (espacoId: number) => {
    return espacos.find(e => e.id === espacoId)?.nome || 'Espaço não encontrado';
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

  // Separar agendamentos por status
  const agendamentosPendentes = meusAgendamentos.filter(a => a.status === 'pendente');
  const agendamentosAprovados = meusAgendamentos.filter(a => a.status === 'aprovado');
  const proximosAgendamentos = agendamentosAprovados.filter(a => 
    new Date(a.data) >= new Date(new Date().toISOString().split('T')[0])
  ).slice(0, 3);

    if (loading) {
    return <LoadingSpinner message="Carregando agendamentos..." />;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <PageHeader 
        title="Meus Agendamentos"
        subtitle="Visualize e acompanhe seus agendamentos"
        icon={BookOpen}
        stats={[
          {
            label: "Total",
            value: meusAgendamentos.length,
          },
          {
            label: "Pendentes", 
            value: agendamentosPendentes.length,
            icon: Clock,
            color: "bg-chart-3"
          },
          {
            label: "Aprovados",
            value: agendamentosAprovados.length, 
            icon: CheckCircle,
            color: "bg-chart-4"
          },
          {
            label: "Rejeitados",
            value: meusAgendamentos.filter(a => a.status === 'rejeitado').length,
            icon: X,
            color: "bg-chart-5"
          }
        ]}
      />

      {/* Seção eliminada - estatísticas agora estão no PageHeader */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos agendamentos */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              Próximos Agendamentos
            </CardTitle>
            <CardDescription>Seus agendamentos aprovados mais próximos</CardDescription>
          </CardHeader>
          <CardContent>
            {proximosAgendamentos.length > 0 ? (
              <div className="space-y-3">
                {proximosAgendamentos.map((agendamento) => (
                  <div key={agendamento.id} className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                    <div className="font-medium text-green-800">
                      {getEspacoNome(agendamento.espacoId)}
                    </div>
                    <div className="text-sm text-green-600">
                      {formatDateTime(agendamento.data, agendamento.aulaInicio as NumeroAula)} ({formatAulas(agendamento.aulaInicio as NumeroAula, agendamento.aulaFim as NumeroAula)})
                    </div>
                    {agendamento.observacoes && (
                      <div className="text-sm text-green-600 mt-1 truncate">
                        {agendamento.observacoes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Nenhum agendamento próximo</p>
                  <p className="text-sm">Agendamentos aprovados aparecerão aqui</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agendamentos pendentes */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              Pendentes de Aprovação
            </CardTitle>
            <CardDescription>Agendamentos aguardando aprovação</CardDescription>
          </CardHeader>
          <CardContent>
            {agendamentosPendentes.length > 0 ? (
              <div className="space-y-3">
                {agendamentosPendentes.slice(0, 3).map((agendamento) => (
                  <div key={agendamento.id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors">
                    <div className="font-medium text-yellow-800">
                      {getEspacoNome(agendamento.espacoId)}
                    </div>
                    <div className="text-sm text-yellow-600">
                      {formatDateTime(agendamento.data, agendamento.aulaInicio as NumeroAula)} ({formatAulas(agendamento.aulaInicio as NumeroAula, agendamento.aulaFim as NumeroAula)})
                    </div>
                    {agendamento.observacoes && (
                      <div className="text-sm text-yellow-600 mt-1 truncate">
                        {agendamento.observacoes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Nenhum agendamento pendente</p>
                  <p className="text-sm">Agendamentos pendentes aparecerão aqui</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
                  placeholder="Buscar em meus agendamentos..."
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

      {/* Tabela responsiva com todos os agendamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-orange-600" />
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
                  <span className="text-sm text-gray-600 truncate block max-w-[200px]">
                    {agendamento.observacoes || '-'}
                  </span>
                ),
                mobileLabel: 'Observações',
                hiddenOnMobile: true
              }
            ]}
            emptyState={
              <div className="text-center py-8">
                <div className="text-foreground/50">
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
  );
};

export default MeusAgendamentos;
