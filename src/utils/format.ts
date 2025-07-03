import { AULAS_HORARIOS, NumeroAula } from '@/types';

/**
 * Formata um intervalo de aulas para exibição
 * @param aulaInicio - Número da aula inicial (1-9)
 * @param aulaFim - Número da aula final (1-9)
 * @returns String formatada como "1ª - 3ª aulas (07:20 - 10:10)"
 */
export function formatAulas(aulaInicio: NumeroAula, aulaFim: NumeroAula): string {
  const horarioInicio = AULAS_HORARIOS[aulaInicio];
  const horarioFim = AULAS_HORARIOS[aulaFim];
  
  if (!horarioInicio || !horarioFim) {
    return `${aulaInicio}ª - ${aulaFim}ª aulas`;
  }

  const inicioFormatado = aulaInicio === aulaFim ? `${aulaInicio}ª aula` : `${aulaInicio}ª - ${aulaFim}ª aulas`;
  const horarioFormatado = `${horarioInicio.inicio} - ${horarioFim.fim}`;
  
  return `${inicioFormatado} (${horarioFormatado})`;
}

/**
 * Formata uma data para o formato brasileiro
 * @param data - Data no formato ISO
 * @returns String formatada como "dd/mm/aaaa"
 */
export function formatDate(data: string): string {
  return new Date(data).toLocaleDateString('pt-BR');
}

/**
 * Formata data e hora para exibição
 * @param data - Data no formato ISO
 * @param aula - Número da aula
 * @returns String formatada como "dd/mm/aaaa - 1ª aula (07:20 - 08:10)"
 */
export function formatDateTime(data: string, aula: NumeroAula): string {
  const dataFormatada = formatDate(data);
  const horario = AULAS_HORARIOS[aula];
  
  if (!horario) {
    return `${dataFormatada} - ${aula}ª aula`;
  }
  
  return `${dataFormatada} - ${aula}ª aula (${horario.inicio} - ${horario.fim})`;
}

/**
 * Obtém apenas o horário de uma aula
 * @param aula - Número da aula
 * @returns String formatada como "07:20 - 08:10"
 */
export function getAulaHorario(aula: NumeroAula): string {
  const horario = AULAS_HORARIOS[aula];
  return horario ? `${horario.inicio} - ${horario.fim}` : '';
} 