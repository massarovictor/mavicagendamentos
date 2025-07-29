import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Headers CORS para compatibilidade
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('🚀 Vercel Function iniciada:', req.method);
  
  // Permitir apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { to, subject, message } = req.body;
  console.log('📧 Dados recebidos:', { to: '***', subject, messageLength: message?.length });

  // Validação dos dados
  if (!to || !subject || !message) {
    return res.status(400).json({ 
      error: 'Campos obrigatórios: to, subject, message' 
    });
  }

  try {
    // Validar se as credenciais estão configuradas
    if (!process.env.VITE_SMTP_USERNAME || !process.env.VITE_SMTP_PASSWORD || !process.env.VITE_FROM_EMAIL) {
      throw new Error('Credenciais SMTP não configuradas nas variáveis de ambiente');
    }

    // Configuração do transporter
    const transporter = nodemailer.createTransport({
      host: process.env.VITE_SMTP_SERVER || 'smtp.gmail.com',
      port: parseInt(process.env.VITE_SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.VITE_SMTP_USERNAME,
        pass: process.env.VITE_SMTP_PASSWORD,
      },
    });

    // Opções do email
    const mailOptions = {
      from: process.env.VITE_FROM_EMAIL,
      to: to,
      subject: subject,
      text: message,
    };

    // Enviar email
    console.log('📤 Enviando email...');
    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email enviado com sucesso:', info.messageId);
    
    res.status(200).json({ 
      success: true, 
      message: 'Email enviado com sucesso',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    
    // Diferentes tipos de erro para melhor debug
    if (error.code === 'EAUTH') {
      return res.status(401).json({ 
        error: 'Erro de autenticação SMTP',
        details: 'Verifique as credenciais de email'
      });
    }
    
    if (error.code === 'ECONNECTION') {
      return res.status(503).json({ 
        error: 'Erro de conexão SMTP',
        details: 'Não foi possível conectar ao servidor de email'
      });
    }
    
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Erro no envio de email'
    });
  }
} 