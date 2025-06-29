
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Calendar, Clock, Users, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { AgendamentoFixo } from '@/types';

const DIAS_SEMANA = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' }
];

const AgendamentosFixos = () => {
  const { espacos, agendamentosFixos, updateAgendamentosFixos, agendamentos, updateAgendamentos } = useLocalStorage();
  const { usuario } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState<AgendamentoFixo | null>(null);

  // Filtrar espaços baseado no tipo de usuário
  const espacosDisponiveis = usuario?.tipo === 'admin' 
    ? espacos.filter(e => e.ativo)
    : espacos.filter(e => e.ativo && usuario?.espacos?.includes(e.id));

  // Filtrar agendamentos fixos baseado no tipo de usuário
  const agendamentosFixosFiltrados = usuario?.tipo === 'admin'
    ? agendamentosFixos
    : agendamentosFixos.filter(af => usuario?.espacos?.includes(af.espacoId));

  const [formData, setFormData] = useState({
    espacoId: '',
    dataInicio: '',
    dataFim: '',
    horaInicio: '',
    horaFim: '',
    diasSemana: [] as number[],
    observacoes: ''
  });

  const resetForm = () => {
    setFormData({
      espacoId: '',
      dataInicio: '',
      dataFim: '',
      horaInicio: '',
      horaFim: '',
      diasSemana: [],
      observacoes: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.espacoId || !formData.dataInicio || !formData.dataFim || 
        !formData.horaInicio || !formData.horaFim || formData.diasSemana.length === 0) {
      toast({
        title: "Erro",
        description: "Todos os campos obrigatórios devem ser preenchidos.",
        variant: "destructive"
      });
      return;
    }

    if (new Date(formData.dataInicio) >= new Date(formData.dataFim)) {
      toast({
        title: "Erro",
        description: "A data de fim deve ser posterior à data de início.",
        variant: "destructive"
      });
      return;
    }

    if (formData.horaInicio >= formData.horaFim) {
      toast({
        title: "Erro",
        description: "O horário de fim deve ser posterior ao horário de início.",
        variant: "destructive"
      });
      return;
    }

    const novoAgendamentoFixo: AgendamentoFixo = {
      id: editingAgendamento?.id || Date.now(),
      espacoId: Number(formData.espacoId),
      usuarioId: usuario!.id,
      dataInicio: formData.dataInicio,
      dataFim: formData.dataFim,
      horaInicio: formData.horaInicio,
      horaFim: formData.horaFim,
      diasSemana: formData.diasSemana,
      observacoes: formData.observacoes,
      ativo: true,
      criadoEm: editingAgendamento?.criadoEm || new Date().toISOString()
    };

    let novosAgendamentosFixos;
    if (editingAgendamento) {
      novosAgendamentosFixos = agendamentosFixos.map(af => 
        af.id === editingAgendamento.id ? novoAgendamentoFixo : af
      );
    } else {
      novosAgendamentosFixos = [...agendamentosFixos, novoAgendamentoFixo];
    }

    updateAgendamentosFixos(novosAgendamentosFixos);

    // Gerar agendamentos individuais
    gerarAgendamentosIndividuais(novoAgendamentoFixo);

    toast({
      title: "Sucesso",
      description: editingAgendamento 
        ? "Agendamento fixo atualizado com sucesso!" 
        : "Agendamento fixo criado com sucesso!"
    });

    setDialogOpen(false);
    setEditingAgendamento(null);
    resetForm();
  };

  const gerarAgendamentosIndividuais = (agendamentoFixo: AgendamentoFixo) => {
    const novosAgendamentos = [...agendamentos];
    const dataInicio = new Date(agendamentoFixo.dataInicio);
    const dataFim = new Date(agendamentoFixo.dataFim);

    // Remove agendamentos antigos deste agendamento fixo se estiver editando
    if (editingAgendamento) {
      const agendamentosSemAntigos = novosAgendamentos.filter(a => 
        a.agendamentoFixoId !== agendamentoFixo.id
      );
      novosAgendamentos.length = 0;
      novosAgendamentos.push(...agendamentosSemAntigos);
    }

    let currentDate = new Date(dataInicio);
    let agendamentoId = Math.max(...novosAgendamentos.map(a => a.id), 0) + 1;

    while (currentDate <= dataFim) {
      const diaSemana = currentDate.getDay();
      
      if (agendamentoFixo.diasSemana.includes(diaSemana)) {
        const novoAgendamento = {
          id: agendamentoId++,
          espacoId: agendamentoFixo.espacoId,
          usuarioId: agendamentoFixo.usuarioId,
          data: currentDate.toISOString().split('T')[0],
          horaInicio: agendamentoFixo.horaInicio,
          horaFim: agendamentoFixo.horaFim,
          status: 'aprovado' as const,
          observacoes: `Agendamento Fixo: ${agendamentoFixo.observacoes || 'Sem observações'}`,
          criadoEm: new Date().toISOString(),
          agendamentoFixoId: agendamentoFixo.id
        };
        
        novosAgendamentos.push(novoAgendamento);
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    updateAgendamentos(novosAgendamentos);
  };

  const handleEdit = (agendamento: AgendamentoFixo) => {
    setEditingAgendamento(agendamento);
    setFormData({
      espacoId: agendamento.espacoId.toString(),
      dataInicio: agendamento.dataInicio,
      dataFim: agendamento.dataFim,
      horaInicio: agendamento.horaInicio,
      horaFim: agendamento.horaFim,
      diasSemana: agendamento.diasSemana,
      observacoes: agendamento.observacoes || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    const novosAgendamentosFixos = agendamentosFixos.filter(af => af.id !== id);
    updateAgendamentosFixos(novosAgendamentosFixos);

    // Remove os agendamentos individuais relacionados
    const novosAgendamentos = agendamentos.filter(a => a.agendamentoFixoId !== id);
    updateAgendamentos(novosAgendamentos);

    toast({
      title: "Sucesso",
      description: "Agendamento fixo removido com sucesso!"
    });
  };

  const toggleDiaSemana = (dia: number) => {
    setFormData(prev => ({
      ...prev,
      diasSemana: prev.diasSemana.includes(dia)
        ? prev.diasSemana.filter(d => d !== dia)
        : [...prev.diasSemana, dia]
    }));
  };

  const formatDiasSemana = (dias: number[]) => {
    return dias.sort().map(dia => DIAS_SEMANA.find(d => d.value === dia)?.label).join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agendamentos Fixos</h1>
          <p className="text-gray-600 mt-2">Gerencie agendamentos recorrentes</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingAgendamento(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento Fixo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAgendamento ? 'Editar' : 'Criar'} Agendamento Fixo
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="espaco">Espaço *</Label>
                  <Select value={formData.espacoId} onValueChange={(value) => setFormData(prev => ({...prev, espacoId: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um espaço" />
                    </SelectTrigger>
                    <SelectContent>
                      {espacosDisponiveis.map(espaco => (
                        <SelectItem key={espaco.id} value={espaco.id.toString()}>
                          {espaco.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Dias da Semana *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {DIAS_SEMANA.map(dia => (
                      <div key={dia.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dia-${dia.value}`}
                          checked={formData.diasSemana.includes(dia.value)}
                          onCheckedChange={() => toggleDiaSemana(dia.value)}
                        />
                        <Label htmlFor={`dia-${dia.value}`} className="text-sm">
                          {dia.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data de Início *</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => setFormData(prev => ({...prev, dataInicio: e.target.value}))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataFim">Data de Fim *</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={formData.dataFim}
                    onChange={(e) => setFormData(prev => ({...prev, dataFim: e.target.value}))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horaInicio">Horário de Início *</Label>
                  <Input
                    id="horaInicio"
                    type="time"
                    value={formData.horaInicio}
                    onChange={(e) => setFormData(prev => ({...prev, horaInicio: e.target.value}))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horaFim">Horário de Fim *</Label>
                  <Input
                    id="horaFim"
                    type="time"
                    value={formData.horaFim}
                    onChange={(e) => setFormData(prev => ({...prev, horaFim: e.target.value}))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Observações sobre o agendamento fixo..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({...prev, observacoes: e.target.value}))}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingAgendamento ? 'Atualizar' : 'Criar'} Agendamento Fixo
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fixos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agendamentosFixosFiltrados.length}</div>
            <p className="text-xs text-muted-foreground">agendamentos fixos ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espaços Utilizados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(agendamentosFixosFiltrados.map(af => af.espacoId)).size}
            </div>
            <p className="text-xs text-muted-foreground">espaços com agendamentos fixos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Gerados</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agendamentos.filter(a => a.agendamentoFixoId).length}
            </div>
            <p className="text-xs text-muted-foreground">agendamentos individuais criados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Agendamentos Fixos</CardTitle>
          <CardDescription>
            Gerencie todos os agendamentos fixos configurados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agendamentosFixosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum agendamento fixo configurado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Espaço</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Dias da Semana</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agendamentosFixosFiltrados.map((agendamento) => {
                  const espaco = espacos.find(e => e.id === agendamento.espacoId);
                  return (
                    <TableRow key={agendamento.id}>
                      <TableCell className="font-medium">
                        {espaco?.nome}
                      </TableCell>
                      <TableCell>
                        {new Date(agendamento.dataInicio).toLocaleDateString()} - {new Date(agendamento.dataFim).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {agendamento.horaInicio} - {agendamento.horaFim}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-32 truncate" title={formatDiasSemana(agendamento.diasSemana)}>
                          {formatDiasSemana(agendamento.diasSemana)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={agendamento.ativo ? "default" : "secondary"}>
                          {agendamento.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(agendamento)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(agendamento.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgendamentosFixos;
