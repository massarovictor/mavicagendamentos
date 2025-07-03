import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, AlertTriangle, Check, X } from 'lucide-react';
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
        color: 'bg-red-100 text-red-800 border-red-200',
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
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: Check,
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
        color: 'bg-amber-100 text-amber-800 border-amber-200',
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
      color: 'bg-gray-100 text-gray-600 border-gray-200',
      icon: Clock,
      label: 'Disponível',
      agendamentos: []
    };
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Grade de Horários
        </CardTitle>
        <CardDescription>
          {new Date(data).toLocaleDateString('pt-BR')} - Visualização por aula
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {aulas.map(aula => {
            const horario = AULAS_HORARIOS[aula];
            const status = getHorarioStatus(aula);
            const Icon = status.icon;

            return (
              <div
                key={aula}
                className={`p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                  status.status === 'conflito' ? 'hover:border-amber-300' : ''
                }`}
              >
                <div className="space-y-2">
                  <div className="text-center">
                    <div className="font-medium text-gray-900">
                      {aula}ª aula
                    </div>
                    <div className="text-xs text-gray-600">
                      {horario.inicio} - {horario.fim}
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Badge 
                      variant="outline" 
                      className={`${status.color} flex items-center gap-1`}
                    >
                      <Icon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>

                  {status.agendamentos.length > 0 && (
                    <div className="text-xs text-gray-500 text-center">
                      {status.agendamentos.length} item(s)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legenda */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Legenda:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gray-100 border border-gray-200"></div>
              <span className="text-gray-600">Disponível</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200"></div>
              <span className="text-gray-600">Conflito</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-200"></div>
              <span className="text-gray-600">Aprovado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div>
              <span className="text-gray-600">Agend. Fixo</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 