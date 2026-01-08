# Features Cucumber - FlexiWell CRM

Este diretório contém todas as features Cucumber para testes BDD do FlexiWell CRM.

## Estrutura de Diretórios

```
features/
├── auth/                    # Autenticação
│   ├── login.feature        # Login de usuários
│   ├── register.feature     # Cadastro de usuários
│   └── password.feature     # Gerenciamento de senha
│
├── admin/                   # Funcionalidades do Admin/Owner
│   ├── dashboard.feature    # Dashboard administrativo
│   ├── staff.feature        # Gerenciamento de equipe
│   ├── clients.feature      # Gerenciamento de clientes
│   ├── classes.feature      # Gerenciamento de aulas
│   ├── waitlist.feature     # Lista de espera
│   ├── rooms.feature        # Salas e estabelecimentos
│   ├── payments.feature     # Pagamentos
│   ├── billing.feature      # Assinatura do studio
│   ├── integrations.feature # Integrações (Stripe, WhatsApp, etc)
│   ├── reports.feature      # Relatórios e analytics
│   ├── conversations.feature# Conversas (WhatsApp/Instagram)
│   ├── support.feature      # Tickets de suporte
│   └── settings.feature     # Configurações do studio
│
├── teacher/                 # Funcionalidades do Instrutor
│   ├── dashboard.feature    # Dashboard do instrutor
│   ├── classes.feature      # Aulas do instrutor
│   ├── students.feature     # Alunos do instrutor
│   ├── attendance.feature   # Registro de presença
│   ├── makeups.feature      # Reposições
│   └── support.feature      # Suporte para instrutores
│
├── client/                  # Funcionalidades do Cliente/Aluno
│   ├── dashboard.feature    # Dashboard do cliente
│   ├── classes.feature      # Agendamento de aulas
│   ├── profile.feature      # Perfil do cliente
│   └── support.feature      # Suporte para clientes
│
├── common/                  # Arquivos comuns
│   ├── steps.feature        # Documentação de steps
│   └── hooks.feature        # Documentação de hooks
│
├── cucumber.config.js       # Configuração do Cucumber
└── README.md               # Este arquivo
```

## Roles do Sistema

O sistema possui 3 roles principais, que podem ter nomes diferentes dependendo do tipo de negócio:

| Role Padrão | Alternativas          | Descrição                    |
|-------------|----------------------|------------------------------|
| Admin       | Owner, Proprietário  | Administrador do studio      |
| Teacher     | Instructor, Professor| Instrutor de aulas           |
| Client      | Student, Aluno       | Cliente/aluno do studio      |

## Tags Disponíveis

### Por Módulo
- `@auth` - Autenticação
- `@admin` - Funcionalidades do admin
- `@teacher` - Funcionalidades do instrutor
- `@client` - Funcionalidades do cliente

### Por Funcionalidade
- `@dashboard` - Dashboards
- `@classes` - Aulas
- `@payments` - Pagamentos
- `@support` - Suporte
- `@settings` - Configurações

### Por Tipo de Cenário
- `@sucesso` - Cenários de sucesso
- `@erro` - Cenários de erro
- `@edge-case` - Casos extremos

### Por Tipo de Teste
- `@smoke` - Testes de fumaça
- `@critical` - Testes críticos
- `@regression` - Testes de regressão
- `@slow` - Testes lentos
- `@manual` - Testes manuais

### Especiais
- `@wip` - Work in Progress
- `@skip` - Pular cenário
- `@flaky` - Teste instável

## Como Executar

### Instalar dependências
```bash
npm install @cucumber/cucumber ts-node typescript
```

### Executar todos os testes
```bash
npx cucumber-js
```

### Executar com perfil específico
```bash
npx cucumber-js --profile smoke
npx cucumber-js --profile admin
npx cucumber-js --profile ci
```

### Executar por tags
```bash
# Apenas testes de login
npx cucumber-js --tags "@login"

# Testes de admin, exceto lentos
npx cucumber-js --tags "@admin and not @slow"

# Cenários críticos ou de fumaça
npx cucumber-js --tags "@critical or @smoke"

# Cenários de sucesso do cliente
npx cucumber-js --tags "@client and @sucesso"
```

### Executar feature específica
```bash
npx cucumber-js features/auth/login.feature
```

### Dry run (validar sintaxe)
```bash
npx cucumber-js --dry-run
```

## Relatórios

Os relatórios são gerados em `reports/`:
- `cucumber-report.html` - Relatório HTML visual
- `cucumber-report.json` - Dados em JSON

## Convenções

### Nomenclatura de Cenários
- Use português brasileiro
- Seja descritivo e específico
- Comece com verbo no infinitivo

### Estrutura de Feature
```gherkin
# language: pt
@module @feature
Funcionalidade: Nome da Funcionalidade
  Como um [role]
  Eu quero [ação]
  Para [benefício]

  Contexto:
    Dado que [precondição comum]

  @sucesso
  Cenário: Cenário de sucesso
    Dado que [precondição]
    Quando eu [ação]
    Então eu devo [resultado esperado]

  @erro
  Cenário: Cenário de erro
    ...

  @edge-case
  Cenário: Caso extremo
    ...
```

## Cobertura de Cenários

| Módulo        | Features | Cenários | Sucesso | Erro | Edge |
|---------------|----------|----------|---------|------|------|
| Auth          | 3        | ~45      | 15      | 15   | 15   |
| Admin         | 13       | ~200     | 80      | 50   | 70   |
| Teacher       | 6        | ~90      | 40      | 20   | 30   |
| Client        | 4        | ~60      | 25      | 15   | 20   |
| **Total**     | **26**   | **~395** | 160     | 100  | 135  |

## Contribuindo

1. Siga as convenções de nomenclatura
2. Use tags apropriadas
3. Inclua cenários de sucesso, erro e edge cases
4. Documente precondições no Contexto
5. Mantenha cenários independentes
