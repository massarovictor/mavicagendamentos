import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Carrega as variáveis definidas no arquivo .env
dotenv.config();

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuração do transporter seguindo o exemplo Python
const transporter = nodemailer.createTransport({
  host: process.env.VITE_SMTP_SERVER || 'smtp.gmail.com',
  port: parseInt(process.env.VITE_SMTP_PORT || '587'),
  secure: false, // true para 465, false para outros ports
  auth: {
    user: process.env.VITE_SMTP_USERNAME,
    pass: process.env.VITE_SMTP_PASSWORD
  }
});

/**
 * Envia um e-mail com o assunto e corpo especificados para o destinatário informado.
 * Baseado no exemplo Python fornecido pelo usuário.
 */
const sendEmail = async (subject, body, toEmail) => {
  const fromEmail = process.env.VITE_FROM_EMAIL;
  
  const mailOptions = {
    from: fromEmail,
    to: toEmail,
    subject: subject,
    text: body,
    encoding: 'utf-8'
  };

  try {
    // Conectar e enviar o email
    const info = await transporter.sendMail(mailOptions);
    
    // Registra sucesso no log (equivalente ao logging.info do Python)
    console.log(`✅ E-mail enviado com sucesso para ${toEmail} | Assunto: ${subject} | MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    // Registra erro no log (equivalente ao logging.error do Python)
    console.error(`❌ Erro ao enviar e-mail para ${toEmail}:`, error);
    return { success: false, error: error.message };
  }
};

// Endpoint para envio de email
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, message, type } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Campos obrigatórios: to, subject, message' 
      });
    }

    console.log(`📨 Tentando enviar email para: ${to} | Tipo: ${type || 'generic'} | Assunto: ${subject}`);
    
    const result = await sendEmail(subject, message, to);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Email enviado com sucesso',
        messageId: result.messageId 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('❌ Erro no endpoint /api/send-email:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// Endpoint para verificar conexão
app.get('/api/verify-connection', async (req, res) => {
  try {
    console.log('🔍 Verificando conexão SMTP...');
    await transporter.verify();
    console.log('✅ Conexão SMTP verificada com sucesso');
    res.json({ success: true, message: 'Conexão SMTP funcionando' });
  } catch (error) {
    console.error('❌ Erro na verificação SMTP:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Endpoint de status
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'running', 
    service: 'Email Server',
    timestamp: new Date().toISOString(),
    config: {
      smtp_server: process.env.VITE_SMTP_SERVER || 'smtp.gmail.com',
      smtp_port: process.env.VITE_SMTP_PORT || '587',
      from_email: process.env.VITE_FROM_EMAIL,
      username: process.env.VITE_SMTP_USERNAME
    }
  });
});

app.listen(port, () => {
  console.log(`🚀 Servidor de email rodando na porta ${port}`);
  console.log(`📧 Configuração SMTP:`);
  console.log(`   - Server: ${process.env.VITE_SMTP_SERVER || 'smtp.gmail.com'}`);
  console.log(`   - Port: ${process.env.VITE_SMTP_PORT || '587'}`);
  console.log(`   - From: ${process.env.VITE_FROM_EMAIL}`);
  console.log(`   - Username: ${process.env.VITE_SMTP_USERNAME}`);
}); 