
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Check, X, Clock, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AprovarAgendamentos = () => {
  const { agendamentos, espacos, usuarios, updateAgendamentos } = useLocalStorage();
  const { usuario } = useAuth();
  const { toast } = useToast();
  const [filtroStatus, setFiltroStatus] = useState<string>('pendente');

  const meusEspacos = espacos.filter(e => usuario?.espacos?.includes(e.id));
  const agendamentosMeusEspacos = agendamentos.filter(a => 
    meusEspacos.some(e => e.id === a.espacoId)
  );

  const handleStatusChange = (agendamentoId: number, novoStatus: 'aprovado' | 'rejeitado') => {
    const updatedAgendamentos = agendamentos.map(agendamento => 
      agendamento.id === agendamentoId 
        ? { ...agendamento, status: novoStatus }
        : agendamento
    );
    updateAgendamentos(updatedAgendamentos);
    toast({
      title: "Sucesso",
      description: `Agendamento ${novoStatus === 'aprovado' ? 'aprovado' : 'rejeitado'} com sucesso!`,
    });
  };

  const getEspacoNome = (espacoId: number) => {
    return espacos.find(e => e.id === espacoId)?.nome || 'Espaço não encontrado';
  };

  const getUsuarioNome = (usuarioId: number) => {
    return usuarios.find(u => u.id === usuarioId)?.nome || 'Usuário não encontrado';
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

  const agendamentosFiltrados = filtroStatus === 'todos' 
    ? agendamentosMeusEspacos 
    : agendamentosMeusEspacos.filter(a => a.status === filtroStatus);

  const stats = {
    total: agendamentosMeusEspacos.length,
    pendentes: agendamentosMeusEspacos.filter(a => a.status === 'pendente').length,
    aprovados: agendamentosMeusEspacos.filter(a => a.status === 'aprovado').length,
    rejeitados: agendamentosMeusEspacos.filter(a => a.status === 'rejeitado').length
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Aprovar Agendamentos</h1>
        <p className="text-gray-600 mt-2">Gerencie os agendamentos dos seus espaços</p>
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
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.aprovados}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejeitados</CardTitle>
            <X className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejeitados}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Agendamentos dos Meus Espaços</CardTitle>
              <CardDescription>Gerencie os agendamentos dos espaços sob sua responsabilidade</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={filtroStatus === 'todos' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFiltroStatus('todos')}
              >
                Todos
              </Button>
              <Button 
                variant={filtroStatus === 'pendente' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFiltroStatus('pendente')}
              >
                Pendentes
              </Button>
              <Button 
                variant={filtroStatus === 'aprovado' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFiltroStatus('aprovado')}
              >
                Aprovados
              </Button>
              <Button 
                variant={filtroStatus === 'rejeitado' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFiltroStatus('rejeitado')}
              >
                Rejeitados
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {agendamentosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum agendamento encontrado para o filtro selecionado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Espaço</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agendamentosFiltrados.map((agendamento) => (
                  <TableRow key={agendamento.id}>
                    <TableCell className="font-medium">
                      {getEspacoNome(agendamento.espacoId)}
                    </TableCell>
                    <TableCell>{getUsuarioNome(agendamento.usuarioId)}</TableCell>
                    <TableCell>
                      {new Date(agendamento.data).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {agendamento.horaInicio} - {agendamento.horaFim}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(agendamento.status)} variant="outline">
                        {getStatusLabel(agendamento.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{agendamento.observacoes || '-'}</TableCell>
                    <TableCell>
                      {agendamento.status === 'pendente' && (
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleStatusChange(agendamento.id, 'aprovado')}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleStatusChange(agendamento.id, 'rejeitado')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AprovarAgendamentos;
