import { formatDate, formatAulas } from '@/utils/format';
import { NumeroAula } from '@/types';

export interface EmailNotificationData {
  usuarioNome: string;
  usuarioEmail: string;
  gestorNome: string;
  gestorEmail: string;
  espacoNome: string;
  data: string;
  aulaInicio: NumeroAula;
  aulaFim: NumeroAula;
  observacoes?: string;
}

export class EmailTemplates {
  /**
   * Template simples para notificar gestor sobre nova solicitação
   */
  static novaSolicitacao(data: EmailNotificationData): { subject: string; message: string } {
    const subject = `Nova Solicitação: ${data.espacoNome}`;
    
    const message = `
Olá ${data.gestorNome},

Você tem uma nova solicitação de agendamento para aprovar:

📍 Espaço: ${data.espacoNome}
👤 Solicitante: ${data.usuarioNome} (${data.usuarioEmail})
📅 Data: ${formatDate(data.data)}
🕐 Horário: ${formatAulas(data.aulaInicio, data.aulaFim)}
${data.observacoes ? `💬 Observações: ${data.observacoes}` : ''}

Acesse o sistema para aprovar ou rejeitar esta solicitação.

Sistema Mavic
    `.trim();
    
    return { subject, message };
  }

  /**
   * Template simples para notificar usuário sobre aprovação
   */
  static agendamentoAprovado(data: EmailNotificationData): { subject: string; message: string } {
    const subject = `✅ Agendamento Aprovado: ${data.espacoNome}`;
    
    const message = `
Olá ${data.usuarioNome},

Boa notícia! Seu agendamento foi APROVADO:

📍 Espaço: ${data.espacoNome}
📅 Data: ${formatDate(data.data)}
🕐 Horário: ${formatAulas(data.aulaInicio, data.aulaFim)}
${data.observacoes ? `💬 Suas observações: ${data.observacoes}` : ''}

Anote esta data em sua agenda e compareça no horário marcado.

Sistema Mavic
    `.trim();
    
    return { subject, message };
  }

  /**
   * Template simples para notificar usuário sobre rejeição
   */
  static agendamentoRejeitado(data: EmailNotificationData): { subject: string; message: string } {
    const subject = `❌ Agendamento Não Aprovado: ${data.espacoNome}`;
    
    const message = `
Olá ${data.usuarioNome},

Infelizmente, seu agendamento NÃO FOI APROVADO:

📍 Espaço: ${data.espacoNome}
📅 Data: ${formatDate(data.data)}
🕐 Horário: ${formatAulas(data.aulaInicio, data.aulaFim)}
${data.observacoes ? `💬 Suas observações: ${data.observacoes}` : ''}

Possíveis motivos:
- Conflito com outro agendamento
- Horário já ocupado
- Indisponibilidade do espaço

Você pode tentar agendar outros horários disponíveis.

Sistema Mavic
    `.trim();
    
    return { subject, message };
  }
} 