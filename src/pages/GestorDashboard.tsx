
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Settings, Check, Clock } from 'lucide-react';

const GestorDashboard = () => {
  const { espacos, agendamentos, usuarios } = useLocalStorage();
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

  const stats = [
    {
      title: "Meus Espaços",
      value: meusEspacos.length,
      description: "Espaços sob sua gestão",
      icon: Settings,
      color: "bg-green-500",
      lightColor: "bg-green-50",
      textColor: "text-green-600"
    },
    {
      title: "Pendentes Aprovação",
      value: pendentesAprovacao.length,
      description: "Aguardando sua aprovação",
      icon: Clock,
      color: "bg-orange-500",
      lightColor: "bg-orange-50",
      textColor: "text-orange-600"
    },
    {
      title: "Próximos Agendamentos",
      value: proximosAgendamentos.length,
      description: "Nos seus espaços",
      icon: Calendar,
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "Meus Agendamentos",
      value: meusAgendamentos.length,
      description: "Seus agendamentos pessoais",
      icon: Check,
      color: "bg-purple-500",
      lightColor: "bg-purple-50",
      textColor: "text-purple-600"
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard do Gestor</h1>
        <p className="text-gray-600 mt-2">Gerencie seus espaços e agendamentos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.lightColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-gray-600 mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Agendamentos Pendentes</CardTitle>
            <CardDescription>Requerem sua aprovação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendentesAprovacao.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum agendamento pendente</p>
              ) : (
                pendentesAprovacao.map((agendamento) => {
                  const espaco = espacos.find(e => e.id === agendamento.espacoId);
                  const usuarioAgendamento = usuarios.find(u => u.id === agendamento.usuarioId);
                  return (
                    <div key={agendamento.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                      <div>
                        <p className="font-medium text-gray-800">{espaco?.nome}</p>
                        <p className="text-sm text-gray-600">
                          {usuarioAgendamento?.nome} - {agendamento.data} das {agendamento.horaInicio} às {agendamento.horaFim}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                        Pendente
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Próximos Agendamentos</CardTitle>
            <CardDescription>Nos seus espaços</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {proximosAgendamentos.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum agendamento próximo</p>
              ) : (
                proximosAgendamentos.map((agendamento) => {
                  const espaco = espacos.find(e => e.id === agendamento.espacoId);
                  const usuarioAgendamento = usuarios.find(u => u.id === agendamento.usuarioId);
                  return (
                    <div key={agendamento.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{espaco?.nome}</p>
                        <p className="text-sm text-gray-600">
                          {usuarioAgendamento?.nome} - {agendamento.data} das {agendamento.horaInicio} às {agendamento.horaFim}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        agendamento.status === 'aprovado' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {agendamento.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">Meus Espaços</CardTitle>
          <CardDescription>Espaços sob sua gestão</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meusEspacos.map((espaco) => {
              const agendamentosEspaco = agendamentosMeusEspacos.filter(a => a.espacoId === espaco.id);
              return (
                <div key={espaco.id} className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-gray-800">{espaco.nome}</h3>
                  <p className="text-sm text-gray-600 mt-1">Capacidade: {espaco.capacidade} pessoas</p>
                  <p className="text-sm text-green-600 mt-2 font-medium">
                    {agendamentosEspaco.length} agendamentos
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GestorDashboard;
