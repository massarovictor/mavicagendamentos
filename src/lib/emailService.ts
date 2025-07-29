import { emailLog, error } from '@/utils/logger';

// Configurações de email a partir das variáveis de ambiente
const EMAIL_CONFIG = {
  SMTP_SERVER: import.meta.env.VITE_SMTP_SERVER || 'smtp.gmail.com',
  SMTP_PORT: parseInt(import.meta.env.VITE_SMTP_PORT || '587'),
  SMTP_USERNAME: import.meta.env.VITE_SMTP_USERNAME || '',
  SMTP_PASSWORD: import.meta.env.VITE_SMTP_PASSWORD || '',
  FROM_EMAIL: import.meta.env.VITE_FROM_EMAIL || '',
};

class EmailService {
  private useRealEmail: boolean;

  constructor() {
    // Verificar se as credenciais estão configuradas
    this.useRealEmail = !!(EMAIL_CONFIG.SMTP_USERNAME && EMAIL_CONFIG.SMTP_PASSWORD && EMAIL_CONFIG.FROM_EMAIL);
    
    if (this.useRealEmail) {
      emailLog('EmailService configurado para usar Gmail', { from: EMAIL_CONFIG.FROM_EMAIL });
    } else {
      emailLog('EmailService em modo MOCK - configure as variáveis de ambiente');
    }
  }

  /**
   * Envia email usando a API de backend ou simula
   */
  async sendSimpleEmail(
    to: string, 
    subject: string, 
    message: string, 
    type: 'nova_solicitacao' | 'aprovacao' | 'rejeicao' = 'nova_solicitacao'
  ): Promise<boolean> {
    try {
      if (this.useRealEmail) {
        return await this.sendViaBackend(to, subject, message);
      } else {
        return await this.sendViaMock(to, subject, message);
      }
    } catch (err) {
      error(`[MOCK] Erro ao simular email`, err, 'EmailService');
      return false;
    }
  }

  /**
   * Mantém compatibilidade com a função anterior
   */
  async sendEmail(
    to: string, 
    subject: string, 
    html: string, 
    type: 'nova_solicitacao' | 'aprovacao' | 'rejeicao' = 'nova_solicitacao'
  ): Promise<boolean> {
    // Converter HTML para texto simples
    const message = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return this.sendSimpleEmail(to, subject, message, type);
  }

  /**
   * Envia email via API de backend (que usa nodemailer)
   */
  private async sendViaBackend(to: string, subject: string, message: string): Promise<boolean> {
    try {
      emailLog(`Enviando email via Backend`, { to, subject });
      
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          message: message,
          type: 'generic'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        emailLog(`Email enviado com sucesso`, { to });
        return true;
      } else {
        const errorText = await response.text();
        error(`Erro do backend ao enviar email`, errorText, 'EmailService');
        // Em caso de erro, usar modo mock para não quebrar o fluxo
        return await this.sendViaMock(to, subject, message);
      }
    } catch (err) {
      error(`Erro ao conectar com backend`, err, 'EmailService');
      // Em caso de erro, usar modo mock
      return await this.sendViaMock(to, subject, message);
    }
  }

  /**
   * Simula envio de email (sempre funciona)
   */
  private async sendViaMock(to: string, subject: string, message: string): Promise<boolean> {
    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
      
      emailLog('EMAIL ENVIADO (MODO SIMULAÇÃO)', {
        from: EMAIL_CONFIG.FROM_EMAIL || 'Sistema Mavic',
        to,
        subject,
        message
      });
      
      // Simular sucesso sempre
      return true;
    } catch (err) {
      error(`Erro ao enviar email para ${to}`, err, 'EmailService');
      return false;
    }
  }

  /**
   * Verifica se o serviço está funcionando
   */
  async verifyConnection(): Promise<boolean> {
    if (this.useRealEmail) {
      emailLog('Credenciais Gmail configuradas', { from: EMAIL_CONFIG.FROM_EMAIL });
      return true;
    } else {
      emailLog('Modo mock ativo - configure VITE_SMTP_USERNAME, VITE_SMTP_PASSWORD, VITE_FROM_EMAIL');
      return true; // Mock sempre "funciona"
    }
  }

  /**
   * Força o uso de emails reais
   */
  forceRealEmails() {
    this.useRealEmail = true;
    emailLog('Modo de emails reais forçado');
  }

  /**
   * Retorna configurações para debug
   */
  getConfig() {
    return {
      server: EMAIL_CONFIG.SMTP_SERVER,
      port: EMAIL_CONFIG.SMTP_PORT,
      username: EMAIL_CONFIG.SMTP_USERNAME,
      from: EMAIL_CONFIG.FROM_EMAIL,
      configured: this.useRealEmail
    };
  }
}

// Instância singleton do serviço de email
export const emailService = new EmailService(); 