# language: pt
@client @support
Funcionalidade: Suporte para Clientes
  Como um Cliente/Aluno do studio
  Eu quero acessar o suporte do sistema
  Para resolver problemas e tirar dúvidas

  Contexto:
    Dado que estou logado como cliente "Ana Souza"
    E tenho os seguintes tickets abertos:
      | id    | titulo                      | status      | criado    |
      | #201  | Dúvida sobre cancelamento   | open        | Há 1 dia  |
      | #202  | Problema no agendamento     | in_progress | Há 3 dias |

  # ==========================================
  # CENÁRIOS DE SUCESSO - CRIAÇÃO DE TICKET
  # ==========================================

  @sucesso @criacao
  Cenário: Criar ticket de suporte
    Quando eu acesso a página de suporte
    E eu clico em "Nova Solicitação"
    E eu preencho:
      | campo      | valor                                   |
      | assunto    | Dúvida sobre troca de plano             |
      | categoria  | Planos e Pagamentos                     |
      | mensagem   | Gostaria de saber como trocar meu plano |
    E eu clico em "Enviar"
    Então o ticket deve ser criado
    E eu devo ver a mensagem "Solicitação enviada com sucesso!"
    E eu devo receber confirmação por email

  @sucesso @criacao
  Cenário: Criar ticket com categoria específica
    Quando eu crio um novo ticket
    E eu seleciono a categoria:
      | categorias_disponiveis         |
      | Agendamento de Aulas           |
      | Planos e Pagamentos            |
      | Problemas Técnicos             |
      | Sugestões e Reclamações        |
      | Outros                         |
    E eu completo o ticket
    Então o ticket deve ser criado com a categoria selecionada

  @sucesso @criacao
  Cenário: Anexar arquivo ao ticket
    Quando eu crio um novo ticket
    E eu anexo uma captura de tela
    E eu envio
    Então o anexo deve ser incluído no ticket

  # ==========================================
  # CENÁRIOS DE SUCESSO - VISUALIZAÇÃO
  # ==========================================

  @sucesso @visualizacao
  Cenário: Visualizar meus tickets
    Quando eu acesso a página de suporte
    Então eu devo ver a lista dos meus tickets:
      | campo               |
      | Número do ticket    |
      | Assunto             |
      | Status              |
      | Última atualização  |

  @sucesso @visualizacao
  Cenário: Visualizar detalhes do ticket
    Quando eu clico no ticket "#201"
    Então eu devo ver os detalhes:
      | campo       | valor                       |
      | Assunto     | Dúvida sobre cancelamento   |
      | Status      | Aberto                      |
      | Criado em   | 14/01/2024                  |
    E eu devo ver o histórico de mensagens

  @sucesso @visualizacao
  Cenário: Visualizar resposta do suporte
    Dado que o suporte respondeu meu ticket
    Quando eu acesso o ticket "#202"
    Então eu devo ver a resposta da equipe
    E a data/hora da resposta

  # ==========================================
  # CENÁRIOS DE SUCESSO - INTERAÇÃO
  # ==========================================

  @sucesso @interacao
  Cenário: Responder ticket
    Quando eu acesso o ticket "#201"
    E eu digito "Obrigada, mas tenho mais uma dúvida..."
    E eu clico em "Enviar"
    Então minha resposta deve ser adicionada
    E o suporte deve ser notificado

  @sucesso @interacao
  Cenário: Adicionar informações ao ticket
    Quando eu acesso meu ticket
    E eu clico em "Adicionar Informação"
    E eu descrevo mais detalhes
    E eu envio
    Então a informação deve ser adicionada ao ticket

  @sucesso @interacao
  Cenário: Marcar ticket como resolvido
    Dado que meu problema foi resolvido
    Quando eu acesso o ticket
    E eu clico em "Marcar como Resolvido"
    Então o ticket deve ser fechado
    E eu posso avaliar o atendimento

  @sucesso @interacao
  Cenário: Avaliar atendimento
    Dado que meu ticket foi resolvido
    Quando eu sou convidado a avaliar
    E eu dou 5 estrelas
    E eu adiciono comentário "Excelente atendimento!"
    E eu envio
    Então a avaliação deve ser registrada

  # ==========================================
  # CENÁRIOS DE SUCESSO - FAQ E AUTOATENDIMENTO
  # ==========================================

  @sucesso @faq
  Cenário: Buscar na FAQ
    Quando eu acesso a página de suporte
    E eu clico em "Perguntas Frequentes"
    Então eu devo ver as categorias de FAQ:
      | categoria               |
      | Agendamento             |
      | Cancelamento            |
      | Pagamentos              |
      | Meu Plano               |
      | Reposições              |

  @sucesso @faq
  Cenário: Pesquisar na FAQ
    Quando eu digito "como cancelar aula" na busca
    Então eu devo ver artigos relacionados:
      | artigo                                        |
      | Como cancelar uma aula agendada               |
      | Política de cancelamento                       |
      | Prazo para cancelamento sem penalidade        |

  @sucesso @faq
  Cenário: Resolver dúvida pela FAQ
    Quando eu encontro a resposta na FAQ
    E eu clico em "Isso respondeu sua dúvida?"
    E eu clico em "Sim"
    Então o feedback deve ser registrado
    E eu não preciso abrir ticket

  @sucesso @faq
  Cenário: Abrir ticket a partir da FAQ
    Quando eu leio um artigo da FAQ
    E minha dúvida não foi resolvida
    E eu clico em "Ainda preciso de ajuda"
    Então o formulário de ticket deve abrir com o contexto do artigo pré-preenchido

  # ==========================================
  # CENÁRIOS DE SUCESSO - CHAT
  # ==========================================

  @sucesso @chat
  Cenário: Iniciar chat com bot
    Quando eu clico no ícone de chat
    Então um assistente virtual deve iniciar a conversa
    E eu posso descrever meu problema

  @sucesso @chat
  Cenário: Bot resolve dúvida simples
    Quando eu pergunto ao bot "Qual o horário de funcionamento?"
    Então o bot deve responder com os horários do studio
    E perguntar se preciso de mais ajuda

  @sucesso @chat
  Cenário: Transferir chat para atendente humano
    Dado que estou conversando com o bot
    E minha dúvida é complexa
    Quando eu clico em "Falar com atendente"
    Então devo ser transferido para a fila de atendimento
    E ver minha posição na fila

  # ==========================================
  # CENÁRIOS DE SUCESSO - COMUNICAÇÃO DIRETA
  # ==========================================

  @sucesso @comunicacao
  Cenário: Enviar mensagem via WhatsApp
    Quando eu clico em "WhatsApp" na página de suporte
    Então devo ser redirecionado para o WhatsApp do studio com uma mensagem pré-formatada

  @sucesso @comunicacao
  Cenário: Ligar para o studio
    Quando eu clico em "Ligar"
    Então devo ver o número de telefone
    E opção de ligar diretamente (em mobile)

  # ==========================================
  # CENÁRIOS DE ERRO
  # ==========================================

  @erro
  Cenário: Enviar ticket sem assunto
    Quando eu tento criar um ticket sem preencher o assunto
    Então eu devo ver a mensagem de erro "Assunto é obrigatório"

  @erro
  Cenário: Enviar ticket sem mensagem
    Quando eu tento criar um ticket sem mensagem
    Então eu devo ver a mensagem de erro "Descreva seu problema ou dúvida"

  @erro
  Cenário: Anexar arquivo muito grande
    Quando eu tento anexar um arquivo de 15MB
    Então eu devo ver a mensagem "Arquivo muito grande. Máximo 10MB"

  @erro
  Cenário: Responder ticket fechado há muito tempo
    Dado que meu ticket foi fechado há 30 dias
    Quando eu tento responder
    Então eu devo ver "Este ticket está arquivado. Abra um novo ticket."

  # ==========================================
  # EDGE CASES
  # ==========================================

  @edge-case
  Cenário: Ticket urgente
    Quando eu crio um ticket
    E eu marco como "Urgente"
    E o motivo é válido (ex: problema no dia da aula)
    Então o ticket deve ter prioridade elevada
    E eu devo receber resposta mais rápida

  @edge-case
  Cenário: Feedback após resolução não satisfatória
    Dado que marquei o ticket como resolvido
    E avaliei com 2 estrelas
    Quando eu adiciono o comentário negativo
    Então o administrador deve ser notificado
    E eu devo ter opção de reabrir o caso

  @edge-case
  Cenário: Suporte fora do horário
    Dado que é fora do horário de atendimento (após 20h)
    Quando eu abro um ticket
    Então eu devo ver mensagem "Recebemos sua solicitação"
    E "Responderemos no próximo dia útil"

  @edge-case
  Cenário: Chat indisponível
    Dado que o chat não está disponível no momento
    Quando eu clico no ícone de chat
    Então eu devo ver "Chat offline no momento"
    E sugestão de abrir ticket ou consultar FAQ

  @edge-case
  Cenário: Reclamação grave
    Quando eu crio um ticket na categoria "Reclamação"
    E descrevo um problema grave
    Então o ticket deve ser escalado automaticamente
    E o administrador deve ser notificado imediatamente

  @edge-case
  Cenário: Múltiplos tickets sobre o mesmo assunto
    Dado que já tenho um ticket aberto sobre cancelamento
    Quando eu tento criar outro ticket sobre cancelamento
    Então eu devo ver "Você já tem um ticket aberto sobre este assunto"
    E link para o ticket existente

  @edge-case
  Cenário: Suporte multilíngue
    Dado que configurei meu idioma como "Inglês"
    Quando eu acesso a FAQ
    Então os artigos devem estar em inglês
    E o suporte deve responder no mesmo idioma
