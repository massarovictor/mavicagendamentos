
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, MapPin } from 'lucide-react';

const MeusAgendamentos = () => {
  const { agendamentos, espacos } = useLocalStorage();
  const { usuario } = useAuth();

  const meusAgendamentos = agendamentos.filter(a => a.usuarioId === usuario?.id);
  
  const getEspacoNome = (espacoId: number) => {
    return espacos.find(e => e.id === espacoId)?.nome || 'Espaço não encontrado';
  };

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

  const stats = {
    total: meusAgendamentos.length,
    pendentes: meusAgendamentos.filter(a => a.status === 'pendente').length,
    aprovados: meusAgendamentos.filter(a => a.status === 'aprovado').length,
    rejeitados: meusAgendamentos.filter(a => a.status === 'rejeitado').length
  };

  // Separar agendamentos por status
  const agendamentosPendentes = meusAgendamentos.filter(a => a.status === 'pendente');
  const agendamentosAprovados = meusAgendamentos.filter(a => a.status === 'aprovado');
  const proximosAgendamentos = agendamentosAprovados.filter(a => 
    new Date(a.data) >= new Date(new Date().toISOString().split('T')[0])
  ).slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Meus Agendamentos</h1>
        <p className="text-gray-600 mt-2">Visualize e acompanhe seus agendamentos</p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendentes}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.aprovados}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejeitados</CardTitle>
            <MapPin className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejeitados}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos agendamentos */}
        <Card>
          <CardHeader>
            <CardTitle>Próximos Agendamentos</CardTitle>
            <CardDescription>Seus agendamentos aprovados mais próximos</CardDescription>
          </CardHeader>
          <CardContent>
            {proximosAgendamentos.length > 0 ? (
              <div className="space-y-3">
                {proximosAgendamentos.map((agendamento) => (
                  <div key={agendamento.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="font-medium text-green-800">
                      {getEspacoNome(agendamento.espacoId)}
                    </div>
                    <div className="text-sm text-green-600">
                      {new Date(agendamento.data).toLocaleDateString('pt-BR')} às {agendamento.horaInicio}
                    </div>
                    {agendamento.observacoes && (
                      <div className="text-xs text-green-600 mt-1">
                        {agendamento.observacoes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Nenhum agendamento aprovado próximo</p>
            )}
          </CardContent>
        </Card>

        {/* Agendamentos pendentes */}
        <Card>
          <CardHeader>
            <CardTitle>Pendentes de Aprovação</CardTitle>
            <CardDescription>Agendamentos aguardando aprovação</CardDescription>
          </CardHeader>
          <CardContent>
            {agendamentosPendentes.length > 0 ? (
              <div className="space-y-3">
                {agendamentosPendentes.map((agendamento) => (
                  <div key={agendamento.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="font-medium text-yellow-800">
                      {getEspacoNome(agendamento.espacoId)}
                    </div>
                    <div className="text-sm text-yellow-600">
                      {new Date(agendamento.data).toLocaleDateString('pt-BR')} às {agendamento.horaInicio}
                    </div>
                    {agendamento.observacoes && (
                      <div className="text-xs text-yellow-600 mt-1">
                        {agendamento.observacoes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Nenhum agendamento pendente</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela com todos os agendamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico Completo</CardTitle>
          <CardDescription>Todos os seus agendamentos</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Espaço</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meusAgendamentos.map((agendamento) => (
                <TableRow key={agendamento.id}>
                  <TableCell className="font-medium">
                    {getEspacoNome(agendamento.espacoId)}
                  </TableCell>
                  <TableCell>
                    {new Date(agendamento.data).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {agendamento.horaInicio} - {agendamento.horaFim}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(agendamento.status)}`}>
                      {getStatusLabel(agendamento.status)}
                    </span>
                  </TableCell>
                  <TableCell>{agendamento.observacoes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MeusAgendamentos;
