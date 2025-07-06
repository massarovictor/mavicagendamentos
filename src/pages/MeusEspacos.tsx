import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Users, Calendar, Clock, Building2, CheckCircle, Cpu } from 'lucide-react';
import { formatDateTime } from '@/utils/format';
import { NumeroAula } from '@/types';

const MeusEspacos = () => {
  const { espacos, agendamentos, loading } = useSupabaseData();
  const { usuario } = useAuth();

  const meusEspacos = useMemo(() => 
    espacos.filter(e => usuario?.espacos?.includes(e.id)),
    [espacos, usuario]
  );

  const getEspacoStats = useMemo(() => {
    const statsMap = new Map();
    meusEspacos.forEach(espaco => {
        const agendamentosEspaco = agendamentos.filter(a => a.espacoId === espaco.id);
        const pendentes = agendamentosEspaco.filter(a => a.status === 'aprovado').length;
        const aprovados = agendamentosEspaco.filter(a => a.status === 'pendente').length;
        const hoje = new Date();
        const treintaDiasAtras = new Date(hoje.getTime() - (30 * 24 * 60 * 60 * 1000));
        const taxaOcupacao = agendamentosEspaco.filter(a => {
            const dataAgendamento = new Date(a.data);
            return dataAgendamento >= treintaDiasAtras && dataAgendamento <= hoje && a.status === 'aprovado';
        }).length;
        statsMap.set(espaco.id, { total: agendamentosEspaco.length, pendentes, aprovados, taxaOcupacao });
    });
    return statsMap;
  }, [agendamentos, meusEspacos]);

  const totalStats = useMemo(() => {
    return meusEspacos.reduce((acc, espaco) => {
      const stats = getEspacoStats.get(espaco.id) || { total: 0, pendentes: 0, aprovados: 0 };
      acc.totalAgendamentos += stats.total;
      acc.totalPendentes += stats.pendentes;
      acc.totalAprovados += stats.aprovados;
      acc.totalCapacidade += espaco.capacidade;
      return acc;
    }, { totalAgendamentos: 0, totalPendentes: 0, totalAprovados: 0, totalCapacidade: 0 });
  }, [meusEspacos, getEspacoStats]);

  const equipamentosComuns = useMemo(() => {
    const allEquipamentos = meusEspacos.flatMap(e => e.equipamentos || []);
    const count = allEquipamentos.reduce((acc, eq) => {
      acc[eq] = (acc[eq] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [meusEspacos]);

  if (loading) {
    return <LoadingSpinner message="Carregando espaços..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="section-title">Meus Espaços</h1>
          <p className="subtle-text">Gerencie os espaços sob sua responsabilidade.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="enhanced-card">
          <CardContent className="refined-spacing">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Building2 className="w-6 h-6 icon-accent" />
              </div>
              <div className="metric-display">{meusEspacos.length}</div>
            </div>
            <div className="space-y-1">
              <div className="card-title">Espaços</div>
              <div className="caption-text">Gerenciados</div>
            </div>
          </CardContent>
        </Card>
        <Card className="enhanced-card">
          <CardContent className="refined-spacing">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-chart-2/10 rounded-lg">
                <Users className="w-6 h-6 text-chart-2" />
              </div>
              <div className="metric-display">{totalStats.totalCapacidade}</div>
            </div>
            <div className="space-y-1">
              <div className="card-title">Capacidade</div>
              <div className="caption-text">Total de usuários</div>
            </div>
          </CardContent>
        </Card>
        <Card className="enhanced-card">
          <CardContent className="refined-spacing">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-chart-3/10 rounded-lg">
                <Calendar className="w-6 h-6 text-chart-3" />
              </div>
              <div className="metric-display">{totalStats.totalAgendamentos}</div>
            </div>
            <div className="space-y-1">
              <div className="card-title">Agendamentos</div>
              <div className="caption-text">Total</div>
            </div>
          </CardContent>
        </Card>
        <Card className="enhanced-card border-status-warning-border/50">
          <CardContent className="refined-spacing">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-status-warning/10 rounded-lg">
                <Clock className="w-6 h-6 text-status-warning" />
              </div>
              <div className="metric-display text-status-warning">{totalStats.totalPendentes}</div>
            </div>
            <div className="space-y-1">
              <div className="card-title">Pendentes</div>
              <div className="caption-text">Requerem ação</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {meusEspacos.length === 0 ? (
              <Card className="enhanced-card md:col-span-2 xl:col-span-3">
              <CardContent className="text-center py-12">
                  <div className="text-muted-foreground">
                  <Settings className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="font-medium text-lg">Nenhum espaço atribuído</p>
                  <p className="text-sm">Contate o administrador para obter acesso a espaços</p>
                  </div>
              </CardContent>
              </Card>
          ) : (
              meusEspacos.map((espaco) => {
              const stats = getEspacoStats.get(espaco.id) || { total: 0, pendentes: 0, aprovados: 0, taxaOcupacao: 0 };
              return (
                  <Card key={espaco.id} className="enhanced-card flex flex-col">
                      <CardHeader className="pb-4">
                          <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg font-bold text-foreground">
                              {espaco.nome}
                          </CardTitle>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-1.5 w-fit ${espaco.ativo ? 'bg-status-success-subtle text-status-success-foreground' : 'bg-muted/60 text-muted-foreground'}`}>
                              {espaco.ativo ? <CheckCircle className="w-3.5 h-3.5" /> : null}
                              {espaco.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                          </div>
                          <CardDescription className="text-sm text-muted-foreground line-clamp-2 h-[40px] pt-1">
                          {espaco.descricao || "Sem descrição disponível."}
                          </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="h-4 w-4 flex-shrink-0" />
                              <span className="font-medium">{espaco.capacidade} pessoas</span>
                          </div>
                          {espaco.equipamentos && espaco.equipamentos.length > 0 && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Cpu className="h-4 w-4 flex-shrink-0" />
                                  <span className="font-medium">{espaco.equipamentos.join(', ')}</span>
                              </div>
                          )}
                      </CardContent>
                      <CardContent className="mt-auto pt-4 border-t">
                          <div className="space-y-2 text-sm">
                              <div className="flex justify-between items-center subtle-text"><span>Agendamentos Aprovados</span><span className="font-semibold text-foreground">{stats.aprovados}</span></div>
                              <div className="flex justify-between items-center subtle-text"><span>Agendamentos Pendentes</span><span className="font-semibold text-foreground">{stats.pendentes}</span></div>
                              <div className="flex justify-between items-center subtle-text"><span>Ocupação (30d)</span><span className="font-semibold text-foreground">{stats.taxaOcupacao}</span></div>
                          </div>
                      </CardContent>
                  </Card>
              );
              })
          )}
      </div>
    </div>
  );
};

export default MeusEspacos;
