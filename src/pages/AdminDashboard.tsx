import { useSupabaseData } from '@/hooks/useSupabaseData';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { 
  Users, 
  Building2, 
  Calendar, 
  AlertTriangle, 
  Settings,
  UserPlus,
  ClipboardCheck,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatAulas } from '@/utils/format';
import { NumeroAula } from '@/types';

export default function AdminDashboard() {
  const { usuarios, espacos, agendamentos, agendamentosFixos, loading } = useSupabaseData();
  const navigate = useNavigate();

  // Estatísticas
  const stats = {
    totalUsuarios: usuarios.length,
    usuariosAtivos: usuarios.filter(u => u.ativo).length,
    totalEspacos: espacos.length,
    espacosAtivos: espacos.filter(e => e.ativo).length,
    totalAgendamentos: agendamentos.length,
    agendamentosPendentes: agendamentos.filter(a => a.status === 'pendente').length,
    agendamentosAprovados: agendamentos.filter(a => a.status === 'aprovado').length,
    agendamentosRejeitados: agendamentos.filter(a => a.status === 'rejeitado').length,
    agendamentosFixos: agendamentosFixos.length
  };

  // Agendamentos recentes
  const agendamentosRecentes = agendamentos
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
    .slice(0, 5);

  // Espaços mais utilizados
  const espacosUtilizacao = espacos.map(espaco => {
    const agendamentosEspaco = agendamentos.filter(a => a.espacoId === espaco.id);
    return {
      ...espaco,
      utilizacao: agendamentosEspaco.length
    };
  }).sort((a, b) => b.utilizacao - a.utilizacao).slice(0, 3);

  if (loading) {
    return <LoadingSpinner message="Carregando painel administrativo..." />;
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader 
        title="Painel Administrativo"
        subtitle="Visão geral completa do sistema de agendamentos"
        icon={Settings}
        stats={[
          {
            label: "Total de Usuários",
            value: stats.totalUsuarios,
            icon: Users,
            color: "bg-blue-500"
          },
          {
            label: "Espaços Ativos",
            value: stats.espacosAtivos,
            icon: Building2,
            color: "bg-green-500"
          },
          {
            label: "Total Agendamentos",
            value: stats.totalAgendamentos,
            icon: Calendar,
            color: "bg-purple-500"
          },
          {
            label: "Pendentes",
            value: stats.agendamentosPendentes,
            icon: AlertTriangle,
            color: "bg-orange-500"
          }
        ]}
      />

      {/* Status dos Agendamentos - Informação detalhada */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-green-200 bg-green-50 hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-green-700 mb-1">
              {stats.agendamentosAprovados}
            </div>
            <div className="text-sm text-green-600 font-medium">Agendamentos Aprovados</div>
            <div className="text-xs text-green-500 mt-1">
              {((stats.agendamentosAprovados / stats.totalAgendamentos) * 100 || 0).toFixed(1)}% do total
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-orange-200 bg-orange-50 hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Clock className="w-10 h-10 text-orange-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-orange-700 mb-1">
              {stats.agendamentosPendentes}
            </div>
            <div className="text-sm text-orange-600 font-medium">Aguardando Aprovação</div>
            <div className="text-xs text-orange-500 mt-1">
              {stats.agendamentosPendentes > 0 ? 'Requer atenção' : 'Tudo em dia'}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-red-200 bg-red-50 hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <XCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-red-700 mb-1">
              {stats.agendamentosRejeitados}
            </div>
            <div className="text-sm text-red-600 font-medium">Agendamentos Rejeitados</div>
            <div className="text-xs text-red-500 mt-1">
              {((stats.agendamentosRejeitados / stats.totalAgendamentos) * 100 || 0).toFixed(1)}% do total
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-all cursor-pointer group" onClick={() => navigate('/usuarios')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Gerenciar Usuários</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Adicionar, editar ou remover usuários do sistema
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Acessar</span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all cursor-pointer group" onClick={() => navigate('/espacos')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                  <Building2 className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Gerenciar Espaços</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Configurar e organizar os espaços disponíveis
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Acessar</span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all cursor-pointer group" onClick={() => navigate('/aprovar-agendamentos')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-purple-500 group-hover:bg-purple-600 transition-colors">
                  <ClipboardCheck className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Aprovar Agendamentos</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Revisar e aprovar agendamentos pendentes
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                  {stats.agendamentosPendentes} pendente{stats.agendamentosPendentes !== 1 ? 's' : ''}
                </Badge>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all cursor-pointer group" onClick={() => navigate('/todos-agendamentos')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
                  <BarChart3 className="w-5 h-5 text-gray-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Todos Agendamentos</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Visualizar todos os agendamentos do sistema
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Acessar</span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dashboard Inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agendamentos Recentes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Agendamentos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {agendamentosRecentes.length > 0 ? (
                  agendamentosRecentes.map((agendamento) => {
                    const usuario = usuarios.find(u => u.id === agendamento.usuarioId);
                    const espaco = espacos.find(e => e.id === agendamento.espacoId);
                    
                    return (
                      <div key={agendamento.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm text-gray-900">{espaco?.nome}</p>
                            <StatusBadge status={agendamento.status} />
                          </div>
                          <p className="text-xs text-gray-600 mb-1">
                            {usuario?.nome} • {formatAulas(agendamento.aulaInicio as NumeroAula, agendamento.aulaFim as NumeroAula)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(agendamento.data).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">Nenhum agendamento encontrado</p>
                  </div>
                )}
              </div>
            </ScrollArea>
            {agendamentosRecentes.length > 0 && (
              <div className="pt-4 border-t mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/todos-agendamentos')}
                  className="w-full"
                >
                  Ver Todos os Agendamentos
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Espaços Mais Utilizados */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-green-600" />
              Espaços Mais Utilizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {espacosUtilizacao.length > 0 ? (
                espacosUtilizacao.map((espaco, index) => (
                  <div key={espaco.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{espaco.nome}</p>
                        <p className="text-xs text-gray-600">
                          Capacidade: {espaco.capacidade} pessoas
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="mb-1">
                        {espaco.utilizacao} usos
                      </Badge>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 bg-blue-500 rounded-full transition-all"
                          style={{ 
                            width: `${Math.min(100, (espaco.utilizacao / Math.max(...espacosUtilizacao.map(e => e.utilizacao))) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhum espaço encontrado</p>
                </div>
              )}
            </div>
            
            {espacosUtilizacao.length > 0 && (
              <div className="pt-4 border-t mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/espacos')}
                  className="w-full"
                >
                  Gerenciar Espaços
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
