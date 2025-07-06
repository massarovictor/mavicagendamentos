import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Settings, Check, Clock, User, TrendingUp, CheckCircle, X } from 'lucide-react';
import { formatAulas, formatDate } from '@/utils/format';
import { Agendamento, Espaco, NumeroAula } from '@/types';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const UsuarioDashboard = () => {
  const { espacos, agendamentos, loading } = useSupabaseData();
  const { usuario } = useAuth();

  const meusAgendamentos = agendamentos.filter(a => a.usuarioId === usuario?.id);
  const proximosAgendamentos = meusAgendamentos
    .filter(a => {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      return new Date(a.data) >= hoje;
    })
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  const espacosDisponiveis = espacos.filter(e => e.ativo);
  const meusAgendamentosMes = meusAgendamentos.filter(a => {
    const agendamentoDate = new Date(a.data);
    const now = new Date();
    return agendamentoDate.getMonth() === now.getMonth() && agendamentoDate.getFullYear() === now.getFullYear();
  });

  const getStatusBadge = (status: string) => {
    const baseClass = "text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5";
    switch (status) {
      case 'aprovado': return <span className={`${baseClass} status-success`}><CheckCircle className="w-3.5 h-3.5" />Aprovado</span>;
      case 'rejeitado': return <span className={`${baseClass} status-error`}><X className="w-3.5 h-3.5" />Rejeitado</span>;
      case 'pendente': return <span className={`${baseClass} status-warning`}><Clock className="w-3.5 h-3.5" />Pendente</span>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) return <LoadingSpinner message="Carregando dashboard..." />;

  const stats = {
    proximos: proximosAgendamentos.length,
    disponiveis: espacosDisponiveis.length,
    esteMes: meusAgendamentosMes.length,
    aprovados: meusAgendamentos.filter(a => a.status === 'aprovado').length
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="section-title text-balance flex items-center gap-3">Meu Dashboard</h1>
          <p className="subtle-text">Visualize seus agendamentos e explore os espaços disponíveis.</p>
        </div>
        <Link to="/novo-agendamento">
          <Button>Novo Agendamento</Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="enhanced-card"><CardContent className="refined-spacing"><div className="flex items-center justify-between mb-4"><div className="p-3 bg-primary/10 rounded-lg"><Calendar className="w-6 h-6 icon-accent"/></div><div className="metric-display">{stats.proximos}</div></div><div className="card-title">Próximos</div></CardContent></Card>
        <Card className="enhanced-card"><CardContent className="refined-spacing"><div className="flex items-center justify-between mb-4"><div className="p-3 bg-blue-500/10 rounded-lg"><Settings className="w-6 h-6 text-blue-500"/></div><div className="metric-display text-blue-500">{stats.disponiveis}</div></div><div className="card-title">Disponíveis</div></CardContent></Card>
        <Card className="enhanced-card"><CardContent className="refined-spacing"><div className="flex items-center justify-between mb-4"><div className="p-3 bg-orange-500/10 rounded-lg"><TrendingUp className="w-6 h-6 text-orange-500"/></div><div className="metric-display text-orange-500">{stats.esteMes}</div></div><div className="card-title">Este Mês</div></CardContent></Card>
        <Card className="enhanced-card"><CardContent className="refined-spacing"><div className="flex items-center justify-between mb-4"><div className="p-3 bg-green-500/10 rounded-lg"><Check className="w-6 h-6 text-green-500"/></div><div className="metric-display text-green-500">{stats.aprovados}</div></div><div className="card-title">Aprovados</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <Card className="enhanced-card">
          <CardContent className="refined-spacing">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2"><Calendar className="w-5 h-5 icon-muted" /><h2 className="card-title">Meus Próximos Agendamentos</h2></div>
              <Link to="/meus-agendamentos"><button className="subtle-text text-sm font-semibold hover:text-primary">Ver todos</button></Link>
            </div>
            <div className="space-y-3">
              {proximosAgendamentos.length === 0 ? (
                <div className="text-center py-8"><Calendar className="w-12 h-12 icon-muted mx-auto mb-4" /><div className="subtle-text">Nenhum agendamento próximo</div><p className="caption-text mt-2">Que tal criar um novo agendamento?</p></div>
              ) : (
                proximosAgendamentos.slice(0, 4).map((agendamento: Agendamento) => (
                  <div key={agendamento.id} className="p-4 rounded-lg bg-muted/50 flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-1"><p className="body-text font-semibold">{espacos.find(e => e.id === agendamento.espacoId)?.nome}</p><p className="caption-text">{formatDate(agendamento.data)} • {formatAulas(agendamento.aulaInicio as NumeroAula, agendamento.aulaFim as NumeroAula)}</p></div>
                    {getStatusBadge(agendamento.status)}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="enhanced-card">
          <CardContent className="refined-spacing">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2"><h2 className="card-title">Espaços Disponíveis</h2></div>
              <Link to="/espacos-disponiveis"><button className="subtle-text text-sm font-semibold hover:text-primary">Ver todos</button></Link>
            </div>
            <div className="space-y-3">
              {espacosDisponiveis.length === 0 ? (
                <div className="text-center py-8"><Settings className="w-12 h-12 icon-muted mx-auto mb-4" /><div className="subtle-text">Nenhum espaço disponível</div><p className="caption-text mt-2">Contate o administrador para mais informações.</p></div>
              ) : (
                espacosDisponiveis.slice(0, 4).map((espaco: Espaco) => (
                  <div key={espaco.id} className="p-4 rounded-lg bg-muted/50 flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-1"><p className="body-text font-semibold">{espaco.nome}</p><p className="caption-text">Capacidade: {espaco.capacidade} pessoas</p></div>
                    <Link to="/novo-agendamento"><Button size="sm" variant="outline">Agendar</Button></Link>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UsuarioDashboard;
