
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAuth } from '@/contexts/AuthContext';
import { Agendamento } from '@/types';
import { Calendar, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const NovoAgendamento = () => {
  const { espacos, agendamentos, updateAgendamentos } = useLocalStorage();
  const { usuario } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    espacoId: '',
    data: '',
    horaInicio: '',
    horaFim: '',
    observacoes: ''
  });

  const espacosAtivos = espacos.filter(e => e.ativo);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.espacoId || !formData.data || !formData.horaInicio || !formData.horaFim) {
      toast({
        title: "Erro",
        description: "Todos os campos obrigatórios devem ser preenchidos",
        variant: "destructive",
      });
      return;
    }

    if (formData.horaInicio >= formData.horaFim) {
      toast({
        title: "Erro",
        description: "A hora de início deve ser anterior à hora de fim",
        variant: "destructive",
      });
      return;
    }

    // Verificar conflitos de horário
    const conflito = agendamentos.find(a => 
      a.espacoId === parseInt(formData.espacoId) &&
      a.data === formData.data &&
      a.status !== 'rejeitado' &&
      ((formData.horaInicio >= a.horaInicio && formData.horaInicio < a.horaFim) ||
       (formData.horaFim > a.horaInicio && formData.horaFim <= a.horaFim) ||
       (formData.horaInicio <= a.horaInicio && formData.horaFim >= a.horaFim))
    );

    if (conflito) {
      toast({
        title: "Erro",
        description: "Já existe um agendamento para este espaço neste horário",
        variant: "destructive",
      });
      return;
    }

    const newId = Math.max(...agendamentos.map(a => a.id), 0) + 1;
    const novoAgendamento: Agendamento = {
      id: newId,
      espacoId: parseInt(formData.espacoId),
      usuarioId: usuario!.id,
      data: formData.data,
      horaInicio: formData.horaInicio,
      horaFim: formData.horaFim,
      status: 'pendente',
      observacoes: formData.observacoes,
      criadoEm: new Date().toISOString()
    };

    updateAgendamentos([...agendamentos, novoAgendamento]);
    
    toast({
      title: "Sucesso",
      description: "Agendamento criado com sucesso! Aguarde a aprovação.",
    });

    // Limpar formulário
    setFormData({
      espacoId: '',
      data: '',
      horaInicio: '',
      horaFim: '',
      observacoes: ''
    });
  };

  const getEspacoInfo = (espacoId: string) => {
    const espaco = espacos.find(e => e.id === parseInt(espacoId));
    return espaco;
  };

  const getAgendamentosEspaco = (espacoId: string, data: string) => {
    return agendamentos.filter(a => 
      a.espacoId === parseInt(espacoId) && 
      a.data === data && 
      a.status !== 'rejeitado'
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Novo Agendamento</h1>
        <p className="text-gray-600 mt-2">Agende um espaço para sua reunião ou evento</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dados do Agendamento
            </CardTitle>
            <CardDescription>
              Preencha as informações para seu agendamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="espaco">Espaço *</Label>
                <select 
                  id="espaco"
                  value={formData.espacoId}
                  onChange={(e) => setFormData({...formData, espacoId: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Selecione um espaço</option>
                  {espacosAtivos.map((espaco) => (
                    <option key={espaco.id} value={espaco.id}>
                      {espaco.nome} (Capacidade: {espaco.capacidade} pessoas)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({...formData, data: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="horaInicio">Hora Início *</Label>
                  <Input
                    id="horaInicio"
                    type="time"
                    value={formData.horaInicio}
                    onChange={(e) => setFormData({...formData, horaInicio: e.target.value})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="horaFim">Hora Fim *</Label>
                  <Input
                    id="horaFim"
                    type="time"
                    value={formData.horaFim}
                    onChange={(e) => setFormData({...formData, horaFim: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="observacoes">Observações</Label>
                <textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  placeholder="Descreva o propósito da reunião ou evento"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <Button type="submit" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Criar Agendamento
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {formData.espacoId && (
            <Card>
              <CardHeader>
                <CardTitle>Informações do Espaço</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const espaco = getEspacoInfo(formData.espacoId);
                  return espaco ? (
                    <div className="space-y-2">
                      <p><strong>Nome:</strong> {espaco.nome}</p>
                      <p><strong>Capacidade:</strong> {espaco.capacidade} pessoas</p>
                      {espaco.descricao && (
                        <p><strong>Descrição:</strong> {espaco.descricao}</p>
                      )}
                      {espaco.equipamentos && espaco.equipamentos.length > 0 && (
                        <div>
                          <strong>Equipamentos:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {espaco.equipamentos.map((eq, index) => (
                              <li key={index}>{eq}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}
              </CardContent>
            </Card>
          )}

          {formData.espacoId && formData.data && (
            <Card>
              <CardHeader>
                <CardTitle>Agendamentos do Dia</CardTitle>
                <CardDescription>
                  Horários já ocupados para {new Date(formData.data).toLocaleDateString('pt-BR')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const agendamentosEspaco = getAgendamentosEspaco(formData.espacoId, formData.data);
                  return agendamentosEspaco.length > 0 ? (
                    <div className="space-y-2">
                      {agendamentosEspaco.map((agendamento) => (
                        <div 
                          key={agendamento.id} 
                          className="p-2 bg-red-50 border border-red-200 rounded text-sm"
                        >
                          <strong>{agendamento.horaInicio} - {agendamento.horaFim}</strong>
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${
                            agendamento.status === 'aprovado' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {agendamento.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Nenhum agendamento para este dia</p>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default NovoAgendamento;
