# language: pt
@teacher @support
Funcionalidade: Suporte para Instrutores
  Como um Instrutor/Professor do studio
  Eu quero acessar o suporte do sistema
  Para resolver problemas e tirar dúvidas sobre a plataforma

  Contexto:
    Dado que estou logado como instrutor "Maria Silva"
    E tenho os seguintes tickets abertos:
      | id    | titulo                       | categoria | status      | criado    |
      | #101  | Erro ao registrar presença   | technical | open        | Há 2 dias |
      | #102  | Dúvida sobre reposições      | help      | in_progress | Há 5 dias |

  # ==========================================
  # CENÁRIOS DE SUCESSO - CRIAÇÃO DE TICKET
  # ==========================================

  @sucesso @criacao
  Cenário: Criar novo ticket de suporte
    Quando eu acesso a página de suporte
    E eu clico em "Novo Ticket"
    E eu preencho:
      | campo      | valor                                    |
      | titulo     | Sistema não salva presença               |
      | categoria  | Problema técnico                         |
      | prioridade | Alta                                     |
      | descricao  | Ao tentar salvar presença da aula de...  |
    E eu clico em "Enviar"
    Então o ticket deve ser criado
    E eu devo ver a mensagem "Ticket criado com sucesso!"
    E eu devo receber um email de confirmação

  @sucesso @criacao
  Cenário: Criar ticket com anexo
    Quando eu crio um novo ticket
    E eu anexo uma captura de tela do erro
    E eu envio
    Então o anexo deve ser incluído no ticket
    E o suporte poderá visualizar a imagem

  @sucesso @criacao
  Cenário: Criar ticket a partir de contexto
    Dado que estou na página de registro de presença
    E há um erro na tela
    Quando eu clico em "Reportar Problema"
    Então o formulário deve ser pré-preenchido com informações do contexto

  # ==========================================
  # CENÁRIOS DE SUCESSO - VISUALIZAÇÃO
  # ==========================================

  @sucesso @visualizacao
  Cenário: Visualizar meus tickets
    Quando eu acesso a página de suporte
    Então eu devo ver a lista dos meus tickets:
      | campo        |
      | ID           |
      | Título       |
      | Categoria    |
      | Status       |
      | Última atualização |

  @sucesso @visualizacao
  Cenário: Visualizar detalhes do ticket
    Quando eu clico no ticket "#101"
    Então eu devo ver os detalhes completos:
      | campo       | valor                        |
      | Título      | Erro ao registrar presença   |
      | Status      | Aberto                       |
      | Prioridade  | Alta                         |
      | Criado em   | 13/01/2024                   |
    E eu devo ver o histórico de mensagens

  @sucesso @visualizacao
  Cenário: Visualizar resposta do suporte
    Dado que o suporte respondeu meu ticket
    Quando eu acesso o ticket
    Então eu devo ver a resposta do suporte
    E eu devo poder responder de volta

  # ==========================================
  # CENÁRIOS DE SUCESSO - INTERAÇÃO
  # ==========================================

  @sucesso @interacao
  Cenário: Responder ticket
    Quando eu acesso o ticket "#102"
    E eu digito uma resposta "Obrigada, mas ainda tenho uma dúvida..."
    E eu clico em "Enviar"
    Então a resposta deve ser adicionada ao ticket
    E o suporte deve ser notificado

  @sucesso @interacao
  Cenário: Adicionar mais informações ao ticket
    Quando eu acesso meu ticket aberto
    E eu clico em "Adicionar Informação"
    E eu descrevo mais detalhes do problema
    E eu envio
    Então a informação deve ser adicionada
    E o ticket deve ser movido para o topo da fila

  @sucesso @interacao
  Cenário: Marcar ticket como resolvido
    Dado que o suporte resolveu meu problema
    Quando eu acesso o ticket
    E eu clico em "Marcar como Resolvido"
    Então o ticket deve ser fechado
    E eu posso ser convidado a avaliar o atendimento

  @sucesso @interacao
  Cenário: Reabrir ticket resolvido
    Dado que meu ticket "#102" foi marcado como resolvido
    E o problema voltou a acontecer
    Quando eu clico em "Reabrir"
    E eu descrevo o motivo
    E eu confirmo
    Então o ticket deve ser reaberto
    E o suporte deve ser notificado

  # ==========================================
  # CENÁRIOS DE SUCESSO - FAQ E AUTOATENDIMENTO
  # ==========================================

  @sucesso @faq
  Cenário: Buscar na FAQ antes de criar ticket
    Quando eu acesso a página de suporte
    E eu clico em "Buscar na FAQ"
    E eu digito "como registrar presença"
    Então eu devo ver artigos relacionados
    E eu posso resolver minha dúvida sem abrir ticket

  @sucesso @faq
  Cenário: Acessar guias e tutoriais
    Quando eu acesso a seção "Ajuda"
    Então eu devo ver tutoriais disponíveis:
      | tutorial                              |
      | Como registrar presença               |
      | Como agendar reposições               |
      | Como visualizar histórico de alunos   |
      | Como solicitar substituição           |

  # ==========================================
  # CENÁRIOS DE SUCESSO - NOTIFICAÇÕES
  # ==========================================

  @sucesso @notificacao
  Cenário: Receber notificação de resposta
    Dado que o suporte respondeu meu ticket
    Quando eu acesso o sistema
    Então eu devo ver uma notificação "Seu ticket #101 foi respondido"
    E um badge no menu de suporte

  @sucesso @notificacao
  Cenário: Receber email sobre atualização
    Dado que configurei para receber emails de suporte
    Quando meu ticket é atualizado
    Então eu devo receber um email com link direto para o ticket

  # ==========================================
  # CENÁRIOS DE ERRO
  # ==========================================

  @erro
  Cenário: Criar ticket sem campos obrigatórios
    Quando eu tento criar um ticket sem título
    Então eu devo ver a mensagem de erro "Título é obrigatório"

  @erro
  Cenário: Enviar resposta vazia
    Quando eu tento enviar uma resposta sem conteúdo
    Então eu devo ver a mensagem de erro "Mensagem não pode estar vazia"

  @erro
  Cenário: Anexar arquivo muito grande
    Quando eu tento anexar um arquivo de 20MB
    Então eu devo ver a mensagem de erro "Arquivo muito grande. Máximo 10MB"

  @erro
  Cenário: Anexar arquivo de tipo não permitido
    Quando eu tento anexar um arquivo .exe
    Então eu devo ver a mensagem de erro "Tipo de arquivo não permitido"

  # ==========================================
  # EDGE CASES
  # ==========================================

  @edge-case
  Cenário: Ticket urgente para aula em andamento
    Dado que estou com problema na aula que está acontecendo agora
    Quando eu crio um ticket urgente
    E eu marco "Preciso de ajuda imediata"
    Então o ticket deve ter prioridade máxima
    E o admin deve ser notificado imediatamente

  @edge-case
  Cenário: Sugestão de melhoria
    Quando eu acesso "Enviar Sugestão"
    E eu descrevo uma ideia de melhoria para o sistema
    E eu envio
    Então a sugestão deve ser registrada separada dos tickets de suporte

  @edge-case
  Cenário: Problema afetando múltiplos instrutores
    Dado que um problema está afetando todos os instrutores
    E já existe um ticket similar aberto por outro instrutor
    Quando eu crio um ticket sobre o mesmo problema
    Então eu devo ser notificado "Um problema similar já foi reportado"
    E eu posso me inscrever para atualizações

  @edge-case
  Cenário: Ticket aberto há muito tempo sem resposta
    Dado que meu ticket está aberto há 5 dias sem resposta
    Quando eu acesso o ticket
    Então eu devo ver opção "Solicitar Priorização"
    E ao solicitar, o ticket deve ser escalado

  @edge-case
  Cenário: Feedback sobre resolução
    Dado que meu ticket foi resolvido
    Quando eu sou convidado a avaliar
    Então eu posso dar uma nota de 1 a 5 estrelas
    E adicionar um comentário sobre o atendimento

  @edge-case
  Cenário: Chat ao vivo com suporte
    Dado que o chat ao vivo está disponível
    Quando eu clico em "Chat ao Vivo"
    Então eu devo poder conversar em tempo real com o suporte
    E o histórico deve ser salvo para referência
