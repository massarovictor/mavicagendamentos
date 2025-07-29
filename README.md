# Mavic - Sistema de Agendamento de Espaços

Sistema desenvolvido para gerenciamento e agendamento de espaços educacionais, permitindo controle de usuários, gestores e administradores.

## 🎯 Funcionalidades

- **Gestão de Usuários**: Administradores, gestores e usuários comuns
- **Agendamento de Espaços**: Sistema completo de reservas
- **Notificações por Email**: Sistema automático de notificações
- **Dashboard Personalizado**: Interface específica para cada tipo de usuário
- **Aprovação de Agendamentos**: Fluxo de aprovação pelos gestores
- **Agendamentos Fixos**: Reservas recorrentes

## 🚀 Tecnologias

- **Frontend**: React, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL)
- **Email**: Nodemailer
- **Deploy**: Vercel

## 📦 Instalação

```bash
# Clone o repositório
git clone <repository-url>

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp env.example .env

# Execute em modo desenvolvimento
npm run dev
```

## 🔧 Configuração

1. Configure o Supabase:
   - Crie um projeto no [Supabase](https://supabase.com)
   - Execute as migrations em `supabase/migrations/`
   - Configure as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`

2. Configure o email:
   - Configure as variáveis SMTP no `.env`
   - Para desenvolvimento, use `npm run email-server`

## 🧪 Testes

```bash
# Executar testes
npm run test

# Build de produção
npm run build

# Limpeza de logs
npm run clean-logs
```

## 📱 Uso

1. **Login**: Acesse com usuário cadastrado no sistema
2. **Dashboard**: Interface personalizada por tipo de usuário
3. **Agendamentos**: Solicite reservas de espaços
4. **Aprovação**: Gestores aprovam/rejeitam solicitações
5. **Notificações**: Receba emails sobre status dos agendamentos

## 🔐 Tipos de Usuário

- **Admin**: Acesso total ao sistema
- **Gestor**: Gerencia espaços específicos
- **Usuário**: Solicita agendamentos

## 📞 Suporte

Sistema desenvolvido por Massaro Victor.

---

**Mavic** - Sistema profissional de agendamento de espaços educacionais.
