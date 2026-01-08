# language: pt
# Este arquivo contém steps comuns reutilizáveis em todas as features
# Os steps abaixo são documentação dos padrões de steps disponíveis

@common @steps
Funcionalidade: Steps Comuns
  Como um desenvolvedor de testes
  Eu quero ter steps reutilizáveis
  Para não duplicar código entre features

  # ==========================================
  # STEPS DE NAVEGAÇÃO
  # ==========================================

  # Dado que estou na página {string}
  # Dado que estou na página de login
  # Dado que estou na página de cadastro
  # Dado que estou na página de {feature}

  # Quando eu acesso a página {string}
  # Quando eu acesso o dashboard
  # Quando eu acesso {string} > {string}
  # Quando eu navego para {string}

  # Então eu devo ser redirecionado para {string}
  # Então eu devo permanecer na página atual
  # Então a URL deve conter {string}

  # ==========================================
  # STEPS DE AUTENTICAÇÃO
  # ==========================================

  # Dado que estou logado como admin
  # Dado que estou logado como instrutor {string}
  # Dado que estou logado como cliente {string}
  # Dado que estou logado como {role}
  # Dado que não estou logado
  # Dado que minha sessão expirou
  # Dado que meu token de acesso expirou
  # Dado que meu refresh token expirou

  # ==========================================
  # STEPS DE FORMULÁRIO
  # ==========================================

  # Quando eu preencho o campo {string} com {string}
  # Quando eu preencho os seguintes dados:
  #   | campo | valor |
  # Quando eu limpo o campo {string}
  # Quando eu seleciono {string} no campo {string}
  # Quando eu marco a opção {string}
  # Quando eu desmarco a opção {string}
  # Quando eu faço upload do arquivo {string}
  # Quando eu faço upload de uma imagem

  # ==========================================
  # STEPS DE INTERAÇÃO
  # ==========================================

  # Quando eu clico no botão {string}
  # Quando eu clico em {string}
  # Quando eu clico no link {string}
  # Quando eu clico no ícone {string}
  # Quando eu clico em {string} no item {string}
  # Quando eu confirmo a ação
  # Quando eu cancelo a ação
  # Quando eu fecho o modal
  # Quando eu aguardo {int} segundos
  # Quando eu pressiono a tecla {string}
  # Quando eu arrasto {string} para {string}

  # ==========================================
  # STEPS DE VALIDAÇÃO - MENSAGENS
  # ==========================================

  # Então eu devo ver a mensagem {string}
  # Então eu devo ver a mensagem de erro {string}
  # Então eu devo ver a mensagem de sucesso {string}
  # Então eu devo ver o alerta {string}
  # Então eu não devo ver a mensagem {string}
  # Então eu devo ver a notificação {string}

  # ==========================================
  # STEPS DE VALIDAÇÃO - ELEMENTOS
  # ==========================================

  # Então eu devo ver o elemento {string}
  # Então eu não devo ver o elemento {string}
  # Então o botão {string} deve estar habilitado
  # Então o botão {string} deve estar desabilitado
  # Então o campo {string} deve estar vazio
  # Então o campo {string} deve conter {string}
  # Então a tabela deve conter {int} linhas
  # Então eu devo ver {string} na lista

  # ==========================================
  # STEPS DE VALIDAÇÃO - DADOS
  # ==========================================

  # Então eu devo ver a métrica {string} com valor {string}
  # Então eu devo ver os seguintes dados:
  #   | campo | valor |
  # Então eu devo ver a lista com:
  #   | item |
  # Então o valor de {string} deve ser {string}
  # Então o contador deve mostrar {int}

  # ==========================================
  # STEPS DE FILTROS E BUSCA
  # ==========================================

  # Quando eu seleciono o filtro {string} com valor {string}
  # Quando eu digito {string} no campo de busca
  # Quando eu ordeno por {string}
  # Quando eu limpo os filtros
  # Quando eu aplico o filtro de data de {string} até {string}

  # ==========================================
  # STEPS DE TABELA
  # ==========================================

  # Então a tabela deve exibir:
  #   | coluna1 | coluna2 |
  # Então eu devo ver {string} na linha {int}
  # Quando eu clico na linha {int}
  # Quando eu clico no cabeçalho {string}

  # ==========================================
  # STEPS DE NOTIFICAÇÃO
  # ==========================================

  # Então um email deve ser enviado para {string}
  # Então uma notificação WhatsApp deve ser enviada
  # Então uma notificação push deve ser enviada
  # Então eu devo receber confirmação por email/WhatsApp
  # Então nenhum email deve ser enviado

  # ==========================================
  # STEPS DE TEMPO
  # ==========================================

  # Dado que a data atual é {string}
  # Dado que o horário atual é {string}
  # Dado que é fora do horário comercial
  # Dado que é {dia_semana}
  # Dado que estamos em período de {string}

  # ==========================================
  # STEPS DE CONTEXTO DE DADOS
  # ==========================================

  # Dado que existem os seguintes {entidade}:
  #   | campo1 | campo2 |
  # Dado que o {entidade} possui:
  #   | campo | valor |
  # Dado que não existem {entidade} cadastrados
  # Dado que o sistema possui os seguintes dados:

  # ==========================================
  # STEPS DE ESTADO
  # ==========================================

  # Dado que o sistema está em modo de manutenção
  # Dado que há um erro de conexão com o banco de dados
  # Dado que há um erro de conexão com o servidor
  # Dado que o servidor está demorando para responder
  # Dado que estou sem conexão com a internet

  # ==========================================
  # STEPS ESPECÍFICOS DE AULAS
  # ==========================================

  # Dado que a aula {string} está lotada
  # Dado que a aula {string} tem vagas disponíveis
  # Dado que estou inscrito na aula {string}
  # Dado que estou na lista de espera da aula {string}
  # Dado que a aula foi cancelada
  # Dado que a aula está em andamento
  # Dado que a aula já aconteceu

  # ==========================================
  # STEPS ESPECÍFICOS DE PLANO
  # ==========================================

  # Dado que meu plano está ativo
  # Dado que meu plano expirou
  # Dado que tenho {int} aulas restantes
  # Dado que não tenho mais aulas no plano
  # Dado que meu pagamento está pendente
  # Dado que meu pagamento está atrasado há {int} dias

  # ==========================================
  # STEPS ESPECÍFICOS DE REPOSIÇÃO
  # ==========================================

  # Dado que tenho {int} reposições pendentes
  # Dado que tenho direito a reposição
  # Dado que o prazo de reposição expirou
  # Quando eu uso a reposição para agendar aula

  # ==========================================
  # STEPS DE API/BACKEND
  # ==========================================

  # Então a requisição deve retornar status {int}
  # Então o token de acesso deve ser armazenado
  # Então o token de refresh deve ser armazenado
  # Então nenhuma operação maliciosa deve ser executada
  # Então o conteúdo deve ser sanitizado

  # ==========================================
  # STEPS DE MOBILE/RESPONSIVO
  # ==========================================

  # Dado que estou acessando via dispositivo móvel
  # Dado que estou acessando via tablet
  # Dado que estou acessando via desktop
  # Então o layout deve ser responsivo
  # Então a interface deve estar otimizada para mobile
