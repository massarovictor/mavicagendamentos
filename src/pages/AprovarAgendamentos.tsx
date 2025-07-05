import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Check, X, Clock, User, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import { formatAulas } from '@/utils/format';
import { NumeroAula } from '@/types';
import { PageHeader } from '@/components/ui/page-header';
import { BusinessValidations } from '@/utils/validations';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const AprovarAgendamentos = () => {
  const { agendamentos, espacos, usuarios, agendamentosFixos, loading, actions } = useSupabaseData();
  const { usuario } = useAuth();
  const notifications = useNotifications();
  const [filtroStatus, setFiltroStatus] = useState<string>('pendente');
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<number | null>(null);

  const meusEspacos = usuario?.tipo === 'admin'
    ? espacos
    : espacos.filter(e => usuario?.espacos?.includes(e.id));

  const agendamentosMeusEspacos = usuario?.tipo === 'admin'
    ? agendamentos
    : agendamentos.filter(a => meusEspacos.some(e => e.id === a.espacoId));

  // Detectar conflitos entre agendamentos pendentes
  const detectConflicts = () => {
    const conflicts: { [key: string]: number[] } = {};
    
    agendamentosMeusEspacos
      .filter(a => a.status === 'pendente')
      .forEach(agendamento => {
        const conflictData = BusinessValidations.getAgendamentoConflicts(
          agendamento,
          agendamentos,
          agendamentosFixos,
          agendamento.id
        );

        // Apenas conflitos com outros pendentes (aprovados já bloqueiam novos)
        const pendentesConflitantes = conflictData.agendamentosConflitantes
          .filter(a => a.status === 'pendente');

        if (pendentesConflitantes.length > 0) {
          const key = `${agendamento.espacoId}-${agendamento.data}-${agendamento.aulaInicio}-${agendamento.aulaFim}`;
          if (!conflicts[key]) conflicts[key] = [];
          conflicts[key].push(agendamento.id);
          pendentesConflitantes.forEach(a => {
            if (!conflicts[key].includes(a.id)) {
              conflicts[key].push(a.id);
            }
          });
        }
      });

    return conflicts;
  };

  const conflictGroups = detectConflicts();

  const handleStatusChange = (agendamentoId: number, novoStatus: 'aprovado' | 'rejeitado') => {
    const agendamento = agendamentos.find(a => a.id === agendamentoId);
    if (!agendamento) return;

    // Se aprovando, verificar conflitos primeiro
    if (novoStatus === 'aprovado') {
      const conflicts = BusinessValidations.getAgendamentoConflicts(
        agendamento,
        agendamentos,
        agendamentosFixos,
        agendamento.id
      );

      // Verificar se há agendamentos fixos conflitantes
      if (conflicts.agendamentosFixosConflitantes.length > 0) {
        notifications.error(
          'Não é possível aprovar',
          'Este horário está bloqueado por um agendamento fixo.'
        );
        return;
      }

      // Verificar se há outros aprovados conflitantes
      const aprovadosConflitantes = conflicts.agendamentosConflitantes
        .filter(a => a.status === 'aprovado');
      
      if (aprovadosConflitantes.length > 0) {
        notifications.error(
          'Não é possível aprovar',
          'Este horário já está aprovado para outro usuário.'
        );
        return;
      }

      // Se há pendentes conflitantes, rejeitar automaticamente
      const pendentesConflitantes = conflicts.agendamentosConflitantes
        .filter(a => a.status === 'pendente');
      
      if (pendentesConflitantes.length > 0) {
        // Rejeitar os conflitantes
        pendentesConflitantes.forEach(a => {
          actions.updateAgendamentoStatus(a.id, 'rejeitado');
        });
        notifications.info(
          'Conflitos resolvidos',
          `${pendentesConflitantes.length} agendamento(s) conflitante(s) foram automaticamente rejeitados.`
        );
      }
    }

    actions.updateAgendamentoStatus(agendamentoId, novoStatus);
    notifications.agendamento[novoStatus === 'aprovado' ? 'approved' : 'rejected']();
  };

  const handleConflictResolution = (agendamentoId: number) => {
    setSelectedConflict(agendamentoId);
    setConflictDialogOpen(true);
  };

  const resolveConflict = (approvedId: number, rejectedIds: number[]) => {
    // Aprovar o selecionado
    actions.updateAgendamentoStatus(approvedId, 'aprovado');
    
    // Rejeitar os outros
    rejectedIds.forEach(id => {
      actions.updateAgendamentoStatus(id, 'rejeitado');
    });

    notifications.success(
      'Conflito resolvido',
      `1 agendamento aprovado e ${rejectedIds.length} rejeitado(s).`
    );

    setConflictDialogOpen(false);
    setSelectedConflict(null);
  };

  const getConflictForAgendamento = (agendamentoId: number) => {
    for (const [key, ids] of Object.entries(conflictGroups)) {
      if (ids.includes(agendamentoId)) {
        return ids.filter(id => id !== agendamentoId);
      }
    }
    return [];
  };

  const hasConflict = (agendamentoId: number) => {
    return getConflictForAgendamento(agendamentoId).length > 0;
  };

  if (loading) {
    return <LoadingSpinner message="Carregando agendamentos..." />;
  }

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

  const agendamentosFiltrados = filtroStatus === 'todos' 
    ? agendamentosMeusEspacos 
    : agendamentosMeusEspacos.filter(a => a.status === filtroStatus);

  const counts = {
    total: agendamentosMeusEspacos.length,
    pendentes: agendamentosMeusEspacos.filter(a => a.status === 'pendente').length,
    aprovados: agendamentosMeusEspacos.filter(a => a.status === 'aprovado').length,
    rejeitados: agendamentosMeusEspacos.filter(a => a.status === 'rejeitado').length,
    conflitos: Object.keys(conflictGroups).length
  };

  const pageStats = [
    {
      label: 'Total',
      value: counts.total,
      icon: Calendar,
      color: 'bg-blue-500'
    },
    {
      label: 'Pendentes',
      value: counts.pendentes,
      icon: Clock,
      color: 'bg-yellow-500'
    },
    {
      label: 'Conflitos',
      value: counts.conflitos,
      icon: AlertTriangle,
      color: 'bg-red-500'
    },
    {
      label: 'Aprovados',
      value: counts.aprovados,
      icon: Check,
      color: 'bg-green-500'
    }
  ];

  const selectedConflictAgendamento = selectedConflict 
    ? agendamentos.find(a => a.id === selectedConflict)
    : null;

  const conflictingAgendamentos = selectedConflictAgendamento 
    ? getConflictForAgendamento(selectedConflict).map(id => 
        agendamentos.find(a => a.id === id)!
      ).filter(Boolean)
    : [];

  const allConflictAgendamentos = selectedConflictAgendamento 
    ? [selectedConflictAgendamento, ...conflictingAgendamentos]
    : [];

  return (
    <div className="space-y-6 p-6">
      {/* PageHeader */}
      <PageHeader 
        title="Aprovar Agendamentos"
        subtitle="Gerencie os agendamentos dos seus espaços"
        icon={CheckCircle}
        stats={pageStats}
      />

      {/* Alerta de conflitos */}
      {counts.conflitos > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">
                  {counts.conflitos} conflito(s) de horário detectado(s)
                </p>
                <p className="text-sm text-amber-700">
                  Múltiplos agendamentos solicitaram o mesmo horário. Você precisa escolher qual aprovar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Filtrar por status</h3>
              <p className="text-sm text-gray-600">Visualize agendamentos por status</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={filtroStatus === 'todos' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFiltroStatus('todos')}
                className="hover:shadow-lg transition-shadow"
              >
                Todos ({counts.total})
              </Button>
              <Button 
                variant={filtroStatus === 'pendente' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFiltroStatus('pendente')}
                className="hover:shadow-lg transition-shadow"
              >
                Pendentes ({counts.pendentes})
              </Button>
              <Button 
                variant={filtroStatus === 'aprovado' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFiltroStatus('aprovado')}
                className="hover:shadow-lg transition-shadow"
              >
                Aprovados ({counts.aprovados})
              </Button>
              <Button 
                variant={filtroStatus === 'rejeitado' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFiltroStatus('rejeitado')}
                className="hover:shadow-lg transition-shadow"
              >
                Rejeitados ({counts.rejeitados})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-yellow-600" />
            Lista de Agendamentos
          </CardTitle>
          <CardDescription>
            Agendamentos dos espaços sob sua responsabilidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTable
            data={agendamentosFiltrados}
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
                accessor: (agendamento) => new Date(agendamento.data).toLocaleDateString('pt-BR'),
                mobileLabel: 'Data'
              },
              {
                key: 'horario',
                header: 'Horário',
                accessor: (agendamento) => (
                  <div className="flex items-center gap-2">
                    <span>{formatAulas(agendamento.aulaInicio as NumeroAula, agendamento.aulaFim as NumeroAula)}</span>
                                         {hasConflict(agendamento.id) && (
                       <AlertTriangle className="h-4 w-4 text-amber-500" />
                     )}
                  </div>
                ),
                mobileLabel: 'Horário',
                hiddenOnMobile: true
              },
              {
                key: 'status',
                header: 'Status',
                accessor: (agendamento) => (
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(agendamento.status)} variant="outline">
                      {getStatusLabel(agendamento.status)}
                    </Badge>
                    {hasConflict(agendamento.id) && (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                        Conflito
                      </Badge>
                    )}
                  </div>
                ),
                mobileLabel: 'Status'
              },
              {
                key: 'observacoes',
                header: 'Observações',
                accessor: (agendamento) => (
                  <span className="text-sm text-foreground truncate block max-w-[150px]">
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
                        {hasConflict(agendamento.id) ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleConflictResolution(agendamento.id)}
                            className="hover:bg-amber-50 hover:border-amber-200 text-amber-600 hover:text-amber-700"
                          >
                            <Users className="h-4 w-4 mr-1" />
                            Resolver
                          </Button>
                        ) : (
                          <>
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
                          </>
                        )}
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
                  <p className="text-sm">Não há agendamentos para o filtro selecionado</p>
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* Dialog de resolução de conflitos */}
      <Dialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Resolver Conflito de Horário
            </DialogTitle>
          </DialogHeader>
          
          {selectedConflictAgendamento && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Conflito detectado:</strong> Múltiplos agendamentos para o mesmo horário.
                  Escolha qual agendamento será aprovado. Os demais serão automaticamente rejeitados.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Agendamentos em conflito:</h4>
                {allConflictAgendamentos.map((agendamento, index) => (
                  <div key={agendamento.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900">
                          {getUsuarioNome(agendamento.usuarioId)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {getEspacoNome(agendamento.espacoId)} • {formatAulas(agendamento.aulaInicio as NumeroAula, agendamento.aulaFim as NumeroAula)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(agendamento.data).toLocaleDateString('pt-BR')}
                        </p>
                        {agendamento.observacoes && (
                          <p className="text-sm text-gray-500">
                            <strong>Obs:</strong> {agendamento.observacoes}
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => {
                          const rejectedIds = allConflictAgendamentos
                            .filter(a => a.id !== agendamento.id)
                            .map(a => a.id);
                          resolveConflict(agendamento.id, rejectedIds);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Aprovar Este
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setConflictDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    allConflictAgendamentos.forEach(a => {
                      actions.updateAgendamentoStatus(a.id, 'rejeitado');
                    });
                    notifications.info('Todos rejeitados', 'Todos os agendamentos em conflito foram rejeitados.');
                    setConflictDialogOpen(false);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Rejeitar Todos
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AprovarAgendamentos;
