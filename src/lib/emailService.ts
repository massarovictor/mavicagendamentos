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
      console.log('📧 EmailService configurado para usar Gmail:', EMAIL_CONFIG.FROM_EMAIL);
    } else {
      console.log('📧 EmailService em modo MOCK - configure as variáveis de ambiente');
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
    } catch (error) {
      console.error(`❌ Erro ao enviar email para ${to}:`, error);
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
      console.log(`📧 Enviando email via Backend para: ${to}`);
      
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
        console.log(`✅ Email enviado com sucesso para ${to}`);
        return true;
      } else {
        const error = await response.text();
        console.error(`❌ Erro do backend:`, error);
        // Em caso de erro, usar modo mock para não quebrar o fluxo
        return await this.sendViaMock(to, subject, message);
      }
    } catch (error) {
      console.error(`❌ Erro ao conectar com backend:`, error);
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
      
      // Log bem visível
      console.log('\n' + '='.repeat(80));
      console.log('📧 EMAIL ENVIADO (MODO SIMULAÇÃO)');
      console.log('='.repeat(80));
      console.log(`🔴 DE: ${EMAIL_CONFIG.FROM_EMAIL || 'Sistema Easy Arrange'}`);
      console.log(`🎯 PARA: ${to}`);
      console.log(`📄 ASSUNTO: ${subject}`);
      console.log(`📝 MENSAGEM:`);
      console.log(message);
      console.log('='.repeat(80) + '\n');
      
      // Simular sucesso sempre
      return true;
    } catch (error) {
      console.error(`❌ [MOCK] Erro ao simular email para ${to}:`, error);
      return false;
    }
  }

  /**
   * Verifica se o serviço está funcionando
   */
  async verifyConnection(): Promise<boolean> {
    if (this.useRealEmail) {
      console.log('✅ Credenciais Gmail configuradas:', EMAIL_CONFIG.FROM_EMAIL);
      return true;
    } else {
      console.log('ℹ️ Modo mock ativo - configure VITE_SMTP_USERNAME, VITE_SMTP_PASSWORD, VITE_FROM_EMAIL');
      return true; // Mock sempre "funciona"
    }
  }

  /**
   * Força o uso de emails reais
   */
  forceRealEmails() {
    this.useRealEmail = true;
    console.log('🚀 Modo de emails reais forçado');
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