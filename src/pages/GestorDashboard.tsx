import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Settings, Check, Clock, UserCog, AlertCircle } from 'lucide-react';
import { formatAulas, formatDate, formatDateTime } from '@/utils/format';
import { NumeroAula } from '@/types';

const GestorDashboard = () => {
  const { espacos, agendamentos, usuarios, loading } = useSupabaseData();
  const { usuario } = useAuth();

  const meusEspacos = espacos.filter(e => usuario?.espacos?.includes(e.id));
  const agendamentosMeusEspacos = agendamentos.filter(a => 
    meusEspacos.some(e => e.id === a.espacoId)
  );
  const pendentesAprovacao = agendamentosMeusEspacos.filter(a => a.status === 'pendente');
  const meusAgendamentos = agendamentos.filter(a => a.usuarioId === usuario?.id);

  const proximosAgendamentos = agendamentosMeusEspacos
    .filter(a => new Date(a.data) >= new Date())
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .slice(0, 5);

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

  if (loading) {
    return <LoadingSpinner message="Carregando dados..." />;
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader 
        title="Dashboard do Gestor"
        subtitle="Gerencie seus espaços e agendamentos"
        icon={UserCog}
        stats={[
          {
            label: "Meus Espaços",
            value: meusEspacos.length,
            icon: Settings,
            color: "bg-green-100"
          },
          {
            label: "Pendentes Aprovação", 
            value: pendentesAprovacao.length,
            icon: Clock,
            color: "bg-orange-100"
          },
          {
            label: "Próximos Agendamentos",
            value: proximosAgendamentos.length,
            icon: Calendar,
            color: "bg-blue-100"
          },
          {
            label: "Meus Agendamentos",
            value: meusAgendamentos.length,
            icon: Check,
            color: "bg-purple-100"
          }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Agendamentos Pendentes
            </CardTitle>
            <CardDescription>Requerem sua aprovação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendentesAprovacao.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Nenhum agendamento pendente</p>
                    <p className="text-sm">Todos os agendamentos foram processados</p>
                  </div>
                </div>
              ) : (
                pendentesAprovacao.map((agendamento) => {
                  const espaco = espacos.find(e => e.id === agendamento.espacoId);
                  const usuarioAgendamento = usuarios.find(u => u.id === agendamento.usuarioId);
                  return (
                    <div key={agendamento.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400 gap-3 hover:bg-orange-100 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{espaco?.nome}</p>
                        <p className="text-sm text-gray-600">
                          <span className="block sm:inline">{usuarioAgendamento?.nome}</span>
                          <span className="block sm:inline sm:ml-1">- {formatDate(agendamento.data)}</span>
                          <span className="block sm:inline sm:ml-1">{formatAulas(agendamento.aulaInicio as NumeroAula, agendamento.aulaFim as NumeroAula)}</span>
                        </p>
                        {agendamento.observacoes && (
                          <p className="text-sm text-orange-600 mt-1 truncate">{agendamento.observacoes}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                        Pendente
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Próximos Agendamentos
            </CardTitle>
            <CardDescription>Nos seus espaços</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {proximosAgendamentos.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Nenhum agendamento próximo</p>
                    <p className="text-sm">Seus espaços estão livres</p>
                  </div>
                </div>
              ) : (
                proximosAgendamentos.map((agendamento) => {
                  const espaco = espacos.find(e => e.id === agendamento.espacoId);
                  const usuarioAgendamento = usuarios.find(u => u.id === agendamento.usuarioId);
                  return (
                    <div key={agendamento.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{espaco?.nome}</p>
                        <p className="text-sm text-gray-600">
                          {usuarioAgendamento?.nome} - {formatDateTime(agendamento.data, agendamento.aulaInicio as NumeroAula)} ({formatAulas(agendamento.aulaInicio as NumeroAula, agendamento.aulaFim as NumeroAula)})
                        </p>
                        {agendamento.observacoes && (
                          <p className="text-sm text-gray-500 mt-1 truncate">{agendamento.observacoes}</p>
                        )}
                      </div>
                      <Badge variant="outline" className={getStatusColor(agendamento.status)}>
                        {getStatusLabel(agendamento.status)}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-green-600" />
            Meus Espaços
          </CardTitle>
          <CardDescription>Espaços sob sua gestão</CardDescription>
        </CardHeader>
        <CardContent>
          {meusEspacos.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Nenhum espaço atribuído</p>
                <p className="text-sm">Contate o administrador para obter acesso</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {meusEspacos.map((espaco) => {
                const agendamentosEspaco = agendamentosMeusEspacos.filter(a => a.espacoId === espaco.id);
                const pendentes = agendamentosEspaco.filter(a => a.status === 'pendente').length;
                return (
                  <div key={espaco.id} className="p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors">
                    <h3 className="font-semibold text-gray-900 truncate">{espaco.nome}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Capacidade: {espaco.capacidade} pessoas
                    </p>
                    {espaco.descricao && (
                      <p className="text-sm text-gray-500 mt-1 truncate">{espaco.descricao}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        {agendamentosEspaco.length} total
                      </Badge>
                      {pendentes > 0 && (
                        <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
                          {pendentes} pendente{pendentes > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
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
