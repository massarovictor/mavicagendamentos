# Deploy na Vercel - Sistema de Email

## Como o Sistema Funciona

### Desenvolvimento Local
- O servidor `server.js` roda na porta 3001
- O Vite faz proxy de `/api/*` para `localhost:3001`
- Use: `npm run email-server` + `npm run dev`

### Produção na Vercel
- A função `api/send-email.js` substitui o servidor Express
- Vercel executa a função automaticamente quando acessada
- Não precisa do `npm run email-server`

## Configuração na Vercel

### 1. Variáveis de Ambiente
No painel da Vercel, adicione estas variáveis:

```
VITE_SMTP_SERVER=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_USERNAME=epmariacelia@gmail.com
VITE_SMTP_PASSWORD=vkxe xujp cnbx jydx
VITE_FROM_EMAIL=epmariacelia@gmail.com
```

### 2. Configuração Automática
O arquivo `vercel.json` já está configurado para:
- Definir timeout de 30s para a função de email
- Configurar variáveis de ambiente padrão

### 3. Deploy
```bash
# Instalar Vercel CLI (se não tiver)
npm i -g vercel

# Deploy
vercel

# Ou conectar o repositório GitHub à Vercel
```

## Estrutura de Arquivos

```
projeto/
├── api/
│   └── send-email.js      # ← Vercel Function (produção)
├── server.js              # ← Express server (desenvolvimento)
├── vercel.json            # ← Configuração da Vercel
└── src/lib/
    └── emailService.ts    # ← Cliente (funciona em ambos)
```

## Como Testar

### Local
1. `npm run email-server` (terminal 1)
2. `npm run dev` (terminal 2)
3. Acesse: `http://localhost:8080/teste-notificacao`

### Vercel
1. Deploy na Vercel
2. Acesse: `https://seu-app.vercel.app/teste-notificacao`

## Fallbacks

O sistema tem fallbacks inteligentes:
- Se a API falhar → usa modo mock (não quebra a aplicação)
- Se credenciais não estiverem configuradas → modo mock automático
- Logs detalhados para debug

## Dependências

O `package.json` já inclui:
- `nodemailer` - Para envio de emails
- `@types/nodemailer` - Types do TypeScript

## Vantagens da Solução

✅ **Funciona local e produção** - Código idêntico  
✅ **Sem servidores extras** - Vercel Functions são serverless  
✅ **Fallback inteligente** - Nunca quebra a aplicação  
✅ **Deploy automático** - Push no GitHub = Deploy automático  
✅ **Escalável** - Vercel escala automaticamente  

## Monitoramento

Na Vercel você pode ver:
- Logs das funções
- Métricas de performance
- Erros e exceções
- Uso de recursos

## Variáveis de Ambiente Supabase

Lembre-se também de configurar as variáveis do Supabase:
```
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
``` 