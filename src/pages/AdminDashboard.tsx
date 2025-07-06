import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Link } from 'react-router-dom';
import { formatDate } from '@/utils/format';
import { 
  Plus, 
  ArrowRight, 
  Users, 
  Building2, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  Activity,
  Settings
} from 'lucide-react';

const AdminDashboard = () => {
  const { usuarios, espacos, agendamentos, loading } = useSupabaseData();

  const stats = useMemo(() => {
    const totalUsuarios = usuarios.length;
    const usuariosAtivos = usuarios.filter(u => u.ativo).length;
    const espacosAtivos = espacos.filter(e => e.ativo).length;
    const totalAgendamentos = agendamentos.length;
    
    const agendamentosPendentes = agendamentos.filter(a => a.status === 'pendente').length;
    const agendamentosAprovados = agendamentos.filter(a => a.status === 'aprovado').length;
    const agendamentosRejeitados = agendamentos.filter(a => a.status === 'rejeitado').length;
    
    const agendamentosHoje = agendamentos.filter(a => 
      a.data === new Date().toISOString().split('T')[0]
    ).length;

    return {
      totalUsuarios,
      usuariosAtivos,
      espacosAtivos,
      totalAgendamentos,
      agendamentosPendentes,
      agendamentosAprovados,
      agendamentosRejeitados,
      agendamentosHoje
    };
  }, [usuarios, espacos, agendamentos]);

  const agendamentosRecentes = useMemo(() => {
    return agendamentos
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
      .slice(0, 5);
  }, [agendamentos]);

  const espacosMaisUtilizados = useMemo(() => {
    const espacosCount = espacos.map(espaco => {
      const count = agendamentos.filter(a => a.espacoId === espaco.id).length;
      return { ...espaco, count };
    }).sort((a, b) => b.count - a.count).slice(0, 3);
    
    return espacosCount;
  }, [espacos, agendamentos]);

  const getStatusBadge = (status: string) => {
    const baseClass = "text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5";
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
        return <Badge variant="secondary" className="text-xs font-medium">{status}</Badge>;
    }
  };

  const getEspacoNome = (espacoId: number) => {
    return espacos.find(e => e.id === espacoId)?.nome || 'Espaço não encontrado';
  };

  const getUsuarioNome = (usuarioId: number) => {
    return usuarios.find(u => u.id === usuarioId)?.nome || 'Usuário não encontrado';
  };

  if (loading) {
    return <LoadingSpinner message="Carregando painel administrativo..." />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Header com CTA Principal */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="section-title text-balance">Painel Administrativo</h1>
          <p className="subtle-text">
            Visão geral completa do sistema
          </p>
        </div>
        <Button asChild className="elegant-button">
          <Link to="/novo-agendamento">
            <Plus className="w-4 h-4 mr-2" />
            Novo Agendamento
          </Link>
        </Button>
      </div>

      {/* Métricas Principais com Ícones Essenciais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="enhanced-card">
          <CardContent className="refined-spacing">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="w-6 h-6 icon-accent" />
              </div>
              <div className="metric-display">{stats.totalUsuarios}</div>
            </div>
            <div className="space-y-1">
              <div className="card-title">Usuários</div>
              <div className="caption-text">
                {stats.usuariosAtivos} ativos
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="enhanced-card">
          <CardContent className="refined-spacing">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-chart-2/10 rounded-lg">
                <Building2 className="w-6 h-6 text-chart-2" />
              </div>
              <div className="metric-display">{stats.espacosAtivos}</div>
            </div>
            <div className="space-y-1">
              <div className="card-title">Espaços</div>
              <div className="caption-text">
                {espacos.length} cadastrados
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="enhanced-card">
          <CardContent className="refined-spacing">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-chart-3/10 rounded-lg">
                <Calendar className="w-6 h-6 text-chart-3" />
              </div>
              <div className="metric-display">{stats.totalAgendamentos}</div>
            </div>
            <div className="space-y-1">
              <div className="card-title">Agendamentos</div>
              <div className="caption-text">
                {stats.agendamentosHoje} hoje
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="enhanced-card border-status-warning-border/50">
          <CardContent className="refined-spacing">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-status-warning/10 rounded-lg">
                <Clock className="w-6 h-6 text-status-warning" />
              </div>
              <div className="metric-display text-status-warning">{stats.agendamentosPendentes}</div>
            </div>
            <div className="space-y-1">
              <div className="card-title">Pendentes</div>
              <div className="caption-text">
                {stats.agendamentosPendentes > 0 ? 'Requer ação' : 'Tudo em dia'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Ações Rápidas sem Ícones */}
      <Card className="enhanced-card">
        <CardContent className="refined-spacing">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 icon-muted" />
            <h2 className="card-title">Ações Rápidas</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { 
                title: "Aprovar Agendamentos", 
                subtitle: `${stats.agendamentosPendentes} pendentes`,
                href: "/aprovar-agendamentos",
                urgent: stats.agendamentosPendentes > 0
              },
              { 
                title: "Gerenciar Espaços", 
                subtitle: `${stats.espacosAtivos} ativos`,
                href: "/espacos"
              },
              { 
                title: "Gerenciar Usuários", 
                subtitle: `${stats.totalUsuarios} cadastrados`,
                href: "/usuarios"
              },
              { 
                title: "Ver Agendamentos", 
                subtitle: `${stats.totalAgendamentos} registros`,
                href: "/todos-agendamentos"
              }
            ].map((action, index) => (
              <Button 
                key={index}
                asChild 
                variant="outline" 
                className={`h-auto p-5 justify-between elegant-button ${
                  action.urgent ? 'border-status-warning-border bg-status-warning-bg/20 hover:bg-status-warning-bg/30' : ''
                }`}
              >
                <Link to={action.href}>
                  <div className="text-left space-y-1">
                    <div className="font-semibold">{action.title}</div>
                    <div className="body-text text-muted-foreground">{action.subtitle}</div>
                  </div>
                  <ArrowRight className="w-5 h-5 icon-muted group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerta Contextual */}
      {stats.agendamentosPendentes > 0 && (
        <Card className="enhanced-card border-status-warning-border bg-status-warning-bg/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-status-warning/20 rounded-full">
                <AlertTriangle className="w-5 h-5 text-status-warning" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-status-warning-text text-balance">
                  {stats.agendamentosPendentes} agendamentos aguardando aprovação
                </div>
                <div className="caption-text mt-1">
                  Ação necessária para manter o sistema atualizado
                </div>
              </div>
              <Button asChild size="sm" className="elegant-button">
                <Link to="/aprovar-agendamentos">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Revisar Agora
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conteúdo Relevante com Menos Ícones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Agendamentos Recentes */}
        <Card className="enhanced-card">
          <CardContent className="refined-spacing">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 icon-muted" />
              <h3 className="card-title">Agendamentos Recentes</h3>
            </div>
            {agendamentosRecentes.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 icon-muted mx-auto mb-4" />
                <div className="subtle-text">Nenhum agendamento recente</div>
              </div>
            ) : (
              <div className="space-y-1">
                {agendamentosRecentes.map(agendamento => (
                  <div key={agendamento.id} className="group">
                    <div className="flex items-center justify-between py-4 border-b border-border/50 last:border-0">
                      <div className="space-y-1.5 min-w-0">
                        <div className="font-semibold body-text truncate" title={getEspacoNome(agendamento.espacoId)}>
                          {getEspacoNome(agendamento.espacoId)}
                        </div>
                        <div className="caption-text">
                          {formatDate(agendamento.data)} • {agendamento.aulaInicio}ª à {agendamento.aulaFim}ª aula por {getUsuarioNome(agendamento.usuarioId)}
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        {getStatusBadge(agendamento.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Espaços Mais Utilizados */}
        <Card className="enhanced-card">
          <CardContent className="refined-spacing">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 icon-muted" />
              <h3 className="card-title">Espaços Mais Utilizados</h3>
            </div>
            {espacosMaisUtilizados.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 icon-muted mx-auto mb-4" />
                <div className="subtle-text">Nenhum dado disponível</div>
              </div>
            ) : (
              <div className="space-y-2">
                {espacosMaisUtilizados.map((espaco, index) => (
                  <div key={espaco.id} className="group">
                    <div className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0">
                      <div className="flex items-center justify-center w-9 h-9 bg-primary/10 rounded-full text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="font-semibold body-text">{espaco.nome}</div>
                        <div className="caption-text">
                          {espaco.capacidade} pessoas
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg tabular-nums">{espaco.count}</div>
                        <div className="caption-text">usos</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
