import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, AlertTriangle, Check, X, CheckCircle } from 'lucide-react';
import { AULAS_HORARIOS, NumeroAula, Agendamento, AgendamentoFixo } from '@/types';
import { BusinessValidations } from '@/utils/validations';

interface HorarioGridProps {
  espacoId: number;
  data: string;
  agendamentos: Agendamento[];
  agendamentosFixos: AgendamentoFixo[];
  className?: string;
}

export const HorarioGrid: React.FC<HorarioGridProps> = ({
  espacoId,
  data,
  agendamentos,
  agendamentosFixos,
  className = ''
}) => {
  const aulas = Object.keys(AULAS_HORARIOS).map(Number) as NumeroAula[];

  const getHorarioStatus = (aula: NumeroAula) => {
    const isDisponivel = BusinessValidations.isHorarioDisponivel(
      espacoId,
      data,
      aula,
      aula,
      agendamentos,
      agendamentosFixos
    );

    const conflicts = BusinessValidations.getAgendamentoConflicts(
      { espacoId, data, aulaInicio: aula, aulaFim: aula },
      agendamentos,
      agendamentosFixos
    );

    const agendamentosAula = agendamentos.filter(a => 
      a.espacoId === espacoId &&
      a.data === data &&
      a.aulaInicio <= aula &&
      a.aulaFim >= aula &&
      a.status !== 'rejeitado'
    );

    const agendamentosFixosAula = conflicts.agendamentosFixosConflitantes.filter(af =>
      af.aulaInicio <= aula && af.aulaFim >= aula
    );

    // Prioridade: Fixo > Aprovado > Pendente > Disponível
    if (agendamentosFixosAula.length > 0) {
      return {
        status: 'fixo' as const,
        color: 'bg-red-100 text-red-900 border-red-300',
        icon: X,
        label: 'Fixo',
        agendamentos: agendamentosFixosAula.map(af => ({
          id: af.id,
          tipo: 'fixo' as const,
          observacoes: af.observacoes
        }))
      };
    }

    const aprovados = agendamentosAula.filter(a => a.status === 'aprovado');
    if (aprovados.length > 0) {
      return {
        status: 'aprovado' as const,
        color: 'bg-green-100 text-green-900 border-green-300',
        icon: CheckCircle,
        label: 'Aprovado',
        agendamentos: aprovados.map(a => ({
          id: a.id,
          tipo: 'agendamento' as const,
          observacoes: a.observacoes
        }))
      };
    }

    const pendentes = agendamentosAula.filter(a => a.status === 'pendente');
    if (pendentes.length > 0) {
      return {
        status: 'conflito' as const,
        color: 'bg-amber-100 text-amber-900 border-amber-300',
        icon: AlertTriangle,
        label: pendentes.length > 1 ? `${pendentes.length} conflitos` : 'Pendente',
        agendamentos: pendentes.map(a => ({
          id: a.id,
          tipo: 'agendamento' as const,
          observacoes: a.observacoes
        }))
      };
    }

    return {
      status: 'disponivel' as const,
      color: 'bg-chart-4 text-white border-chart-4',
      icon: Check,
      label: 'Livre',
      agendamentos: []
    };
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          Horários
        </CardTitle>
        <CardDescription className="text-sm">
          {new Date(data).toLocaleDateString('pt-BR')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {aulas.map(aula => {
            const horario = AULAS_HORARIOS[aula];
            const status = getHorarioStatus(aula);
            const Icon = status.icon;

            return (
              <div
                key={aula}
                className={`p-2 rounded border bg-background transition-all hover:shadow-sm ${
                  status.status === 'conflito' ? 'hover:border-amber-300' : ''
                }`}
              >
                <div className="space-y-1">
                  <div className="text-center">
                    <div className="font-medium text-gray-900 text-sm">
                      {aula}ª
                    </div>
                    <div className="text-xs text-gray-600">
                      {horario.inicio}
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Badge 
                      variant="outline" 
                      className={`${status.color} flex items-center justify-center text-xs px-1 py-0 min-w-[60px]`}
                    >
                      <Icon className="h-3 w-3 !opacity-100 mr-1" />
                      <span className="truncate text-[10px]">{status.label}</span>
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legenda */}
        <div className="mt-3 pt-3 border-t">
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-1 bg-background w-fit px-2 rounded-lg">
              <Check className="w-3 h-3 text-green-500 !opacity-100" />
              <span className="text-secondary truncate">Livre</span>
            </div>
            <div className="flex items-center gap-1 bg-background w-fit px-2 rounded-lg">
              <AlertTriangle className="w-3 h-3 text-amber-600 !opacity-100" />
              <span className="text-secondary truncate">Conflito</span>
            </div>
            <div className="flex items-center gap-1 bg-background w-fit px-2 rounded-lg">
              <CheckCircle className="w-3 h-3 text-green-600 !opacity-100" />
              <span className="text-secondary truncate">Aprovado</span>
            </div>
            <div className="flex items-center gap-1 bg-background w-fit px-2 rounded-lg">
              <X className="w-3 h-3 text-red-600 !opacity-100" />
              <span className="text-secondary truncate">Fixo</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 