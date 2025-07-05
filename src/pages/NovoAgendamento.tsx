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
import { Calendar, Clock, Building2, User, AlertTriangle, CheckCircle, Info, Plus } from 'lucide-react';
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
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader 
        title="Novo Agendamento"
        subtitle="Solicite um novo agendamento de espaço"
        icon={Plus}
        stats={pageStats}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Formulário Principal */}
        <div>
          <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
              Novo Agendamento
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
              <form onSubmit={form.handleSubmit} className="space-y-4">
              {/* Seleção de Espaço */}
                <div className="space-y-1">
                  <Label htmlFor="espacoId" className="text-sm font-medium">
                    Espaço *
                  </Label>
                <Select
                    value={form.values.espacoId.toString()} 
                  onValueChange={(value) => form.setValue('espacoId', parseInt(value))}
                >
                    <SelectTrigger className="h-10 bg-background border border-border">
                    <SelectValue placeholder="Selecione o espaço">
                      {form.values.espacoId ? 
                        espacosAtivos.find(e => e.id === form.values.espacoId)?.nome || "Selecione o espaço"
                        : "Selecione o espaço"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                      {espacosAtivos.map(espaco => (
                      <SelectItem key={espaco.id} value={espaco.id.toString()}>
                          <div className="w-full">
                            <div className="font-medium text-left text-foreground">{espaco.nome}</div>
                            <div className="text-xs text-foreground text-left">
                              {espaco.capacidade} pessoas
                            </div>
                          </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

                                {/* Data e Horário em Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Data */}
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">
                      Data *
                    </Label>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`h-10 w-full justify-start text-left font-normal bg-background border border-border ${
                            !form.values.data && "text-muted-foreground"
                          }`}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          <span className="truncate text-sm">
                            {form.values.data ? (
                              new Date(form.values.data + 'T12:00:00').toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })
                            ) : (
                              "Selecionar"
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
                  <div className="space-y-1">
                    <Label htmlFor="aulaInicio" className="text-sm font-medium">
                      Início *
                    </Label>
                  <Select 
                    value={form.values.aulaInicio.toString()} 
                    onValueChange={(value) => form.setValue('aulaInicio', parseInt(value) as NumeroAula)}
                  >
                      <SelectTrigger className="h-10 bg-background border border-border">
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
                  <div className="space-y-1">
                    <Label htmlFor="aulaFim" className="text-sm font-medium">
                      Fim *
                    </Label>
                  <Select 
                    value={form.values.aulaFim.toString()} 
                    onValueChange={(value) => form.setValue('aulaFim', parseInt(value) as NumeroAula)}
                  >
                      <SelectTrigger className="h-10 bg-background border border-border">
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
                <div className="space-y-1">
                <Label htmlFor="observacoes" className="text-sm font-medium">Observações</Label>
                <Textarea
                  id="observacoes"
                    placeholder="Objetivo do agendamento..."
                  value={form.values.observacoes}
                  onChange={(e) => form.setValue('observacoes', e.target.value)}
                    maxLength={500}
                    className="min-h-[60px] resize-none text-sm"
                />
                  <div className="text-xs text-muted-foreground">
                    {form.values.observacoes.length}/500
                  </div>
              </div>

              <Button 
                type="submit" 
                  className="w-full h-10" 
                  disabled={!isHorarioDisponivel}
              >
                  <Calendar className="h-4 w-4 mr-2" />
                  Solicitar
              </Button>
            </form>
          </CardContent>
        </Card>
        </div>

        {/* Sidebar com Informações */}
        <div className="space-y-3">

          {/* Grade de Horários */}
          {form.values.espacoId && form.values.data && (
            <HorarioGrid
              espacoId={form.values.espacoId}
              data={form.values.data}
              agendamentos={agendamentos}
              agendamentosFixos={agendamentosFixos}
            />
          )}

          {/* Conflitos Detectados */}
          {conflicts.hasConflicts && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  Conflitos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {conflicts.agendamentosFixosConflitantes.map(af => (
                  <div key={af.id} className="p-2 bg-red-50 rounded border border-red-200">
                    <div className="text-sm font-medium text-red-800">
                      Fixo
                    </div>
                    <div className="text-xs text-red-600">
                      {formatAulas(af.aulaInicio as NumeroAula, af.aulaFim as NumeroAula)}
                    </div>
                </div>
                ))}
                
                {conflicts.agendamentosConflitantes.map(a => {
                  const usuarioConflito = usuarios.find(u => u.id === a.usuarioId);
                  return (
                    <div key={a.id} className="p-2 bg-amber-50 rounded border border-amber-200">
                      <div className="text-sm font-medium text-amber-800">
                        {a.status === 'aprovado' ? 'Aprovado' : 'Pendente'}
                  </div>
                      <div className="text-xs text-amber-600">
                        {usuarioConflito?.nome} - {formatAulas(a.aulaInicio as NumeroAula, a.aulaFim as NumeroAula)}
                </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Informações do Espaço Selecionado */}
          {form.values.espacoId && (
            (() => {
              const espacoSelecionado = espacos.find(e => e.id === form.values.espacoId);
              return espacoSelecionado ? (
                <Card>
              <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Info className="h-4 w-4" />
                      Espaço
                </CardTitle>
              </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    <div>
                      <div className="text-sm font-medium">{espacoSelecionado.nome}</div>
                      {espacoSelecionado.descricao && (
                        <div className="text-xs text-muted-foreground">{espacoSelecionado.descricao}</div>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Capacidade:</span>
                      <Badge variant="outline" className="text-xs">{espacoSelecionado.capacidade} pessoas</Badge>
                  </div>
                    {espacoSelecionado.equipamentos && espacoSelecionado.equipamentos.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Equipamentos:</div>
                        <div className="flex flex-wrap gap-1">
                          {espacoSelecionado.equipamentos.slice(0, 3).map((eq, index) => (
                            <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                              {eq}
                            </Badge>
                          ))}
                          {espacoSelecionado.equipamentos.length > 3 && (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              +{espacoSelecionado.equipamentos.length - 3}
                            </Badge>
                          )}
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
