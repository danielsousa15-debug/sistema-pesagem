# Titãs Combat — Sistema de Gestão

Sistema completo de gestão para academia de artes marciais.

**Stack:** Next.js 16 (App Router) + Supabase (PostgreSQL + Auth) + Tailwind CSS

## Módulos

| Módulo | Descrição |
|---|---|
| Dashboard | KPIs em tempo real: alunos, presenças, financeiro, retenção |
| Alunos | Cadastro completo, foto, status, plano, modalidade, presença |
| Check-in | QR Code fixo na entrada — aluno registra presença pelo celular |
| Modalidades | Muay Thai, Jiu-Jitsu, Boxe, MMA, Funcional, Infantil |
| Professores | Cadastro completo com especialidades |
| Planos | Mensal/Trimestral/Semestral/Anual com benefícios e cores |
| Financeiro | Cobranças, pagamentos, inadimplência por mês |
| Leads | Pipeline com status (novo → convertido) |
| QR Code | Gerador do QR para imprimir na entrada |

## Primeiro uso

```bash
cp .env.example .env.local
# Preencha com suas credenciais Supabase
npm install
npm run dev
```

Acesse `/setup` para criar o primeiro usuário administrador.

## Estrutura

```
src/
├── app/
│   ├── (auth)/login/        # Login
│   ├── (dashboard)/         # Todas as telas do painel
│   ├── checkin/             # Check-in público (QR Code)
│   └── setup/               # Configuração inicial
├── components/layout/       # Sidebar
├── lib/supabase/            # Clientes Supabase
└── types/                   # TypeScript types
supabase/schema.sql          # Schema completo do banco
```
