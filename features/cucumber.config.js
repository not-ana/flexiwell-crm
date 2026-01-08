/**
 * Configuração do Cucumber.js para FlexiWell CRM
 *
 * Este arquivo configura o ambiente de testes BDD
 */

module.exports = {
  default: {
    // Diretório das features
    paths: ['features/**/*.feature'],

    // Diretório dos step definitions
    require: [
      'features/step_definitions/**/*.ts',
      'features/support/**/*.ts'
    ],

    // Usar TypeScript
    requireModule: ['ts-node/register'],

    // Formato de saída
    format: [
      'progress-bar',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json'
    ],

    // Formatadores personalizados
    formatOptions: {
      snippetInterface: 'async-await'
    },

    // Configurações de execução
    parallel: 2,
    retry: 1,
    retryTagFilter: '@flaky',

    // Tags para filtrar cenários
    // Exemplos de uso:
    // npm test -- --tags "@smoke"
    // npm test -- --tags "@admin and not @slow"
    // npm test -- --tags "@critical or @smoke"

    // Configurações de timeout
    timeout: 30000, // 30 segundos

    // Linguagem padrão
    language: 'pt',

    // Publicar relatório (desabilitado por padrão)
    publish: false,

    // Dry run (validar sintaxe sem executar)
    dryRun: false,

    // Falhar rápido (parar na primeira falha)
    failFast: false,

    // Modo estrito (falhar em steps pendentes)
    strict: true,

    // World parameters
    worldParameters: {
      baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
      apiUrl: process.env.TEST_API_URL || 'http://localhost:3000/api',
      headless: process.env.HEADLESS !== 'false',
      browser: process.env.BROWSER || 'chrome',
      defaultTimeout: 10000,
      locale: 'pt-BR'
    }
  },

  // Perfis de execução
  profiles: {
    // Testes de fumaça (rápidos)
    smoke: {
      tags: '@smoke',
      parallel: 4
    },

    // Testes críticos
    critical: {
      tags: '@critical',
      failFast: true
    },

    // Testes de regressão
    regression: {
      tags: '@regression',
      parallel: 2
    },

    // Testes de admin
    admin: {
      tags: '@admin'
    },

    // Testes de teacher
    teacher: {
      tags: '@teacher'
    },

    // Testes de client
    client: {
      tags: '@client'
    },

    // Testes de autenticação
    auth: {
      tags: '@auth'
    },

    // CI/CD
    ci: {
      format: ['json:reports/cucumber-report.json'],
      parallel: 4,
      failFast: false,
      strict: true
    },

    // Desenvolvimento local
    dev: {
      format: ['progress-bar'],
      parallel: 1,
      failFast: true,
      worldParameters: {
        headless: false
      }
    }
  }
};

/**
 * Uso:
 *
 * Executar todos os testes:
 * npx cucumber-js
 *
 * Executar com perfil específico:
 * npx cucumber-js --profile smoke
 * npx cucumber-js --profile admin
 *
 * Executar com tags:
 * npx cucumber-js --tags "@login"
 * npx cucumber-js --tags "@admin and @dashboard"
 * npx cucumber-js --tags "not @slow"
 *
 * Executar feature específica:
 * npx cucumber-js features/auth/login.feature
 *
 * Dry run (verificar sintaxe):
 * npx cucumber-js --dry-run
 *
 * Gerar relatório HTML:
 * npx cucumber-js --format html:reports/report.html
 */
