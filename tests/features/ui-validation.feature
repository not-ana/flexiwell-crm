# language: pt
@ui @validation @smoke
Funcionalidade: Validacao de UI - Botoes e Links
  Como desenvolvedor
  Eu quero validar que todas as paginas carregam corretamente
  Para garantir que a aplicacao esta funcionando

  # ==========================================
  # ADMIN PAGES
  # ==========================================

  @admin @pages
  Cenario: Validar que paginas admin carregam
    Dado que estou na pagina "/admin"
    Entao a pagina deve carregar sem erros
    E deve haver elementos interativos na pagina

  @admin @clients
  Cenario: Validar pagina de clientes
    Dado que estou na pagina "/admin/clients"
    Entao a pagina deve carregar sem erros
    E deve haver botoes de acao na pagina

  @admin @payments
  Cenario: Validar pagina de pagamentos
    Dado que estou na pagina "/admin/payments"
    Entao a pagina deve carregar sem erros

  @admin @integrations
  Cenario: Validar pagina de integracoes
    Dado que estou na pagina "/admin/integrations"
    Entao a pagina deve carregar sem erros

  @admin @settings
  Cenario: Validar pagina de configuracoes
    Dado que estou na pagina "/admin/settings"
    Entao a pagina deve carregar sem erros

  # ==========================================
  # CLIENT PAGES
  # ==========================================

  @client @pages
  Cenario: Validar dashboard do cliente
    Dado que estou na pagina "/dashboard"
    Entao a pagina deve carregar sem erros

  @client @classes
  Cenario: Validar pagina de aulas do cliente
    Dado que estou na pagina "/dashboard/classes"
    Entao a pagina deve carregar sem erros

  # ==========================================
  # TEACHER PAGES
  # ==========================================

  @teacher @pages
  Cenario: Validar dashboard do professor
    Dado que estou na pagina "/teacher"
    Entao a pagina deve carregar sem erros

  # ==========================================
  # GENERAL
  # ==========================================

  @navigation @404
  Cenario: Validar pagina 404
    Dado que eu acesso uma pagina que nao existe
    Entao devo ver pagina de erro 404
    E deve haver link para voltar ao inicio

  @forms @validation
  Cenario: Validar que pagina de login carrega
    Dado que estou na pagina "/login"
    Entao a pagina deve carregar sem erros
    E deve haver formulario de login
