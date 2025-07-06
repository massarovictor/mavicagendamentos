import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';
import { useForm } from '@/hooks/useForm';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, Building2, User, AlertTriangle, CheckCircle, Info, Plus, ListChecks } from 'lucide-react';
import { AULAS_HORARIOS, NumeroAula, Agendamento } from '@/types';
import { formatAulas } from '@/utils/format';
import { BusinessValidations, DataIntegrityValidations, SecurityValidations, agendamentoSchema } from '@/utils/validations';
import { HorarioGrid } from '@/components/shared/HorarioGrid';

interface AgendamentoFormData {
  espacoId: number;
  data: string;
  aulaInicio: NumeroAula;
  aulaFim: NumeroAula;
  observacoes: string;
}

// Validação de formulário
const validateForm = (values: AgendamentoFormData) => {
  const errors: Record<string, string> = {};

  // Validar espaço
  if (!values.espacoId || values.espacoId === 0) {
    errors.espacoId = 'Selecione um espaço';
  }

  // Validar data
  if (!values.data) {
    errors.data = 'Selecione uma data';
  }

  // Validar aula início
  if (!values.aulaInicio || values.aulaInicio < 1 || values.aulaInicio > 9) {
    errors.aulaInicio = 'Selecione uma aula de início válida';
  }

  // Validar aula fim
  if (!values.aulaFim || values.aulaFim < 1 || values.aulaFim > 9) {
    errors.aulaFim = 'Selecione uma aula de fim válida';
  }

  // Validar sequência de aulas
  if (values.aulaInicio && values.aulaFim && values.aulaInicio > values.aulaFim) {
    errors.aulaFim = 'A aula de fim deve ser posterior à aula de início';
  }

  // Validar observações (opcional, mas se preenchidas não podem ser só espaços)
  if (values.observacoes && values.observacoes.trim().length === 0) {
    errors.observacoes = 'Observações não podem ser apenas espaços em branco';
  }

  return errors;
};

