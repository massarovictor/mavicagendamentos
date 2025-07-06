import { AULAS_HORARIOS, NumeroAula } from '@/types';

/**
 * Cria um objeto Date a partir de uma string 'YYYY-MM-DD' no fuso horário local,
 * evitando a conversão automática para UTC.
 * @param dateString A data no formato 'YYYY-MM-DD'.
 * @returns Um objeto Date local ou null se a string for inválida.
 */
const createLocalDate = (dateString: string): Date | null => {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return null;
  }
  const parts = dateString.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Meses em JS são 0-indexados
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
    return date;
  }
  return null;
};

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
  const localDate = createLocalDate(data);

  if (!localDate) {
    return "Data inválida";
  }

  return localDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formata data e hora para exibição
 * @param data - Data no formato ISO
 * @param aula - Número da aula
 * @returns String formatada como "dd/mm/aaaa - 1ª aula (07:20 - 08:10)"
 */
export function formatDateTime(data: string, aula: NumeroAula): string {
  const localDate = createLocalDate(data);
  if (!localDate) return "Data/hora inválida";
  
  const dataFormatada = localDate.toLocaleDateString('pt-BR');
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