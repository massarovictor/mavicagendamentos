import { emailService } from './emailService';
import { EmailTemplates, EmailNotificationData } from './emailTemplates';
import { Agendamento, Usuario, Espaco, NumeroAula } from '@/types';
import { notificationLog, debug } from '@/utils/logger';

export class NotificationService {
  /**
   * Notifica o gestor sobre uma nova solicitação de agendamento
   */
  static async notificarGestorNovaSolicitacao(
    agendamento: Agendamento,
    usuario: Usuario,
    espaco: Espaco,
    gestor: Usuario
  ): Promise<boolean> {
    try {
      const emailData: EmailNotificationData = {
        usuarioNome: usuario.nome,
        usuarioEmail: usuario.email,
        gestorNome: gestor.nome,
        gestorEmail: gestor.email,
        espacoNome: espaco.nome,
        data: agendamento.data,
        aulaInicio: agendamento.aulaInicio as NumeroAula,
        aulaFim: agendamento.aulaFim as NumeroAula,
        observacoes: agendamento.observacoes
      };

      const { subject, message } = EmailTemplates.novaSolicitacao(emailData);
      
      const sucesso = await emailService.sendSimpleEmail(gestor.email, subject, message, 'nova_solicitacao');
      
      if (sucesso) {
        notificationLog('📧 Email enviado para gestor');
      } else {
        console.error(`❌ Falha ao enviar notificação para gestor: ${gestor.email}`);
      }
      
      return sucesso;
    } catch (error) {
      console.error('Erro ao notificar gestor sobre nova solicitação:', error);
      return false;
    }
  }

  /**
   * Notifica o usuário sobre aprovação do agendamento
   */
  static async notificarUsuarioAprovacao(
    agendamento: Agendamento,
    usuario: Usuario,
    espaco: Espaco,
    gestor: Usuario
  ): Promise<boolean> {
    try {
      const emailData: EmailNotificationData = {
        usuarioNome: usuario.nome,
        usuarioEmail: usuario.email,
        gestorNome: gestor.nome,
        gestorEmail: gestor.email,
        espacoNome: espaco.nome,
        data: agendamento.data,
        aulaInicio: agendamento.aulaInicio as NumeroAula,
        aulaFim: agendamento.aulaFim as NumeroAula,
        observacoes: agendamento.observacoes
      };

      const { subject, message } = EmailTemplates.agendamentoAprovado(emailData);
      
      const sucesso = await emailService.sendSimpleEmail(usuario.email, subject, message, 'aprovacao');
      
      if (sucesso) {
        notificationLog('Notificação de aprovação enviada');
      } else {
        console.error(`❌ Falha ao enviar notificação de aprovação para: ${usuario.email}`);
      }
      
      return sucesso;
    } catch (error) {
      console.error('Erro ao notificar usuário sobre aprovação:', error);
      return false;
    }
  }

  /**
   * Notifica o usuário sobre rejeição do agendamento
   */
  static async notificarUsuarioRejeicao(
    agendamento: Agendamento,
    usuario: Usuario,
    espaco: Espaco,
    gestor: Usuario
  ): Promise<boolean> {
    try {
      const emailData: EmailNotificationData = {
        usuarioNome: usuario.nome,
        usuarioEmail: usuario.email,
        gestorNome: gestor.nome,
        gestorEmail: gestor.email,
        espacoNome: espaco.nome,
        data: agendamento.data,
        aulaInicio: agendamento.aulaInicio as NumeroAula,
        aulaFim: agendamento.aulaFim as NumeroAula,
        observacoes: agendamento.observacoes
      };

      const { subject, message } = EmailTemplates.agendamentoRejeitado(emailData);
      
      const sucesso = await emailService.sendSimpleEmail(usuario.email, subject, message, 'rejeicao');
      
      if (sucesso) {
        notificationLog('Notificação de rejeição enviada');
      } else {
        console.error(`❌ Falha ao enviar notificação de rejeição para: ${usuario.email}`);
      }
      
      return sucesso;
    } catch (error) {
      console.error('Erro ao notificar usuário sobre rejeição:', error);
      return false;
    }
  }

  /**
   * SOLUÇÃO DEFINITIVA: Encontra APENAS os gestores responsáveis por um espaço
   * REGRA CLARA: Administradores NÃO recebem notificações como gestores
   */
  static findGestoresDoEspaco(espacoId: number, usuarios: Usuario[]): Usuario[] {
    // IMPORTANTE: Filtrar APENAS gestores (tipo === 'gestor')
    // Administradores têm poder de aprovar tudo, mas NÃO devem receber emails
    const gestores = usuarios.filter(usuario => 
      usuario.tipo === 'gestor' && // APENAS gestores
      usuario.ativo === true && // APENAS ativos
      usuario.espacos?.includes(espacoId) // APENAS do espaço específico
    );

    // Log apenas em desenvolvimento, sem dados sensíveis
    debug('Buscando gestores para espaço', { gestoresEncontrados: gestores.length });

    return gestores;
  }

  /**
   * Notifica todos os gestores de um espaço sobre nova solicitação
   * NÃO notifica administradores
   */
  static async notificarTodosGestores(
    agendamento: Agendamento,
    usuario: Usuario,
    espaco: Espaco,
    usuarios: Usuario[]
  ): Promise<boolean> {
    notificationLog('🚀 Iniciando envio de notificações por email');
    
    // Usar a função definitiva que exclui admins
    const gestores = this.findGestoresDoEspaco(agendamento.espacoId, usuarios);
    
    if (gestores.length === 0) {
      debug('Nenhum gestor encontrado para espaço');
      return false;
    }

    debug('Enviando notificações');
    
    const resultados = await Promise.all(
      gestores.map(gestor => 
        this.notificarGestorNovaSolicitacao(agendamento, usuario, espaco, gestor)
      )
    );

    const sucessos = resultados.filter(Boolean).length;
    const falhas = resultados.length - sucessos;

    notificationLog('✅ Notificações enviadas com sucesso!');
    
    return sucessos > 0; // Retorna true se pelo menos uma notificação foi enviada
  }

  /**
   * Testa a conectividade do serviço de email
   */
  static async testarConexao(): Promise<boolean> {
    return await emailService.verifyConnection();
  }
} 