const NovoAgendamento = () => {
  const { espacos, agendamentos, agendamentosFixos, usuarios, loading, actions } = useSupabaseData();
  const { usuario } = useAuth();
  const notifications = useNotifications();
  const [calendarOpen, setCalendarOpen] = React.useState(false);

  const espacosAtivos = useMemo(() => 
    espacos.filter(e => e.ativo), 
    [espacos]
  );

  const getAulaOptions = () => {
    return Array.from({ length: 9 }, (_, i) => {
      const aula = (i + 1) as NumeroAula;
      const horario = AULAS_HORARIOS[aula];
      return {
        value: aula,
        label: horario ? `${aula}ª aula (${horario.inicio} - ${horario.fim})` : `${aula}ª aula`
      };
    });
  };

  const form = useForm<AgendamentoFormData>({
    initialValues: {
      espacoId: 0,
      data: new Date().toISOString().split('T')[0], // Data de hoje como padrão
      aulaInicio: 1,
      aulaFim: 1,
      observacoes: ''
    },
    persistenceKey: 'form-novo-agendamento',
    onSubmit: async (values) => {
      // Validações de formulário
      const formErrors = validateForm(values);
      if (Object.keys(formErrors).length > 0) {
        Object.values(formErrors).forEach(error => notifications.error('Erro de validação', error));
        return;
      }

      // Verificação de rate limiting
      const rateLimitKey = `user_${usuario!.id}_${new Date().toDateString()}`;
      if (!SecurityValidations.rateLimit(rateLimitKey, 10)) {
        notifications.error('Limite excedido', 'Muitas tentativas de agendamento hoje. Tente novamente amanhã.');
        return;
      }

      // Validação Zod primeiro
      try {
        const validatedData = agendamentoSchema.parse(values);
      } catch (error: any) {
        if (error.errors) {
          error.errors.forEach((err: any) => {
            notifications.error('Erro de validação', err.message);
          });
        }
        return;
      }

      // Sanitizar entrada do usuário
      const sanitizedValues = {
        ...values,
        observacoes: DataIntegrityValidations.sanitizeString(values.observacoes)
      };

      // Validações de negócio adicionais
      const businessErrors = validateBusinessRules(sanitizedValues);
      if (businessErrors.length > 0) {
        businessErrors.forEach(error => notifications.error('Erro de validação', error));
        return;
      }

      try {
        // Criar agendamento
        const novoAgendamento: Agendamento = {
          id: 0, // ID temporário - será substituído pelo Supabase
          espacoId: sanitizedValues.espacoId,
          usuarioId: usuario!.id,
          data: sanitizedValues.data,
          aulaInicio: sanitizedValues.aulaInicio,
          aulaFim: sanitizedValues.aulaFim,
          status: 'pendente',
          observacoes: sanitizedValues.observacoes,
          criadoEm: new Date().toISOString()
        };

        const success = await actions.addAgendamento(novoAgendamento);
        if (success) {
          notifications.agendamento.created();
          form.clearPersistence(); // Limpa o localStorage
          form.reset();
        } else {
          notifications.error('Erro', 'Falha ao salvar agendamento. Tente novamente.');
        }
      } catch (error) {
        notifications.error('Erro', 'Falha ao salvar agendamento. Tente novamente.');
      }
    }
  });

  const validateBusinessRules = (values: AgendamentoFormData): string[] => {
    const errors: string[] = [];

    // Verificar segurança dos dados de entrada
    const securityCheck = SecurityValidations.validateUserInput(values);
    if (!securityCheck.isValid) {
      errors.push(...securityCheck.errors);
    }

    // Validar usuário ativo
    const usuarioError = BusinessValidations.validateUsuarioAtivo(usuario!.id, usuarios);
    if (usuarioError) errors.push(usuarioError);

    // Validar disponibilidade do espaço
    const espacoError = BusinessValidations.validateEspacoDisponivel(values.espacoId, espacos);
    if (espacoError) errors.push(espacoError);

    // Validar data
    const dataError = BusinessValidations.validateDataAgendamento(values.data);
    if (dataError) errors.push(dataError);

    // Validar sequência de aulas
    const aulasError = BusinessValidations.validateAulasSequencia(values.aulaInicio, values.aulaFim);
    if (aulasError) errors.push(aulasError);

    // Validar horário comercial
    const horarioError = BusinessValidations.validateHorarioComercial(values.aulaInicio, values.aulaFim);
    if (horarioError) errors.push(horarioError);

    // Validar conflito com agendamentos fixos
    const conflitoFixoError = BusinessValidations.validateAgendamentoFixoConflict(
      {
        espacoId: values.espacoId,
        data: values.data,
        aulaInicio: values.aulaInicio,
        aulaFim: values.aulaFim
      },
      agendamentosFixos
    );
    if (conflitoFixoError) errors.push(conflitoFixoError);

    // Validar conflito com agendamentos existentes
    const conflitoError = BusinessValidations.validateAgendamentoConflict(
      {
        espacoId: values.espacoId,
        data: values.data,
        aulaInicio: values.aulaInicio,
        aulaFim: values.aulaFim
      },
      agendamentos
    );
    if (conflitoError) errors.push(conflitoError);

    return errors;
  };

  // Verificar se o horário está disponível para preview
  const isHorarioDisponivel = useMemo(() => {
    if (!form.values.espacoId || !form.values.data || !form.values.aulaInicio || !form.values.aulaFim) {
      return true; // Não mostrar erro até ter dados completos
    }

    return BusinessValidations.isHorarioDisponivel(
      form.values.espacoId,
      form.values.data,
      form.values.aulaInicio,
      form.values.aulaFim,
      agendamentos,
      agendamentosFixos
    );
  }, [form.values.espacoId, form.values.data, form.values.aulaInicio, form.values.aulaFim, agendamentos, agendamentosFixos]);

  // Obter conflitos para exibição
  const conflicts = useMemo(() => {
    if (!form.values.espacoId || !form.values.data || !form.values.aulaInicio || !form.values.aulaFim) {
      return { agendamentosConflitantes: [], agendamentosFixosConflitantes: [], hasConflicts: false };
    }

    return BusinessValidations.getAgendamentoConflicts(
      form.values,
      agendamentos,
      agendamentosFixos
    );
  }, [form.values, agendamentos, agendamentosFixos]);

  // Obter estatísticas para o PageHeader
  const pageStats = useMemo(() => {
    const hoje = new Date().toISOString().split('T')[0];
    const meusAgendamentosHoje = agendamentos.filter(a => 
      a.usuarioId === usuario?.id && a.data === hoje && a.status !== 'rejeitado'
    );

    return [
      {
        label: "Espaços Disponíveis",
        value: espacosAtivos.length,
      },
      {
        label: "Meus Agendamentos Hoje",
        value: meusAgendamentosHoje.length,
        icon: Calendar,
        color: "bg-chart-4"
      },
      {
        label: "Total de Agendamentos",
        value: agendamentos.filter(a => a.usuarioId === usuario?.id).length,
        icon: Clock,
        color: "bg-chart-5"
      }
    ];
  }, [espacosAtivos, agendamentos, usuario]);

  if (loading) return <LoadingSpinner message="Carregando..." />;

  if (!usuario) {
    return <ErrorState message="Usuário não autenticado" />;
  }

  if (!usuario.ativo) {
    return <ErrorState message="Sua conta está desativada. Entre em contato com o administrador." />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
       <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="section-title">Novo Agendamento</h1>
          <p className="subtle-text">Solicite um novo agendamento de espaço.</p>
        </div>
        <Button asChild className="elegant-button">
            <a href="/meus-agendamentos">
                Meus Agendamentos
            </a>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="enhanced-card">
          <CardContent className="refined-spacing">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Building2 className="w-6 h-6 icon-accent" />
              </div>
              <div className="metric-display">{espacosAtivos.length}</div>
            </div>
            <div className="space-y-1">
              <div className="card-title">Espaços Ativos</div>
              <div className="caption-text">Disponíveis para agendar</div>
            </div>
          </CardContent>
        </Card>
        <Card className="enhanced-card">
          <CardContent className="refined-spacing">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-chart-3/10 rounded-lg">
                <Calendar className="w-6 h-6 text-chart-3" />
              </div>
              <div className="metric-display">{pageStats[1].value}</div>
            </div>
            <div className="space-y-1">
              <div className="card-title">Agendamentos Hoje</div>
              <div className="caption-text">Feitos por você</div>
            </div>
          </CardContent>
        </Card>
        <Card className="enhanced-card">
          <CardContent className="refined-spacing">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-chart-2/10 rounded-lg">
                <ListChecks className="w-6 h-6 text-chart-2" />
              </div>
              <div className="metric-display">{pageStats[2].value}</div>
            </div>
            <div className="space-y-1">
              <div className="card-title">Meus Agendamentos</div>
              <div className="caption-text">Total de solicitações</div>
            </div>
          </CardContent>
        </Card>
         <Card className="enhanced-card border-status-info-border/50">
          <CardContent className="refined-spacing">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-status-info/10 rounded-lg">
                <Clock className="w-6 h-6 text-status-info" />
              </div>
              <div className="metric-display text-status-info">{AULAS_HORARIOS[form.values.aulaInicio as NumeroAula]?.inicio || '--:--'}</div>
            </div>
            <div className="space-y-1">
              <div className="card-title">Horário de Início</div>
              <div className="caption-text">Aula selecionada</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="enhanced-card">
          <CardHeader>
            <CardTitle>Detalhes da Solicitação</CardTitle>
            <CardDescription>Preencha os campos abaixo para solicitar o agendamento.</CardDescription>
          </CardHeader>
          <CardContent>
              <form onSubmit={form.handleSubmit} className="space-y-4">
              {/* Seleção de Espaço */}
                <div>
                  <Label htmlFor="espacoId">
                    Espaço
                  </Label>
                <Select
                    name="espacoId"
                    value={form.values.espacoId > 0 ? form.values.espacoId.toString() : ""}
                    onValueChange={(value) => form.setValue('espacoId', parseInt(value))}
                >
                    <SelectTrigger>
                    <SelectValue placeholder="Selecione o espaço desejado" />
                  </SelectTrigger>
                  <SelectContent>
                      {espacosAtivos.map(espaco => (
                      <SelectItem key={espaco.id} value={espaco.id.toString()}>
                          <div className="flex items-center gap-3">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <div className="font-semibold">{espaco.nome}</div>
                                <div className="text-xs text-muted-foreground">
                                Capacidade: {espaco.capacidade} pessoas
                                </div>
                            </div>
                          </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Data */}
                  <div>
                    <Label>
                      Data
                    </Label>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${
                            !form.values.data && "text-muted-foreground"
                          }`}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          <span className="truncate">
                            {form.values.data ? (
                              new Date(form.values.data + 'T12:00:00').toLocaleDateString('pt-BR')
                            ) : (
                              "Selecione uma data"
                            )}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={form.values.data ? new Date(form.values.data + 'T12:00:00') : undefined}
                          onSelect={(date) => {
                            if (date) {
                              const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                              form.setValue('data', localDate.toISOString().split('T')[0]);
                              setCalendarOpen(false);
                            }
                          }}
                          fromDate={new Date()}
                          toDate={new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
              </div>

                  {/* Aula Início */}
                  <div>
                    <Label htmlFor="aulaInicio">
                      Aula de Início
                    </Label>
                  <Select 
                    name="aulaInicio"
                    value={form.values.aulaInicio.toString()} 
                    onValueChange={(value) => form.setValue('aulaInicio', parseInt(value) as NumeroAula)}
                  >
                      <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {getAulaOptions().map(aula => (
                        <SelectItem key={aula.value} value={aula.value.toString()}>
                          {aula.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                  {/* Aula Fim */}
                  <div>
                    <Label htmlFor="aulaFim">
                      Aula de Fim
                    </Label>
                  <Select 
                    name="aulaFim"
                    value={form.values.aulaFim.toString()} 
                    onValueChange={(value) => form.setValue('aulaFim', parseInt(value) as NumeroAula)}
                  >
                      <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {getAulaOptions().map(aula => (
                        <SelectItem key={aula.value} value={aula.value.toString()}>
                          {aula.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Observações */}
                <div>
                <Label htmlFor="observacoes">Observações (Opcional)</Label>
                <Textarea
                  id="observacoes"
                    placeholder="Ex: Reunião do projeto X, apresentação para o cliente Y..."
                  value={form.values.observacoes}
                  onChange={(e) => form.setValue('observacoes', e.target.value)}
                    maxLength={500}
                    className="min-h-[80px]"
                />
                  <p className="text-xs text-muted-foreground text-right mt-1">
                    {form.values.observacoes.length} / 500
                  </p>
              </div>

              <Button 
                type="submit" 
                  className="w-full elegant-button" 
                  disabled={!isHorarioDisponivel || !form.values.espacoId}
              >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Solicitar Agendamento
              </Button>
            </form>
          </CardContent>
        </Card>
        </div>

        <div className="space-y-4">
          {form.values.espacoId && form.values.data ? (
            <HorarioGrid
              espacoId={form.values.espacoId}
              data={form.values.data}
              agendamentos={agendamentos}
              agendamentosFixos={agendamentosFixos}
            />
          ) : (
             <Card className="enhanced-card">
                <CardContent className="p-6 text-center">
                  <Info className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium">Selecione um Espaço e uma Data</p>
                  <p className="subtle-text">A grade de horários disponíveis será exibida aqui.</p>
                </CardContent>
             </Card>
          )}

          {conflicts.hasConflicts && (
            <Card className="enhanced-card border-status-error-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-status-error">
                  <AlertTriangle className="h-5 w-5" />
                  Conflito de Horário
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {conflicts.agendamentosFixosConflitantes.map(af => (
                  <div key={`fixo-${af.id}`} className="p-2.5 bg-status-error-subtle rounded-md">
                    <div className="text-sm font-semibold text-status-error-foreground">
                      Conflito com Horário Fixo
                    </div>
                    <div className="text-xs text-status-error-foreground/80">
                      {formatAulas(af.aulaInicio as NumeroAula, af.aulaFim as NumeroAula)} está reservado.
                    </div>
                </div>
                ))}
                
                {conflicts.agendamentosConflitantes.map(a => {
                  const usuarioConflito = usuarios.find(u => u.id === a.usuarioId);
                  const isPendente = a.status === 'pendente';
                  const cardClass = isPendente ? 'bg-status-warning-subtle' : 'bg-status-error-subtle';
                  const textClass = isPendente ? 'text-status-warning-foreground' : 'text-status-error-foreground';
                  const title = isPendente ? 'Horário com status pendente' : 'Horário já aprovado';

                  return (
                    <div key={`ag-${a.id}`} className={`p-2.5 ${cardClass} rounded-md`}>
                      <div className={`text-sm font-semibold ${textClass}`}>
                        {title}
                      </div>
                      <div className={`text-xs ${textClass}/80`}>
                        Solicitado por {usuarioConflito?.nome || 'desconhecido'} às {formatAulas(a.aulaInicio as NumeroAula, a.aulaFim as NumeroAula)}.
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {form.values.espacoId > 0 && (
            (() => {
              const espacoSelecionado = espacos.find(e => e.id === form.values.espacoId);
              return espacoSelecionado ? (
                <Card className="enhanced-card">
                  <CardHeader>
                        <CardTitle>
                          Informações do Espaço
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center subtle-text">
                      <span>Capacidade</span>
                      <span className="font-semibold text-foreground">{espacoSelecionado.capacidade} pessoas</span>
                  </div>
                    {espacoSelecionado.equipamentos && espacoSelecionado.equipamentos.length > 0 && (
                      <div className="space-y-2">
                        <span className="subtle-text">Equipamentos</span>
                        <div className="flex flex-wrap gap-2">
                          {espacoSelecionado.equipamentos.map((eq, index) => (
                            <Badge key={index} variant="secondary" className="font-normal">
                              {eq}
                            </Badge>
                          ))}
                        </div>
                  </div>
                )}
              </CardContent>
                </Card>
              ) : null;
            })()
          )}
        </div>
      </div>
    </div>
  );
};

export default NovoAgendamento;
