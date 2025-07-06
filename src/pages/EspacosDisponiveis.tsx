import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Settings, Users, Calendar, MapPin, Clock, Search, CheckCircle, Wifi, Tv } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatAulas } from '@/utils/format';
import { NumeroAula } from '@/types';

const EspacosDisponiveis = () => {
  const { espacos, agendamentos, loading } = useSupabaseData();
  const navigate = useNavigate();

  const espacosAtivos = espacos.filter(e => e.ativo);

  const getEspacoStats = (espacoId: number) => {
    const hoje = new Date().toISOString().split('T')[0];
    const agendamentosHoje = agendamentos.filter(a => a.espacoId === espacoId && a.data === hoje && a.status === 'aprovado');
    const proximoAgendamento = agendamentos
      .filter(a => a.espacoId === espacoId && a.status === 'aprovado' && new Date(a.data) >= new Date())
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())[0];
    return { agendamentosHoje: agendamentosHoje.length, proximoAgendamento };
  };

  const stats = {
    total: espacosAtivos.length,
    disponiveisHoje: espacosAtivos.filter(e => getEspacoStats(e.id).agendamentosHoje === 0).length,
    capacidadeTotal: espacosAtivos.reduce((sum, e) => sum + e.capacidade, 0),
  };

  if (loading) return <LoadingSpinner message="Carregando espaços..." />;

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="section-title text-balance flex items-center gap-3"><Search className="w-8 h-8 icon-accent"/>Espaços Disponíveis</h1>
          <p className="subtle-text">Visualize todos os espaços disponíveis e agende o seu.</p>
        </div>
        <Button onClick={() => navigate('/novo-agendamento')}>
          <Calendar className="w-4 h-4 mr-2" />Novo Agendamento
        </Button>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="enhanced-card"><CardContent className="refined-spacing"><div className="flex items-center justify-between mb-4"><div className="p-3 bg-primary/10 rounded-lg"><MapPin className="w-6 h-6 icon-accent"/></div><div className="metric-display">{stats.total}</div></div><div className="card-title">Total de Espaços</div></CardContent></Card>
        <Card className="enhanced-card"><CardContent className="refined-spacing"><div className="flex items-center justify-between mb-4"><div className="p-3 bg-status-success-bg rounded-lg"><CheckCircle className="w-6 h-6 text-status-success"/></div><div className="metric-display text-status-success">{stats.disponiveisHoje}</div></div><div className="card-title">Disponíveis Hoje</div></CardContent></Card>
        <Card className="enhanced-card"><CardContent className="refined-spacing"><div className="flex items-center justify-between mb-4"><div className="p-3 bg-status-info-bg rounded-lg"><Users className="w-6 h-6 text-status-info"/></div><div className="metric-display text-status-info">{stats.capacidadeTotal}</div></div><div className="card-title">Capacidade Total</div></CardContent></Card>
      </div>

      {espacosAtivos.length === 0 ? (
        <Card className="enhanced-card">
          <CardContent className="py-24 text-center">
            <Settings className="w-12 h-12 icon-muted mx-auto mb-4" />
            <div className="subtle-text">Nenhum espaço disponível encontrado</div>
            <p className="caption-text mt-2">Contate o administrador para mais informações.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {espacosAtivos.map((espaco) => {
            const espacoStats = getEspacoStats(espaco.id);
            const disponivelHoje = espacoStats.agendamentosHoje === 0;
            return (
              <Card key={espaco.id} className="enhanced-card flex flex-col">
                <CardContent className="refined-spacing flex flex-col flex-grow">
                  <div className="flex-grow space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="card-title pr-2">{espaco.nome}</h3>
                      <Badge variant={disponivelHoje ? 'success' : 'secondary'}>
                        {disponivelHoje ? "Livre Hoje" : "Ocupado"}
                      </Badge>
                    </div>
                    <p className="caption-text line-clamp-2">{espaco.descricao || "Sem descrição disponível."}</p>
                    
                    <div className="flex items-center gap-2 caption-text font-medium border-t pt-4">
                      <Users className="w-4 h-4 icon-muted" />
                      <span>{espaco.capacidade} pessoas</span>
                    </div>

                    {espaco.equipamentos && espaco.equipamentos.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {espaco.equipamentos.slice(0, 3).map((eq, index) => (
                          <Badge key={index} variant="outline" className="text-xs gap-1.5"><Wifi className="w-3 h-3"/>{eq}</Badge>
                        ))}
                        {espaco.equipamentos.length > 3 && <Badge variant="outline">+{espaco.equipamentos.length - 3}</Badge>}
                      </div>
                    )}
                    
                    <div className="space-y-1.5 caption-text">
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4 icon-muted" /><span>{espacoStats.agendamentosHoje} agendamento(s) hoje</span></div>
                      {espacoStats.proximoAgendamento && (
                        <div className="flex items-center gap-2"><Clock className="w-4 h-4 icon-muted" /><span className="truncate">Próximo: {formatDate(espacoStats.proximoAgendamento.data)} - {formatAulas(espacoStats.proximoAgendamento.aulaInicio as NumeroAula, espacoStats.proximoAgendamento.aulaFim as NumeroAula)}</span></div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Button className="w-full" onClick={() => navigate(`/novo-agendamento?espacoId=${espaco.id}`)}>
                      Agendar neste Espaço
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EspacosDisponiveis;
