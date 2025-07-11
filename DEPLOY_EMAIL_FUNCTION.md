# Deploy da Função de Email no Supabase

## 🚀 Pré-requisitos

1. **Supabase CLI instalado:**
```bash
npm install -g supabase
```

2. **Login no Supabase:**
```bash
supabase login
```

3. **Projeto Supabase linkado:**
```bash
supabase link --project-ref SEU_PROJECT_REF
```

## 📁 Estrutura Criada

```
supabase/
├── functions/
│   ├── send-email-notification/
│   │   └── index.ts                 # ✅ Nova função criada
│   └── login-com-senha/
│       └── index.ts                 # ✅ Já existia
└── migrations/
    ├── 001_initial_schema_fixed.sql # ✅ Já existia
    ├── 002_seed_data.sql           # ✅ Já existia
    ├── 003_add_password_to_users.sql # ✅ Já existia
    └── 004_add_email_logs.sql      # ✅ Nova migração
```

## 🛠️ Deploy das Migrações

1. **Executar nova migração:**
```bash
supabase db push
```

2. **Verificar se a tabela `email_logs` foi criada:**
```bash
supabase db diff
```

## 📧 Deploy da Função de Email

1. **Deploy da função:**
```bash
supabase functions deploy send-email-notification
```

2. **Verificar deploy:**
```bash
supabase functions list
```

## 🔧 Configurar Variáveis de Ambiente

No **Supabase Dashboard** > **Edge Functions** > **send-email-notification** > **Settings**:

### Para Desenvolvimento (Simulação):
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=epmariacelia@gmail.com
SMTP_PASSWORD=vkxe xujp cnbx jydx
FROM_EMAIL=epmariacelia@gmail.com
```

### Para Produção (com Resend):
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@seudominio.com
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=epmariacelia@gmail.com
SMTP_PASSWORD=vkxe xujp cnbx jydx
```

## 🧪 Testar a Função

1. **Via Dashboard do Supabase:**
   - Vá para **Edge Functions** > **send-email-notification**
   - Clique em **Invoke Function**
   - Use este payload de teste:
   ```json
   {
     "to": "seu-email@exemplo.com",
     "subject": "Teste da Função",
     "html": "<h1>Teste</h1><p>Se você recebeu este email, a função está funcionando!</p>",
     "type": "teste"
   }
   ```

2. **Via aplicação:**
   - Acesse `/test-email` no sistema
   - Use os botões de teste
   - Monitore o console do browser para logs

## 📊 Monitoramento

1. **Logs da função:**
```bash
supabase functions logs send-email-notification
```

2. **Verificar logs no banco:**
```sql
SELECT * FROM email_logs ORDER BY enviado_em DESC LIMIT 10;
```

## 🔄 Atualizar a Função

Quando fizer mudanças no arquivo `index.ts`:

```bash
supabase functions deploy send-email-notification
```

## 🐛 Troubleshooting

### Erro: "Function not found"
```bash
# Re-deploy da função
supabase functions deploy send-email-notification
```

### Erro: "Environment variables not set"
- Verificar se as variáveis estão configuradas no Dashboard
- Aguardar alguns minutos após configurar (cache)

### Erro: "CORS"
- A função já tem CORS configurado
- Verificar se o projeto está linkado corretamente

### Erro: "Database connection"
```bash
# Verificar se as migrações foram aplicadas
supabase db push
```

## 📈 Próximos Passos

### 1. **Para Produção Real:**
- Cadastrar em [Resend](https://resend.com/) (gratuito até 3000 emails/mês)
- Configurar `RESEND_API_KEY` nas variáveis da função
- Remover a simulação e usar envio real

### 2. **Melhorias Futuras:**
- Adicionar templates mais avançados
- Implementar retry em caso de falha
- Adicionar analytics de abertura de emails
- Configurar webhooks para status de entrega

### 3. **Monitoramento:**
- Criar dashboard para visualizar logs
- Configurar alertas para falhas
- Implementar métricas de performance

## ⚠️ Importante

- **Nunca** commitar chaves de API no código
- Usar sempre variáveis de ambiente
- Testar em ambiente de desenvolvimento primeiro
- Configurar limites de rate limiting se necessário
- Validar emails antes de enviar para evitar bounces

---

**Status Atual:** ✅ Função criada e pronta para deploy
**Próximo Passo:** Executar `supabase functions deploy send-email-notification` 