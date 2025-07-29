import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Check, X, Clock, User, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import { formatAulas, formatDate } from '@/utils/format';
import { Agendamento, NumeroAula } from '@/types';
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

    if (novoStatus === 'aprovado') {
      const conflicts = BusinessValidations.getAgendamentoConflicts(
        agendamento,
        agendamentos,
        agendamentosFixos,
        agendamento.id
      );

      if (conflicts.agendamentosFixosConflitantes.length > 0) {
        notifications.error('Não é possível aprovar', 'Este horário está bloqueado por um agendamento fixo.');
        return;
      }

      const aprovadosConflitantes = conflicts.agendamentosConflitantes.filter(a => a.status === 'aprovado');
      if (aprovadosConflitantes.length > 0) {
        notifications.error('Não é possível aprovar', 'Este horário já está aprovado para outro usuário.');
        return;
      }

      const pendentesConflitantes = conflicts.agendamentosConflitantes.filter(a => a.status === 'pendente');
      if (pendentesConflitantes.length > 0) {
        pendentesConflitantes.forEach(a => actions.updateAgendamentoStatus(a.id, 'rejeitado'));
        notifications.info('Conflitos resolvidos', `${pendentesConflitantes.length} agendamento(s) conflitante(s) foram automaticamente rejeitados.`);
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
    actions.updateAgendamentoStatus(approvedId, 'aprovado');
    rejectedIds.forEach(id => actions.updateAgendamentoStatus(id, 'rejeitado'));
    notifications.success('Conflito resolvido', `1 agendamento aprovado e ${rejectedIds.length} rejeitado(s).`);
    setConflictDialogOpen(false);
    setSelectedConflict(null);
  };

  const getConflictForAgendamento = (agendamentoId: number) => {
    for (const ids of Object.values(conflictGroups)) {
      if (ids.includes(agendamentoId)) {
        return ids.filter(id => id !== agendamentoId);
      }
    }
    return [];
  };

  const hasConflict = (agendamentoId: number) => getConflictForAgendamento(agendamentoId).length > 0;

  const getEspacoNome = (espacoId: number) => espacos.find(e => e.id === espacoId)?.nome || 'N/A';
  const getUsuarioNome = (usuarioId: number) => usuarios.find(u => u.id === usuarioId)?.nome || 'N/A';

  const getStatusBadge = (status: string) => {
    const baseClass = "text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5";
    switch (status) {
      case 'aprovado': return <span className={`${baseClass} status-success`}><CheckCircle className="w-3.5 h-3.5" />Aprovado</span>;
      case 'rejeitado': return <span className={`${baseClass} status-error`}><X className="w-3.5 h-3.5" />Rejeitado</span>;
      case 'pendente': return <span className={`${baseClass} status-warning`}><Clock className="w-3.5 h-3.5" />Pendente</span>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const agendamentosFiltrados = filtroStatus === 'todos' 
    ? agendamentosMeusEspacos 
    : agendamentosMeusEspacos.filter(a => a.status === filtroStatus);

  const counts = {
    todos: agendamentosMeusEspacos.length,
    total: agendamentosMeusEspacos.length,
    pendente: agendamentosMeusEspacos.filter(a => a.status === 'pendente').length,
    pendentes: agendamentosMeusEspacos.filter(a => a.status === 'pendente').length,
    aprovado: agendamentosMeusEspacos.filter(a => a.status === 'aprovado').length,
    aprovados: agendamentosMeusEspacos.filter(a => a.status === 'aprovado').length,
    rejeitado: agendamentosMeusEspacos.filter(a => a.status === 'rejeitado').length,
    rejeitados: agendamentosMeusEspacos.filter(a => a.status === 'rejeitado').length,
    conflitos: Object.keys(conflictGroups).length
  };
  
  const columns = [
    { key: 'espaco', header: 'Espaço', accessor: (a: Agendamento) => <span className="font-semibold body-text">{getEspacoNome(a.espacoId)}</span> },
    { key: 'usuario', header: 'Usuário', accessor: (a: Agendamento) => <span className="caption-text">{getUsuarioNome(a.usuarioId)}</span>, hiddenOnMobile: true },
    { key: 'data', header: 'Data', accessor: (a: Agendamento) => <span className="caption-text">{formatDate(a.data)}</span> },
    { key: 'horario', header: 'Horário', accessor: (a: Agendamento) => <span className="body-text">{formatAulas(a.aulaInicio as NumeroAula, a.aulaFim as NumeroAula)}</span>, hiddenOnMobile: true },
    { key: 'status', header: 'Status', accessor: (a: Agendamento) => (
      <div className="flex items-center gap-2">
        {getStatusBadge(a.status)}
        {hasConflict(a.id) && <Badge variant="destructive" className="bg-status-warning text-status-warning-foreground hover:bg-status-warning/90">Conflito</Badge>}
      </div>
    )},
    { key: 'acoes', header: 'Ações', accessor: (a: Agendamento) => (
      <>
        {a.status === 'pendente' && (
          <div className="flex gap-2">
            {hasConflict(a.id) ? (
              <Button variant="outline" size="sm" onClick={() => handleConflictResolution(a.id)} className="border-status-warning text-status-warning hover:bg-status-warning-bg hover:text-status-warning-text">
                <Users className="h-4 w-4 mr-1" />Resolver
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => handleStatusChange(a.id, 'aprovado')} className="border-status-success text-status-success hover:bg-status-success-bg hover:text-status-success-text">
                  <Check className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleStatusChange(a.id, 'rejeitado')} className="border-status-error text-status-error hover:bg-status-error-bg hover:text-status-error-text">
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}
        {a.status !== 'pendente' && <span className="caption-text italic">{a.status === 'aprovado' ? 'Finalizado' : 'Finalizado'}</span>}
      </>
    )}
  ];

  const mobileCardRender = (item: Agendamento) => (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h3 className="card-title">{getEspacoNome(item.espacoId)}</h3>
          <p className="body-text">{formatAulas(item.aulaInicio as NumeroAula, item.aulaFim as NumeroAula)}</p>
          <p className="caption-text">{formatDate(item.data)} por {getUsuarioNome(item.usuarioId)}</p>
        </div>
        {getStatusBadge(item.status)}
      </div>
      {item.observacoes && <p className="body-text bg-muted p-2 rounded-md"><strong>Obs:</strong> {item.observacoes}</p>}
      <div className="pt-2 flex gap-2">
        {item.status === 'pendente' && (
          hasConflict(item.id) ? (
            <Button variant="outline" size="sm" onClick={() => handleConflictResolution(item.id)} className="flex-1 border-status-warning text-status-warning hover:bg-status-warning-bg hover:text-status-warning-text">
              <Users className="h-4 w-4 mr-2" />Resolver Conflito
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => handleStatusChange(item.id, 'aprovado')} className="flex-1 border-status-success text-status-success hover:bg-status-success-bg hover:text-status-success-text">
                <Check className="h-4 w-4 mr-2" />Aprovar
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleStatusChange(item.id, 'rejeitado')} className="flex-1 border-status-error text-status-error hover:bg-status-error-bg hover:text-status-error-text">
                <X className="h-4 w-4 mr-2" />Rejeitar
              </Button>
            </>
          )
        )}
      </div>
    </div>
  );

  if (loading) return <LoadingSpinner message="Carregando agendamentos..." />;

  const selectedConflictAgendamento = selectedConflict 
    ? agendamentos.find(a => a.id === selectedConflict)
    : null;

  const conflictingAgendamentos = selectedConflictAgendamento 
    ? getConflictForAgendamento(selectedConflict!).map(id => 
        agendamentos.find(a => a.id === id)!
      ).filter(Boolean)
    : [];

  const allConflictAgendamentos = selectedConflictAgendamento 
    ? [selectedConflictAgendamento, ...conflictingAgendamentos]
    : [];

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="section-title text-balance">Aprovar Agendamentos</h1>
          <p className="subtle-text">Gerencie os agendamentos pendentes dos seus espaços</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="enhanced-card"><CardContent className="refined-spacing"><div className="flex items-center justify-between mb-4"><div className="p-3 bg-primary/10 rounded-lg"><Calendar className="w-6 h-6 icon-accent"/></div><div className="metric-display">{counts.total}</div></div><div className="card-title">Total</div></CardContent></Card>
        <Card className="enhanced-card"><CardContent className="refined-spacing"><div className="flex items-center justify-between mb-4"><div className="p-3 bg-status-warning/10 rounded-lg"><Clock className="w-6 h-6 text-status-warning"/></div><div className="metric-display text-status-warning">{counts.pendentes}</div></div><div className="card-title">Pendentes</div></CardContent></Card>
        <Card className="enhanced-card"><CardContent className="refined-spacing"><div className="flex items-center justify-between mb-4"><div className="p-3 bg-status-success-bg rounded-lg"><Check className="w-6 h-6 text-status-success"/></div><div className="metric-display text-status-success">{counts.aprovados}</div></div><div className="card-title">Aprovados</div></CardContent></Card>
        <Card className="enhanced-card"><CardContent className="refined-spacing"><div className="flex items-center justify-between mb-4"><div className="p-3 bg-status-error-bg rounded-lg"><X className="w-6 h-6 text-status-error"/></div><div className="metric-display text-status-error">{counts.rejeitados}</div></div><div className="card-title">Rejeitados</div></CardContent></Card>
      </div>

      {counts.conflitos > 0 && (
        <Card className="enhanced-card border-status-warning/50 bg-status-warning-bg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-status-warning/20 rounded-full"><AlertTriangle className="w-5 h-5 text-status-warning" /></div>
              <div className="flex-1"><div className="font-semibold text-status-warning-text text-balance">{counts.conflitos} conflito(s) de horário detectado(s)</div><div className="caption-text mt-1">É preciso escolher qual aprovar para resolver a pendência.</div></div>
              <Button size="sm" variant="outline" onClick={() => document.getElementById('lista-agendamentos')?.scrollIntoView({ behavior: 'smooth' })}>Ver Conflitos</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="enhanced-card">
        <CardContent className="refined-spacing">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1"><h2 className="card-title">Filtrar Agendamentos</h2><p className="caption-text mt-1">Selecione um status para visualizar os agendamentos correspondentes.</p></div>
            <div className="flex flex-wrap gap-2">
              {['todos', 'pendente', 'aprovado', 'rejeitado'].map(status => (
                <Button key={status} variant={filtroStatus === status ? 'default' : 'outline'} size="sm" onClick={() => setFiltroStatus(status)}>
                  {status.charAt(0).toUpperCase() + status.slice(1)} ({counts[status as keyof typeof counts]})
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card id="lista-agendamentos" className="enhanced-card">
        <CardContent className="refined-spacing">
          <div className="flex items-center gap-2 mb-6"><CheckCircle className="w-5 h-5 icon-muted" /><h2 className="card-title">Lista de Agendamentos</h2></div>
          <ResponsiveTable
            data={agendamentosFiltrados}
            columns={columns}
            mobileCardRender={mobileCardRender}
            emptyState={
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 icon-muted mx-auto mb-4" />
                <div className="subtle-text">Nenhum agendamento encontrado</div>
                <p className="caption-text mt-2">Não há agendamentos para o filtro selecionado.</p>
              </div>
            }
          />
        </CardContent>
      </Card>

      <Dialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-status-warning" />Resolver Conflito de Horário</DialogTitle></DialogHeader>
          {selectedConflictAgendamento && (
            <div className="space-y-4">
              <div className="p-4 bg-status-warning-bg border border-status-warning/20 rounded-lg"><p className="body-text text-status-warning-text"><strong>Conflito detectado:</strong> Múltiplos agendamentos para o mesmo horário. Escolha qual aprovar. Os demais serão automaticamente rejeitados.</p></div>
              <div className="space-y-3"><h4 className="card-title">Agendamentos em conflito:</h4>
                {allConflictAgendamentos.map(agendamento => (
                  <div key={agendamento.id} className="border rounded-lg p-4 hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold body-text">{getUsuarioNome(agendamento.usuarioId)}</p>
                        <p className="caption-text">{getEspacoNome(agendamento.espacoId)} • {formatAulas(agendamento.aulaInicio as NumeroAula, agendamento.aulaFim as NumeroAula)}</p>
                        <p className="caption-text">{formatDate(agendamento.data)}</p>
                        {agendamento.observacoes && <p className="caption-text italic"><strong>Obs:</strong> {agendamento.observacoes}</p>}
                      </div>
                      <Button onClick={() => resolveConflict(agendamento.id, allConflictAgendamentos.filter(a => a.id !== agendamento.id).map(a => a.id))} className="bg-status-success hover:bg-status-success/90 text-status-success-foreground"><Check className="h-4 w-4 mr-2" />Aprovar Este</Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setConflictDialogOpen(false)}>Cancelar</Button>
                <Button variant="destructive" onClick={() => { allConflictAgendamentos.forEach(a => actions.updateAgendamentoStatus(a.id, 'rejeitado')); notifications.info('Todos rejeitados', 'Todos os agendamentos em conflito foram rejeitados.'); setConflictDialogOpen(false); }}>
                  <X className="h-4 w-4 mr-2" />Rejeitar Todos
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
