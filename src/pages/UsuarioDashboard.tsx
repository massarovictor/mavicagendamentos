import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Settings, Check, Clock, User, TrendingUp } from 'lucide-react';
import { formatAulas, formatDate, formatDateTime } from '@/utils/format';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { NumeroAula } from '@/types';

const UsuarioDashboard = () => {
  const { espacos, agendamentos, loading } = useSupabaseData();
  const { usuario } = useAuth();

  const meusAgendamentos = agendamentos.filter(a => a.usuarioId === usuario?.id);
  const proximosAgendamentos = meusAgendamentos
    .filter(a => new Date(a.data) >= new Date())
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  const today = new Date().toISOString().split('T')[0];
  const espacosDisponiveis = espacos.filter(e => e.ativo);
  const agendamentosHoje = agendamentos.filter(a => a.data === today);
  const meusAgendamentosMes = meusAgendamentos.filter(a => {
    const agendamentoDate = new Date(a.data);
    const now = new Date();
    return agendamentoDate.getMonth() === now.getMonth() && 
           agendamentoDate.getFullYear() === now.getFullYear();
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado': return 'bg-success/20 text-success-foreground';
      case 'rejeitado': return 'bg-destructive/20 text-destructive-foreground';
      case 'pendente': return 'bg-warning/20 text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
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

  if (loading) {
    return <LoadingSpinner message="Carregando dashboard..." />;
  }

  return (
    <div className="space-y-6 p-6 bg-background text-foreground">
      <PageHeader 
        title="Meu Dashboard"
        subtitle="Gerencie seus agendamentos e visualize espaços disponíveis"
        icon={User}
        stats={[
          {
            label: "Próximos Agendamentos",
            value: proximosAgendamentos.length,
            icon: Calendar,
            color: "bg-purple-500"
          },
          {
            label: "Espaços Disponíveis",
            value: espacosDisponiveis.length,
            icon: Settings,
            color: "bg-primary"
          },
          {
            label: "Este Mês",
            value: meusAgendamentosMes.length,
            icon: TrendingUp,
            color: "bg-chart-5"
          },
          {
            label: "Aprovados",
            value: meusAgendamentos.filter(a => a.status === 'aprovado').length,
            icon: Check,
            color: "bg-chart-2"
          }
        ]}
      />

      {/* Estatísticas duplicadas removidas – já presentes no PageHeader */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow bg-card text-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Próximos Agendamentos
            </CardTitle>
            <CardDescription className="text-muted-foreground">Seus compromissos futuros</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {proximosAgendamentos.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Nenhum agendamento próximo</p>
                    <p className="text-sm">Que tal criar um novo agendamento?</p>
                  </div>
                </div>
              ) : (
                proximosAgendamentos.slice(0, 5).map((agendamento) => {
                  const espaco = espacos.find(e => e.id === agendamento.espacoId);
                  return (
                    <div key={agendamento.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-background rounded-lg border-l-2 border-primary gap-3 hover:bg-accent transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{espaco?.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(agendamento.data, agendamento.aulaInicio as NumeroAula)} ({formatAulas(agendamento.aulaInicio as NumeroAula, agendamento.aulaFim as NumeroAula)})
                        </p>
                        {agendamento.observacoes && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">{agendamento.observacoes}</p>
                        )}
                      </div>
                      <Badge className={getStatusColor(agendamento.status)} variant="outline">
                        {getStatusLabel(agendamento.status)}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow bg-card text-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Espaços Disponíveis
            </CardTitle>
            <CardDescription className="text-muted-foreground">Para seus agendamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {espacosDisponiveis.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Nenhum espaço disponível</p>
                    <p className="text-sm">Contate o administrador</p>
                  </div>
                </div>
              ) : (
                espacosDisponiveis.slice(0, 6).map((espaco) => {
                  const agendamentosHojeEspaco = agendamentos.filter(a => 
                    a.espacoId === espaco.id && a.data === today
                  );
                  return (
                    <div key={espaco.id} className="flex items-center justify-between p-4 bg-background rounded-lg hover:bg-accent transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{espaco.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          Capacidade: {espaco.capacidade} pessoas
                        </p>
                        {espaco.equipamentos && espaco.equipamentos.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {espaco.equipamentos.slice(0, 2).map((eq, index) => (
                              <Badge key={index} variant="secondary" className="text-xs bg-accent/60 text-accent-foreground">
                                {eq}
                              </Badge>
                            ))}
                            {espaco.equipamentos.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{espaco.equipamentos.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-medium text-primary">
                          {agendamentosHojeEspaco.length}
                        </p>
                        <p className="text-xs text-muted-foreground">hoje</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-lg transition-shadow bg-card text-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Histórico de Agendamentos
          </CardTitle>
          <CardDescription className="text-muted-foreground">Seus últimos agendamentos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {meusAgendamentos.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Nenhum agendamento realizado</p>
                  <p className="text-sm">Comece criando seu primeiro agendamento</p>
                </div>
              </div>
            ) : (
              meusAgendamentos.slice(-6).reverse().map((agendamento) => {
                const espaco = espacos.find(e => e.id === agendamento.espacoId);
                const isPast = new Date(agendamento.data) < new Date();
                return (
                  <div key={agendamento.id} className={`flex items-center bg-background justify-between p-4 rounded-lg hover:shadow-md transition-all ${
                    isPast ? 'bg-muted hover:bg-accent/40' : 'bg-success/20 hover:bg-success/40'
                  }`}>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{espaco?.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(agendamento.data, agendamento.aulaInicio as NumeroAula)} ({formatAulas(agendamento.aulaInicio as NumeroAula, agendamento.aulaFim as NumeroAula)})
                      </p>
                      {agendamento.observacoes && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">{agendamento.observacoes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      {isPast && (
                        <Badge variant="secondary" className="bg-muted text-muted-foreground">
                          Realizado
                        </Badge>
                      )}
                      <Badge className={getStatusColor(agendamento.status)} variant="outline">
                        {getStatusLabel(agendamento.status)}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsuarioDashboard;
