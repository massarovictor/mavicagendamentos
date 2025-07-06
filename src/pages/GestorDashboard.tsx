import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Settings, Check, Clock, UserCog, AlertCircle, CheckCircle, X } from 'lucide-react';
import { formatAulas, formatDate } from '@/utils/format';
import { Agendamento, Espaco, NumeroAula } from '@/types';
import { Link } from 'react-router-dom';

const GestorDashboard = () => {
  const { espacos, agendamentos, usuarios, loading } = useSupabaseData();
  const { usuario } = useAuth();

  const meusEspacos = espacos.filter(e => usuario?.espacos?.includes(e.id));
  const agendamentosMeusEspacos = agendamentos.filter(a => meusEspacos.some(e => e.id === a.espacoId));
  const pendentesAprovacao = agendamentosMeusEspacos.filter(a => a.status === 'pendente');
  const proximosAgendamentos = agendamentosMeusEspacos
    .filter(a => new Date(a.data) >= new Date())
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .slice(0, 5);

  const getStatusBadge = (status: string) => {
    const baseClass = "text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5";
    switch (status) {
      case 'aprovado': return <span className={`${baseClass} status-success`}><CheckCircle className="w-3.5 h-3.5" />Aprovado</span>;
      case 'rejeitado': return <span className={`${baseClass} status-error`}><X className="w-3.5 h-3.5" />Rejeitado</span>;
      case 'pendente': return <span className={`${baseClass} status-warning`}><Clock className="w-3.5 h-3.5" />Pendente</span>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };
  
  const getUsuarioNome = (usuarioId: number) => usuarios.find(u => u.id === usuarioId)?.nome || 'N/A';
  
  if (loading) return <LoadingSpinner message="Carregando dados..." />;

  const stats = {
    meusEspacos: meusEspacos.length,
    pendentes: pendentesAprovacao.length,
    proximos: proximosAgendamentos.length,
    totalAgendamentos: agendamentosMeusEspacos.length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="section-title text-balance flex items-center gap-3"><UserCog className="w-8 h-8 icon-accent"/>Dashboard do Gestor</h1>
          <p className="subtle-text">Gerencie seus espaços e agendamentos com uma visão geral.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="enhanced-card"><CardContent className="refined-spacing"><div className="flex items-center justify-between mb-4"><div className="p-3 bg-primary/10 rounded-lg"><Settings className="w-6 h-6 icon-accent"/></div><div className="metric-display">{stats.meusEspacos}</div></div><div className="card-title">Meus Espaços</div></CardContent></Card>
        <Card className="enhanced-card"><CardContent className="refined-spacing"><div className="flex items-center justify-between mb-4"><div className="p-3 bg-status-warning/10 rounded-lg"><Clock className="w-6 h-6 text-status-warning"/></div><div className="metric-display text-status-warning">{stats.pendentes}</div></div><div className="card-title">Pendentes</div></CardContent></Card>
        <Card className="enhanced-card"><CardContent className="refined-spacing"><div className="flex items-center justify-between mb-4"><div className="p-3 bg-status-info-bg rounded-lg"><Calendar className="w-6 h-6 text-status-info"/></div><div className="metric-display text-status-info">{stats.proximos}</div></div><div className="card-title">Próximos</div></CardContent></Card>
        <Card className="enhanced-card"><CardContent className="refined-spacing"><div className="flex items-center justify-between mb-4"><div className="p-3 bg-status-success-bg rounded-lg"><Check className="w-6 h-6 text-status-success"/></div><div className="metric-display text-status-success">{stats.totalAgendamentos}</div></div><div className="card-title">Total Agendado</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <Card className="enhanced-card">
          <CardContent className="refined-spacing">
            <div className="flex items-center gap-2 mb-6"><AlertCircle className="w-5 h-5 icon-muted" /><h2 className="card-title">Agendamentos Pendentes</h2></div>
            <div className="space-y-3">
              {pendentesAprovacao.length === 0 ? (
                <div className="text-center py-8"><AlertCircle className="w-12 h-12 icon-muted mx-auto mb-4" /><div className="subtle-text">Nenhum agendamento pendente</div><p className="caption-text mt-2">Todos os agendamentos foram processados.</p></div>
              ) : (
                pendentesAprovacao.map((agendamento: Agendamento) => (
                  <div key={agendamento.id} className="p-4 rounded-lg bg-muted/50 flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-1"><p className="body-text font-semibold">{espacos.find(e => e.id === agendamento.espacoId)?.nome}</p><p className="caption-text">{getUsuarioNome(agendamento.usuarioId)} • {formatDate(agendamento.data)} • {formatAulas(agendamento.aulaInicio as NumeroAula, agendamento.aulaFim as NumeroAula)}</p></div>
                    {getStatusBadge(agendamento.status)}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="enhanced-card">
          <CardContent className="refined-spacing">
            <div className="flex items-center gap-2 mb-6"><Calendar className="w-5 h-5 icon-muted" /><h2 className="card-title">Próximos Agendamentos</h2></div>
            <div className="space-y-3">
              {proximosAgendamentos.length === 0 ? (
                <div className="text-center py-8"><Calendar className="w-12 h-12 icon-muted mx-auto mb-4" /><div className="subtle-text">Nenhum agendamento próximo</div><p className="caption-text mt-2">Seus espaços estão livres nos próximos dias.</p></div>
              ) : (
                proximosAgendamentos.map((agendamento: Agendamento) => (
                  <div key={agendamento.id} className="p-4 rounded-lg bg-muted/50 flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-1"><p className="body-text font-semibold">{espacos.find(e => e.id === agendamento.espacoId)?.nome}</p><p className="caption-text">{getUsuarioNome(agendamento.usuarioId)} • {formatDate(agendamento.data)} • {formatAulas(agendamento.aulaInicio as NumeroAula, agendamento.aulaFim as NumeroAula)}</p></div>
                    {getStatusBadge(agendamento.status)}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="enhanced-card">
        <CardContent className="refined-spacing">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2"><Settings className="w-5 h-5 icon-muted" /><h2 className="card-title">Meus Espaços Gerenciados</h2></div>
            <Link to="/gerenciar-espacos"><button className="subtle-text text-sm font-semibold hover:text-primary">Ver todos</button></Link>
          </div>
          {meusEspacos.length === 0 ? (
            <div className="text-center py-8"><Settings className="w-12 h-12 icon-muted mx-auto mb-4" /><div className="subtle-text">Nenhum espaço atribuído</div><p className="caption-text mt-2">Contate o administrador para obter acesso.</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {meusEspacos.map((espaco: Espaco) => {
                const agendamentosNoEspaco = agendamentosMeusEspacos.filter(a => a.espacoId === espaco.id);
                const pendentes = agendamentosNoEspaco.filter(a => a.status === 'pendente').length;
                return (
                  <Card key={espaco.id} className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="body-text font-semibold truncate">{espaco.nome}</h3>
                    <p className="caption-text mt-1">Capacidade: {espaco.capacidade} pessoas</p>
                    <div className="flex items-center justify-between mt-3 text-xs">
                      <Badge variant="secondary">{agendamentosNoEspaco.length} agendamentos</Badge>
                      {pendentes > 0 && <Badge variant="outline" className="border-status-warning text-status-warning">{pendentes} pendente{pendentes > 1 ? 's' : ''}</Badge>}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GestorDashboard;
