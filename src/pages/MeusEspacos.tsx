import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Users, Calendar, Clock, TrendingUp, Building2 } from 'lucide-react';
import { formatDateTime } from '@/utils/format';
import { NumeroAula } from '@/types';
import { PageHeader } from '@/components/ui/page-header';

const MeusEspacos = () => {
  const { espacos, agendamentos, loading } = useSupabaseData();
  const { usuario } = useAuth();

  const meusEspacos = espacos.filter(e => usuario?.espacos?.includes(e.id));

  const getEspacoStats = (espacoId: number) => {
    const agendamentosEspaco = agendamentos.filter(a => a.espacoId === espacoId);
    const pendentes = agendamentosEspaco.filter(a => a.status === 'pendente').length;
    const aprovados = agendamentosEspaco.filter(a => a.status === 'aprovado').length;
    const rejeitados = agendamentosEspaco.filter(a => a.status === 'rejeitado').length;
    const proximosAgendamentos = agendamentosEspaco.filter(a => 
      new Date(a.data) >= new Date() && a.status === 'aprovado'
    );

    // Taxa de ocupação (últimos 30 dias)
    const hoje = new Date();
    const treintaDiasAtras = new Date(hoje.getTime() - (30 * 24 * 60 * 60 * 1000));
    const agendamentosUltimos30Dias = agendamentosEspaco.filter(a => {
      const dataAgendamento = new Date(a.data);
      return dataAgendamento >= treintaDiasAtras && dataAgendamento <= hoje && a.status === 'aprovado';
    });
    const taxaOcupacao = agendamentosUltimos30Dias.length;

    return {
      total: agendamentosEspaco.length,
      pendentes,
      aprovados,
      rejeitados,
      proximos: proximosAgendamentos.length,
      taxaOcupacao,
      proximoAgendamento: proximosAgendamentos.sort((a, b) => 
        new Date(a.data).getTime() - new Date(b.data).getTime()
      )[0]
    };
  };

  const getTotalStats = () => {
    return meusEspacos.reduce((acc, espaco) => {
      const stats = getEspacoStats(espaco.id);
      return {
        totalAgendamentos: acc.totalAgendamentos + stats.total,
        totalPendentes: acc.totalPendentes + stats.pendentes,
        totalAprovados: acc.totalAprovados + stats.aprovados,
        totalCapacidade: acc.totalCapacidade + espaco.capacidade
      };
    }, { totalAgendamentos: 0, totalPendentes: 0, totalAprovados: 0, totalCapacidade: 0 });
  };

  if (loading) {
    return <LoadingSpinner message="Carregando espaços..." />;
  }

  const totalStats = getTotalStats();

  // Estatísticas para o PageHeader
  const pageStats = [
    {
      label: 'Total de Espaços',
      value: meusEspacos.length,
      icon: Building2,
      color: 'bg-purple-500'
    },
    {
      label: 'Agendamentos',
      value: totalStats.totalAgendamentos,
      icon: Calendar,
      color: 'bg-blue-500'
    },
    {
      label: 'Pendentes',
      value: totalStats.totalPendentes,
      icon: Clock,
      color: 'bg-orange-500'
    },
    {
      label: 'Capacidade Total',
      value: totalStats.totalCapacidade,
      icon: Users,
      color: 'bg-green-500'
    }
  ];

  return (
    <div className="space-y-6 p-6 bg-background text-foreground">
      {/* PageHeader */}
      <PageHeader
        title="Meus Espaços"
        subtitle="Gerencie os espaços sob sua responsabilidade"
        icon={Building2}
        stats={pageStats}
      />

      {meusEspacos.length === 0 ? (
        <Card className="hover:shadow-lg transition-shadow bg-card text-foreground">
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground">
              <Settings className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="font-medium text-lg">Nenhum espaço atribuído</p>
              <p className="text-sm">Contate o administrador para obter acesso a espaços</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Grid de Espaços */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meusEspacos.map((espaco) => {
              const stats = getEspacoStats(espaco.id);
              return (
                <Card key={espaco.id} className="overflow-hidden hover:shadow-lg transition-shadow bg-card text-foreground">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <CardTitle className="text-lg font-semibold text-foreground truncate">
                        {espaco.nome}
                      </CardTitle>
                      <Badge 
                        variant={espaco.ativo ? "default" : "secondary"}
                        className={`text-xs w-fit ${
                          espaco.ativo 
                            ? 'bg-success/20 text-success-foreground' 
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {espaco.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                      {espaco.descricao || "Sem descrição disponível"}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span className="font-medium">{espaco.capacidade} pessoas</span>
                    </div>

                    {espaco.equipamentos && espaco.equipamentos.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Equipamentos:</p>
                        <div className="flex flex-wrap gap-1">
                          {espaco.equipamentos.slice(0, 3).map((eq, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-accent/60 text-accent-foreground">
                              {eq}
                            </Badge>
                          ))}
                          {espaco.equipamentos.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{espaco.equipamentos.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Taxa de ocupação */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span>Últimos 30 dias</span>
                      </div>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {stats.taxaOcupacao} agendamentos
                      </Badge>
                    </div>

                    {/* Próximo agendamento */}
                    {stats.proximoAgendamento && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                          Próximo: {formatDateTime(stats.proximoAgendamento.data, stats.proximoAgendamento.aulaInicio as NumeroAula)}
                        </span>
                      </div>
                    )}

                    {/* Estatísticas */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                      <div className="text-center p-2 bg-primary/10 rounded">
                        <div className="text-xl font-bold text-primary">{stats.total}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                      <div className="text-center p-2 bg-warning/10 rounded">
                        <div className="text-xl font-bold text-warning">{stats.pendentes}</div>
                        <div className="text-xs text-muted-foreground">Pendentes</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2 bg-success/10 rounded">
                        <div className="text-xl font-bold text-success">{stats.aprovados}</div>
                        <div className="text-xs text-muted-foreground">Aprovados</div>
                      </div>
                      <div className="text-center p-2 bg-chart-5/10 rounded">
                        <div className="text-xl font-bold text-chart-5">{stats.proximos}</div>
                        <div className="text-xs text-muted-foreground">Próximos</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default MeusEspacos;
