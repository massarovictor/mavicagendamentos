
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Calendar, Settings, User, Check } from 'lucide-react';

const AdminDashboard = () => {
  const { usuarios, espacos, agendamentos } = useLocalStorage();

  const today = new Date().toISOString().split('T')[0];
  const agendamentosHoje = agendamentos.filter(a => a.data === today);
  const agendamentosPendentes = agendamentos.filter(a => a.status === 'pendente');

  const stats = [
    {
      title: "Total de Espaços",
      value: espacos.filter(e => e.ativo).length,
      description: "Espaços ativos no sistema",
      icon: Settings,
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "Agendamentos Hoje",
      value: agendamentosHoje.length,
      description: "Agendamentos para hoje",
      icon: Calendar,
      color: "bg-green-500",
      lightColor: "bg-green-50",
      textColor: "text-green-600"
    },
    {
      title: "Usuários Cadastrados",
      value: usuarios.length,
      description: "Total de usuários no sistema",
      icon: User,
      color: "bg-purple-500",
      lightColor: "bg-purple-50",
      textColor: "text-purple-600"
    },
    {
      title: "Pendentes de Aprovação",
      value: agendamentosPendentes.length,
      description: "Agendamentos aguardando aprovação",
      icon: Check,
      color: "bg-orange-500",
      lightColor: "bg-orange-50",
      textColor: "text-orange-600"
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
        <p className="text-gray-600 mt-2">Visão geral do sistema de agendamento</p>
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
            <CardTitle className="text-lg font-semibold text-gray-800">Agendamentos Recentes</CardTitle>
            <CardDescription>Últimos agendamentos realizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agendamentos.slice(-5).reverse().map((agendamento) => {
                const espaco = espacos.find(e => e.id === agendamento.espacoId);
                const usuario = usuarios.find(u => u.id === agendamento.usuarioId);
                return (
                  <div key={agendamento.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{espaco?.nome}</p>
                      <p className="text-sm text-gray-600">
                        {usuario?.nome} - {agendamento.data} às {agendamento.horaInicio}
                      </p>
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
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Espaços Mais Utilizados</CardTitle>
            <CardDescription>Ranking de uso dos espaços</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {espacos.map((espaco) => {
                const uso = agendamentos.filter(a => a.espacoId === espaco.id).length;
                return (
                  <div key={espaco.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{espaco.nome}</p>
                      <p className="text-sm text-gray-600">Capacidade: {espaco.capacidade} pessoas</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{uso}</p>
                      <p className="text-xs text-gray-500">agendamentos</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
