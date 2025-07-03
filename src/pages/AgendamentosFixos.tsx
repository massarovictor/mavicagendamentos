import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Calendar, Clock, Users, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useNotifications } from '@/hooks/useNotifications';
import { AgendamentoFixo, AULAS_HORARIOS, NumeroAula } from '@/types';

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
  const { espacos, agendamentosFixos, loading, actions } = useSupabaseData();
  const { usuario } = useAuth();
  const notifications = useNotifications();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState<AgendamentoFixo | null>(null);
  const [dataInicioOpen, setDataInicioOpen] = useState(false);
  const [dataFimOpen, setDataFimOpen] = useState(false);

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
    aulaInicio: '',
    aulaFim: '',
    diasSemana: [] as number[],
    observacoes: ''
  });

  const resetForm = () => {
    setFormData({
      espacoId: '',
      dataInicio: '',
      dataFim: '',
      aulaInicio: '',
      aulaFim: '',
      diasSemana: [],
      observacoes: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.espacoId || !formData.dataInicio || !formData.dataFim || 
        !formData.aulaInicio || !formData.aulaFim || formData.diasSemana.length === 0) {
      notifications.error("Erro", "Todos os campos obrigatórios devem ser preenchidos.");
      return;
    }

    if (new Date(formData.dataInicio) >= new Date(formData.dataFim)) {
      notifications.error("Erro", "A data de fim deve ser posterior à data de início.");
      return;
    }

    if (Number(formData.aulaInicio) >= Number(formData.aulaFim)) {
      notifications.error("Erro", "A aula de fim deve ser posterior à aula de início.");
      return;
    }

    const novoAgendamentoFixo: AgendamentoFixo = {
      id: editingAgendamento?.id || Date.now(),
      espacoId: Number(formData.espacoId),
      usuarioId: usuario!.id,
      dataInicio: formData.dataInicio,
      dataFim: formData.dataFim,
      aulaInicio: Number(formData.aulaInicio) as NumeroAula,
      aulaFim: Number(formData.aulaFim) as NumeroAula,
      diasSemana: formData.diasSemana,
      observacoes: formData.observacoes,
      ativo: true,
      criadoEm: editingAgendamento?.criadoEm || new Date().toISOString()
    };

    let success;
    if (editingAgendamento) {
      success = await actions.updateAgendamentoFixo(novoAgendamentoFixo);
    } else {
      success = await actions.addAgendamentoFixo(novoAgendamentoFixo);
    }

    if (!success) {
      notifications.error("Erro", "Falha ao salvar agendamento fixo.");
      return;
    }

    notifications.success(
      "Sucesso",
      editingAgendamento 
        ? "Agendamento fixo atualizado com sucesso!" 
        : "Agendamento fixo criado com sucesso!"
    );

    setDialogOpen(false);
    setEditingAgendamento(null);
    resetForm();
  };

  const handleEdit = (agendamento: AgendamentoFixo) => {
    setEditingAgendamento(agendamento);
    setFormData({
      espacoId: agendamento.espacoId.toString(),
      dataInicio: agendamento.dataInicio,
      dataFim: agendamento.dataFim,
      aulaInicio: agendamento.aulaInicio.toString(),
      aulaFim: agendamento.aulaFim.toString(),
      diasSemana: agendamento.diasSemana,
      observacoes: agendamento.observacoes || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    const success = await actions.deleteAgendamentoFixo(id);
    
    if (success) {
      notifications.success("Sucesso", "Agendamento fixo removido com sucesso!");
    } else {
      notifications.error("Erro", "Falha ao remover agendamento fixo.");
    }
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

  const formatAulas = (aulaInicio: number, aulaFim: number) => {
    const inicio = AULAS_HORARIOS[aulaInicio as NumeroAula];
    const fim = AULAS_HORARIOS[aulaFim as NumeroAula];
    return `${aulaInicio}ª - ${aulaFim}ª aula (${inicio.inicio} - ${fim.fim})`;
  };

  // Estatísticas para o PageHeader
  const stats = [
    {
      label: "Total Fixos",
      value: agendamentosFixosFiltrados.length,
      icon: Calendar,
      color: "bg-blue-100"
    },
    {
      label: "Espaços Utilizados",
      value: new Set(agendamentosFixosFiltrados.map(af => af.espacoId)).size,
      icon: Users,
      color: "bg-green-100"
    },
    {
      label: "Ativos",
      value: agendamentosFixosFiltrados.filter(af => af.ativo).length,
      icon: Clock,
      color: "bg-purple-100"
    }
  ];

  // Colunas para a ResponsiveTable
  const columns = [
    {
      key: 'espaco',
      header: 'Espaço',
      accessor: (agendamento: AgendamentoFixo) => {
        const espaco = espacos.find(e => e.id === agendamento.espacoId);
        return <span className="font-medium">{espaco?.nome}</span>;
      }
    },
    {
      key: 'periodo',
      header: 'Período',
      accessor: (agendamento: AgendamentoFixo) => (
        <div className="text-sm">
          <div>{new Date(agendamento.dataInicio).toLocaleDateString()}</div>
          <div className="text-gray-500">até {new Date(agendamento.dataFim).toLocaleDateString()}</div>
        </div>
      ),
      hiddenOnMobile: true
    },
    {
      key: 'horario',
      header: 'Horário',
      accessor: (agendamento: AgendamentoFixo) => (
        <div className="text-sm">
          {formatAulas(agendamento.aulaInicio, agendamento.aulaFim)}
        </div>
      )
    },
    {
      key: 'dias',
      header: 'Dias da Semana',
      accessor: (agendamento: AgendamentoFixo) => (
        <div className="max-w-32 truncate" title={formatDiasSemana(agendamento.diasSemana)}>
          {formatDiasSemana(agendamento.diasSemana)}
        </div>
      ),
      hiddenOnMobile: true
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (agendamento: AgendamentoFixo) => (
        <Badge variant={agendamento.ativo ? "default" : "secondary"}>
          {agendamento.ativo ? "Ativo" : "Inativo"}
        </Badge>
      )
    },
    {
      key: 'acoes',
      header: 'Ações',
      accessor: (agendamento: AgendamentoFixo) => (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(agendamento);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(agendamento.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  // Renderização customizada para mobile
  const mobileCardRender = (agendamento: AgendamentoFixo) => {
    const espaco = espacos.find(e => e.id === agendamento.espacoId);
    
    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-gray-900">{espaco?.nome}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {formatAulas(agendamento.aulaInicio, agendamento.aulaFim)}
            </p>
          </div>
          <Badge variant={agendamento.ativo ? "default" : "secondary"}>
            {agendamento.ativo ? "Ativo" : "Inativo"}
          </Badge>
        </div>
        
        <div className="text-sm text-gray-600">
          <div><strong>Período:</strong> {new Date(agendamento.dataInicio).toLocaleDateString()} - {new Date(agendamento.dataFim).toLocaleDateString()}</div>
          <div className="mt-1"><strong>Dias:</strong> {formatDiasSemana(agendamento.diasSemana)}</div>
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleEdit(agendamento)}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleDelete(agendamento.id)}
            className="flex-1"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner message="Carregando agendamentos fixos..." />;
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader 
        title="Agendamentos Fixos"
        subtitle="Gerencie agendamentos recorrentes para garantir disponibilidade dos espaços"
        icon={Calendar}
        stats={stats}
        actions={
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
                    <Label>Data de Início *</Label>
                    <Popover open={dataInicioOpen} onOpenChange={setDataInicioOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${
                            !formData.dataInicio && "text-muted-foreground"
                          }`}
                        >
                          <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {formData.dataInicio ? (
                              new Date(formData.dataInicio + 'T12:00:00').toLocaleDateString('pt-BR', {
                                weekday: 'short',
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            ) : (
                              "Selecione data início"
                            )}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={formData.dataInicio ? new Date(formData.dataInicio + 'T12:00:00') : undefined}
                          onSelect={(date) => {
                            if (date) {
                              const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                              setFormData(prev => ({...prev, dataInicio: localDate.toISOString().split('T')[0]}));
                              setDataInicioOpen(false);
                            }
                          }}
                          fromDate={new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Fim *</Label>
                    <Popover open={dataFimOpen} onOpenChange={setDataFimOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${
                            !formData.dataFim && "text-muted-foreground"
                          }`}
                        >
                          <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {formData.dataFim ? (
                              new Date(formData.dataFim + 'T12:00:00').toLocaleDateString('pt-BR', {
                                weekday: 'short',
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            ) : (
                              "Selecione data fim"
                            )}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={formData.dataFim ? new Date(formData.dataFim + 'T12:00:00') : undefined}
                          onSelect={(date) => {
                            if (date) {
                              const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                              setFormData(prev => ({...prev, dataFim: localDate.toISOString().split('T')[0]}));
                              setDataFimOpen(false);
                            }
                          }}
                          fromDate={formData.dataInicio ? new Date(formData.dataInicio + 'T12:00:00') : new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="aulaInicio">Aula de Início *</Label>
                    <Select value={formData.aulaInicio} onValueChange={(value) => setFormData(prev => ({...prev, aulaInicio: value}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a aula" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(AULAS_HORARIOS).map(([aula, horario]) => (
                          <SelectItem key={aula} value={aula}>
                            {aula}ª aula ({horario.inicio} - {horario.fim})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aulaFim">Aula de Fim *</Label>
                    <Select value={formData.aulaFim} onValueChange={(value) => setFormData(prev => ({...prev, aulaFim: value}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a aula" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(AULAS_HORARIOS).map(([aula, horario]) => (
                          <SelectItem key={aula} value={aula}>
                            {aula}ª aula ({horario.inicio} - {horario.fim})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Lista de Agendamentos Fixos</CardTitle>
          <CardDescription>
            Gerencie todos os agendamentos fixos configurados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTable
            data={agendamentosFixosFiltrados}
            columns={columns}
            mobileCardRender={mobileCardRender}
            emptyState={
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum agendamento fixo configurado</p>
                <p className="text-sm text-gray-400 mt-1">
                  Clique em "Novo Agendamento Fixo" para começar
                </p>
              </div>
            }
            className="mt-4"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AgendamentosFixos;
