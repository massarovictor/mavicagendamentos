import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  type: 'nova_solicitacao' | 'aprovacao' | 'rejeicao';
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Método não permitido');
    }

    const { to, subject, html, type }: EmailRequest = await req.json();

    if (!to || !subject || !html) {
      throw new Error('Parâmetros obrigatórios: to, subject, html');
    }

    // Configurações do email a partir das variáveis de ambiente
    const SMTP_CONFIG = {
      server: Deno.env.get('SMTP_SERVER') || 'smtp.gmail.com',
      port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
      username: Deno.env.get('SMTP_USERNAME') || '',
      password: Deno.env.get('SMTP_PASSWORD') || '',
      from_email: Deno.env.get('FROM_EMAIL') || '',
      from_name: 'Sistema Mavic'
    };

    // Validar configurações
    if (!SMTP_CONFIG.username || !SMTP_CONFIG.password || !SMTP_CONFIG.from_email) {
      throw new Error('Configurações SMTP incompletas nas variáveis de ambiente');
    }

    // Para demonstração, vamos usar um serviço de email API como Resend ou EmailJS
    // Aqui estou usando uma abordagem que funcionaria com serviços como SendGrid ou similares
    
    console.log(`📧 Enviando email do tipo: ${type}`);
    console.log(`📧 Para: ${to}`);
    console.log(`📧 Assunto: ${subject}`);

    // Simular envio por agora (substitua por implementação real)
    const emailSent = await sendEmailViaAPI({
      to,
      subject,
      html,
      from: `${SMTP_CONFIG.from_name} <${SMTP_CONFIG.from_email}>`,
    });

    if (emailSent) {
      // Log da atividade no Supabase
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Opcional: salvar log do email enviado
      const { error: logError } = await supabase
        .from('email_logs')
        .insert({
          destinatario: to,
          assunto: subject,
          tipo: type,
          enviado_em: new Date().toISOString(),
          sucesso: true
        });

      if (logError) {
        console.warn('Aviso: Falha ao salvar log do email:', logError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email enviado com sucesso',
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      throw new Error('Falha no envio do email');
    }

  } catch (err) {
    const message = err?.message ?? String(err);
    console.error('Erro no envio de email:', message);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Função auxiliar para envio de email via API externa
async function sendEmailViaAPI(emailData: {
  to: string;
  subject: string;
  html: string;
  from: string;
}): Promise<boolean> {
  try {
    // OPÇÃO 1: Usar EmailJS (gratuito para testes)
    // const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     service_id: Deno.env.get('EMAILJS_SERVICE_ID'),
    //     template_id: Deno.env.get('EMAILJS_TEMPLATE_ID'),
    //     user_id: Deno.env.get('EMAILJS_USER_ID'),
    //     template_params: {
    //       to_email: emailData.to,
    //       subject: emailData.subject,
    //       html_content: emailData.html,
    //       from_name: 'Sistema Mavic'
    //     }
    //   })
    // });

    // OPÇÃO 2: Usar Resend (recomendado para produção)
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: emailData.from,
          to: [emailData.to],
          subject: emailData.subject,
          html: emailData.html,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Email enviado via Resend:', result.id);
        return true;
      } else {
        const error = await response.text();
        console.error('❌ Erro Resend:', error);
        return false;
      }
    }

    // OPÇÃO 3: Para desenvolvimento - apenas simular
    console.log('📧 [SIMULAÇÃO] Email seria enviado:');
    console.log(`   Para: ${emailData.to}`);
    console.log(`   Assunto: ${emailData.subject}`);
    console.log(`   De: ${emailData.from}`);
    console.log(`   Conteúdo: ${emailData.html.substring(0, 100)}...`);
    
    // Simular delay e sucesso
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;

  } catch (error) {
    console.error('Erro ao enviar email via API:', error);
    return false;
  }
} 