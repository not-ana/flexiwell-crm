# language: pt
# Este arquivo documenta os hooks disponíveis para os testes

@common @hooks
Funcionalidade: Hooks de Teste
  Como um desenvolvedor de testes
  Eu quero ter hooks bem definidos
  Para configurar e limpar o ambiente de testes

  # ==========================================
  # BEFORE HOOKS
  # ==========================================

  # @Before
  # - Limpa o banco de dados de teste
  # - Configura dados iniciais (seed)
  # - Inicia o servidor de teste
  # - Configura o navegador/driver

  # @Before("@auth")
  # - Configura usuários de teste para autenticação

  # @Before("@admin")
  # - Faz login como admin antes do cenário

  # @Before("@teacher")
  # - Faz login como professor antes do cenário

  # @Before("@client")
  # - Faz login como cliente antes do cenário

  # @Before("@database")
  # - Prepara dados específicos no banco

  # @Before("@api")
  # - Configura mocks de API externa

  # ==========================================
  # AFTER HOOKS
  # ==========================================

  # @After
  # - Limpa cookies e localStorage
  # - Fecha sessões abertas
  # - Restaura estado inicial do banco
  # - Captura screenshot em caso de falha

  # @After("@cleanup")
  # - Executa limpeza específica de dados criados

  # @After("@screenshot")
  # - Captura screenshot para evidência

  # ==========================================
  # BEFORE ALL / AFTER ALL
  # ==========================================

  # BeforeAll
  # - Inicia containers Docker (se necessário)
  # - Configura banco de dados de teste
  # - Compila aplicação

  # AfterAll
  # - Para containers
  # - Gera relatório de cobertura
  # - Limpa arquivos temporários

  # ==========================================
  # TAGS ESPECIAIS
  # ==========================================

  # @skip - Pula o cenário
  # @wip - Work in Progress
  # @manual - Teste manual (não automatizado)
  # @flaky - Teste instável (pode falhar aleatoriamente)
  # @slow - Teste lento (executar separadamente)
  # @critical - Teste crítico (deve passar sempre)
  # @smoke - Teste de fumaça (sanidade básica)
  # @regression - Teste de regressão
  # @integration - Teste de integração
  # @e2e - Teste end-to-end

  # ==========================================
  # CONFIGURAÇÃO DE AMBIENTE
  # ==========================================

  # Variáveis de ambiente necessárias:
  # - TEST_DATABASE_URL: URL do banco de teste
  # - TEST_API_URL: URL da API de teste
  # - HEADLESS: true/false para navegador headless
  # - BROWSER: chrome/firefox/safari
  # - TIMEOUT: timeout padrão em ms

  Cenário: Documentação de hooks
    Dado que este arquivo serve como documentação
    Então os hooks devem ser implementados em step_definitions/hooks.ts
