
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Settings, Check, Clock } from 'lucide-react';

const UsuarioDashboard = () => {
  const { espacos, agendamentos } = useLocalStorage();
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

  const stats = [
    {
      title: "Próximos Agendamentos",
      value: proximosAgendamentos.length,
      description: "Seus próximos compromissos",
      icon: Calendar,
      color: "bg-purple-500",
      lightColor: "bg-purple-50",
      textColor: "text-purple-600"
    },
    {
      title: "Espaços Disponíveis",
      value: espacosDisponiveis.length,
      description: "Para agendamento hoje",
      icon: Settings,
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "Agendamentos Este Mês",
      value: meusAgendamentosMes.length,
      description: "Seus agendamentos mensais",
      icon: Check,
      color: "bg-green-500",
      lightColor: "bg-green-50",
      textColor: "text-green-600"
    },
    {
      title: "Status Recentes",
      value: meusAgendamentos.filter(a => a.status === 'aprovado').length,
      description: "Agendamentos aprovados",
      icon: Clock,
      color: "bg-orange-500",
      lightColor: "bg-orange-50",
      textColor: "text-orange-600"
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Meu Dashboard</h1>
        <p className="text-gray-600 mt-2">Gerencie seus agendamentos e visualize espaços disponíveis</p>
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
            <CardTitle className="text-lg font-semibold text-gray-800">Próximos Agendamentos</CardTitle>
            <CardDescription>Seus compromissos futuros</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {proximosAgendamentos.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum agendamento próximo</p>
              ) : (
                proximosAgendamentos.slice(0, 5).map((agendamento) => {
                  const espaco = espacos.find(e => e.id === agendamento.espacoId);
                  return (
                    <div key={agendamento.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                      <div>
                        <p className="font-medium text-gray-800">{espaco?.nome}</p>
                        <p className="text-sm text-gray-600">
                          {agendamento.data} das {agendamento.horaInicio} às {agendamento.horaFim}
                        </p>
                        {agendamento.observacoes && (
                          <p className="text-xs text-gray-500 mt-1">{agendamento.observacoes}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        agendamento.status === 'aprovado' 
                          ? 'bg-green-100 text-green-800'
                          : agendamento.status === 'pendente'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Espaços Disponíveis</CardTitle>
            <CardDescription>Para seus agendamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {espacosDisponiveis.map((espaco) => {
                const agendamentosHoje = agendamentos.filter(a => 
                  a.espacoId === espaco.id && a.data === today
                );
                return (
                  <div key={espaco.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{espaco.nome}</p>
                      <p className="text-sm text-gray-600">
                        Capacidade: {espaco.capacidade} pessoas
                      </p>
                      {espaco.equipamentos && espaco.equipamentos.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {espaco.equipamentos.slice(0, 2).join(', ')}
                          {espaco.equipamentos.length > 2 && '...'}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-600">
                        {agendamentosHoje.length} agendamento{agendamentosHoje.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-500">hoje</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">Histórico de Agendamentos</CardTitle>
          <CardDescription>Seus últimos agendamentos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {meusAgendamentos.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum agendamento realizado ainda</p>
            ) : (
              meusAgendamentos.slice(-5).reverse().map((agendamento) => {
                const espaco = espacos.find(e => e.id === agendamento.espacoId);
                const isPast = new Date(agendamento.data) < new Date();
                return (
                  <div key={agendamento.id} className={`flex items-center justify-between p-3 rounded-lg ${
                    isPast ? 'bg-gray-50' : 'bg-green-50'
                  }`}>
                    <div>
                      <p className="font-medium text-gray-800">{espaco?.nome}</p>
                      <p className="text-sm text-gray-600">
                        {agendamento.data} das {agendamento.horaInicio} às {agendamento.horaFim}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isPast && <span className="text-xs text-gray-400">Realizado</span>}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        agendamento.status === 'aprovado' 
                          ? 'bg-green-100 text-green-800'
                          : agendamento.status === 'pendente'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {agendamento.status}
                      </span>
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
