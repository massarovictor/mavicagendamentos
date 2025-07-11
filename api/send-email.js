import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Permitir apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { to, subject, message } = req.body;

  // Validação dos dados
  if (!to || !subject || !message) {
    return res.status(400).json({ 
      error: 'Campos obrigatórios: to, subject, message' 
    });
  }

  try {
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
    const info = await transporter.sendMail(mailOptions);

    console.log('Email enviado:', info.messageId);
    
    res.status(200).json({ 
      success: true, 
      message: 'Email enviado com sucesso',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Erro ao enviar email:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
} 