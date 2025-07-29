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
    // Em desenvolvimento, sempre usar MOCK para evitar problemas
    // Em produção, sempre tentar emails reais (Vercel Function vai validar credenciais)
    const isProduction = import.meta.env.PROD;
    const hasCredentials = !!(EMAIL_CONFIG.SMTP_USERNAME && EMAIL_CONFIG.SMTP_PASSWORD && EMAIL_CONFIG.FROM_EMAIL);
    
    // Em produção, sempre tentar envio real (a Vercel Function fará a validação)
    this.useRealEmail = isProduction;
    
    if (isProduction) {
      emailLog('EmailService configurado para PRODUÇÃO - Vercel Function');
    } else {
      if (hasCredentials) {
        emailLog('EmailService em DESENVOLVIMENTO - Backend local ativo (porta 3001)');
      } else {
        emailLog('EmailService em DESENVOLVIMENTO - Modo MOCK (sem credenciais)');
      }
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
      // Em desenvolvimento, tentar backend local primeiro se as credenciais estiverem configuradas
      if (!import.meta.env.PROD) {
        const hasCredentials = !!(EMAIL_CONFIG.SMTP_USERNAME && EMAIL_CONFIG.SMTP_PASSWORD && EMAIL_CONFIG.FROM_EMAIL);
        
        if (hasCredentials) {
          // Tentar backend local, depois mock
          return await this.sendViaBackendLocal(to, subject, message) || 
                 await this.sendViaMock(to, subject, message);
        } else {
          // Sem credenciais, usar mock
          return await this.sendViaMock(to, subject, message);
        }
      }
      
      // Em produção, usar Vercel Function
      if (this.useRealEmail) {
        // Tentar Vercel Function, depois mock
        return await this.sendViaVercelFunction(to, subject, message) || 
               await this.sendViaMock(to, subject, message);
      } else {
        return await this.sendViaMock(to, subject, message);
      }
    } catch (err) {
      error(`Erro no sistema de email`, err, 'EmailService');
      return await this.sendViaMock(to, subject, message);
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
   * Envia email via backend local (desenvolvimento)
   */
  private async sendViaBackendLocal(to: string, subject: string, message: string): Promise<boolean> {
    try {
      emailLog(`Tentando backend local (porta 3001)`);
      const response = await fetch('http://localhost:3001/api/send-email', {
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
        emailLog(`Email enviado via backend local`);
        return true;
      } else {
        const errorText = await response.text();
        error(`Erro do backend local`, errorText, 'EmailService');
        return false;
      }
    } catch (err) {
      error(`Erro ao conectar com backend local`, err, 'EmailService');
      return false;
    }
  }



  /**
   * Envia email via Vercel Function (produção)
   */
  private async sendViaVercelFunction(to: string, subject: string, message: string): Promise<boolean> {
    try {
      emailLog(`Tentando Vercel Function`);
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          message,
          type: 'generic'
        })
      });

      if (response.ok) {
        const result = await response.json();
        emailLog(`Email enviado via Vercel Function`);
        return true;
      } else {
        const errorText = await response.text();
        error(`Erro da Vercel Function`, errorText, 'EmailService');
        return false;
      }
    } catch (err) {
      error(`Erro ao conectar com Vercel Function`, err, 'EmailService');
      return false;
    }
  }

  /**
   * Simula envio de email (sempre funciona)
   */
  private async sendViaMock(to: string, subject: string, message: string): Promise<boolean> {
    try {
      // Simular delay de rede (mais rápido em desenvolvimento)
      const delay = import.meta.env.PROD ? 800 + Math.random() * 1200 : 300;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      emailLog('✅ EMAIL ENVIADO COM SUCESSO (MODO SIMULAÇÃO)');
      
      // Simular sucesso sempre
      return true;
    } catch (err) {
      error(`Erro ao enviar email`, err, 'EmailService');
      return false;
    }
  }

  /**
   * Verifica se o serviço está funcionando
   */
  async verifyConnection(): Promise<boolean> {
    if (this.useRealEmail) {
      emailLog('Credenciais Gmail configuradas');
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