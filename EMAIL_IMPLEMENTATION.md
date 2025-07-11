# Sistema de Notificações por Email - Easy Arrange

## ⚠️ Status Atual: Demonstração (Mock)

O sistema atual implementa **mocks** das funcionalidades de email para demonstração no frontend. Para uso em produção, é necessário implementar o envio real de emails no backend.

## 🎯 Funcionalidades Implementadas

### 1. **Notificação para Gestores (Nova Solicitação)**
- **Quando:** Um usuário cria um novo agendamento
- **Para:** Todos os gestores responsáveis pelo espaço
- **Conteúdo:** Detalhes do agendamento, link para aprovação

### 2. **Notificação para Usuário (Aprovação)**
- **Quando:** Gestor aprova um agendamento
- **Para:** Usuário que fez a solicitação
- **Conteúdo:** Confirmação da aprovação, detalhes do agendamento

### 3. **Notificação para Usuário (Rejeição)**
- **Quando:** Gestor rejeita um agendamento
- **Para:** Usuário que fez a solicitação
- **Conteúdo:** Informação sobre rejeição, sugestões para novo agendamento

## 📁 Arquivos do Sistema

```
src/
├── lib/
│   ├── emailService.ts          # Serviço de envio (atualmente mock)
│   ├── emailTemplates.ts        # Templates HTML dos emails
│   └── notificationService.ts   # Orquestração das notificações
├── hooks/
│   └── useSupabaseData.ts       # Integração com fluxo de agendamentos
└── pages/
    └── TestEmail.tsx            # Página para teste das funcionalidades
```

## 🚀 Implementação em Produção

### Opção 1: Supabase Edge Functions

1. **Criar função no Supabase:**
```sql
-- No Supabase Dashboard > Edge Functions
CREATE OR REPLACE FUNCTION send_email_notification()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Lógica de envio via API externa (SendGrid, SES, etc.)
END;
$$;
```

2. **Substituir o emailService.ts:**
```typescript
// src/lib/emailService.ts
import { supabase } from './supabase';

class EmailService {
  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { to, subject, html }
      });
      
      return !error && data?.success;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return false;
    }
  }
}
```

### Opção 2: Backend Separado (Express/Node.js)

1. **Criar API de email:**
```javascript
// backend/routes/email.js
const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_SERVER,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});

router.post('/send', async (req, res) => {
  const { to, subject, html } = req.body;
  
  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      html,
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

2. **Atualizar o frontend:**
```typescript
// src/lib/emailService.ts
class EmailService {
  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html }),
      });
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return false;
    }
  }
}
```

### Opção 3: Serviços Third-Party

#### SendGrid
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to: string, subject: string, html: string) => {
  const msg = {
    to,
    from: process.env.FROM_EMAIL,
    subject,
    html,
  };
  
  try {
    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('Erro SendGrid:', error);
    return false;
  }
};
```

#### Amazon SES
```typescript
import AWS from 'aws-sdk';

const ses = new AWS.SES({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const sendEmail = async (to: string, subject: string, html: string) => {
  const params = {
    Destination: { ToAddresses: [to] },
    Message: {
      Body: { Html: { Data: html } },
      Subject: { Data: subject },
    },
    Source: process.env.FROM_EMAIL,
  };
  
  try {
    await ses.sendEmail(params).promise();
    return true;
  } catch (error) {
    console.error('Erro AWS SES:', error);
    return false;
  }
};
```

## 🔧 Configuração de Variáveis

### Desenvolvimento (.env)
```env
# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-de-app
FROM_EMAIL=seu-email@gmail.com
```

### Produção
- Configure as mesmas variáveis no seu ambiente de produção
- Use senhas de aplicativo para Gmail
- Configure SPF/DKIM para melhor entregabilidade

## 🧪 Como Testar

1. **Acesse a página de teste:**
   - Faça login no sistema
   - Navegue para `/test-email`

2. **Teste as funcionalidades:**
   - Verificação de conectividade SMTP
   - Envio de email simples
   - Templates de notificação

3. **Monitore os logs do console** para ver as simulações

## 📋 Checklist para Produção

- [ ] Escolher método de implementação (Supabase/Backend/Third-party)
- [ ] Configurar credenciais SMTP ou API
- [ ] Atualizar `emailService.ts` com implementação real
- [ ] Configurar domínio e registros DNS (SPF/DKIM)
- [ ] Testar envio real em ambiente de staging
- [ ] Implementar rate limiting para prevenir spam
- [ ] Configurar monitoramento e logs de email
- [ ] Adicionar tratamento de bounces/falhas
- [ ] Implementar unsubscribe se necessário
- [ ] Revisar templates para compliance (LGPD/GDPR)

## 🎨 Personalização dos Templates

Os templates estão em `src/lib/emailTemplates.ts` e podem ser customizados:

- **Cores e estilos:** Modifique o CSS inline
- **Conteúdo:** Ajuste textos e estrutura HTML
- **Logos:** Adicione imagens hospedadas externamente
- **Links:** Configure URLs base para produção

## 🔐 Segurança

### Recomendações:
1. **Nunca** coloque credenciais SMTP no frontend
2. Use variáveis de ambiente para configurações sensíveis
3. Implemente rate limiting para evitar spam
4. Valide entrada de dados nos templates
5. Use HTTPS para todas as comunicações
6. Configure autenticação adequada para APIs

## 📞 Suporte

Para implementação em produção, considere:
- Configurar monitoramento de entregabilidade
- Implementar filas para processamento assíncrono
- Usar templates mais sofisticados com ferramentas como MJML
- Adicionar analytics de abertura/clique de emails
- Configurar webhooks para status de entrega

---

**Nota:** Este sistema foi projetado para ser flexível e permitir múltiplas implementações backend. Escolha a opção que melhor se adequa à sua infraestrutura atual. 