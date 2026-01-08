# language: pt
@admin @conversations
Funcionalidade: Gerenciamento de Conversas
  Como um Admin/Owner do studio
  Eu quero gerenciar as conversas com clientes via WhatsApp e Instagram
  Para manter uma comunicação eficiente e centralizada

  Contexto:
    Dado que estou logado como admin
    E as integrações de WhatsApp e Instagram estão ativas
    E existem as seguintes conversas:
      | cliente       | canal      | ultima_msg   | status     | nao_lidas |
      | Ana Souza     | WhatsApp   | Há 5 min     | open       | 3         |
      | Bruno Costa   | Instagram  | Há 1 hora    | open       | 1         |
      | Carla Lima    | WhatsApp   | Há 2 dias    | closed     | 0         |
      | Diego Santos  | Instagram  | Há 30 min    | pending    | 2         |

  # ==========================================
  # CENÁRIOS DE SUCESSO - LISTAGEM
  # ==========================================

  @sucesso @listagem
  Cenário: Visualizar lista de conversas
    Quando eu acesso a página de conversas
    Então eu devo ver a lista de todas as conversas
    E cada conversa deve exibir:
      | campo             |
      | Avatar/foto       |
      | Nome do cliente   |
      | Canal (ícone)     |
      | Preview da última mensagem |
      | Horário           |
      | Badge de não lidas |

  @sucesso @listagem
  Cenário: Filtrar conversas por canal
    Quando eu seleciono o filtro "WhatsApp"
    Então eu devo ver apenas as conversas de WhatsApp
    E eu não devo ver conversas de Instagram

  @sucesso @listagem
  Cenário: Filtrar conversas por status
    Quando eu seleciono o filtro "Abertas"
    Então eu devo ver apenas as conversas com status "open"

  @sucesso @listagem
  Cenário: Buscar conversa por nome do cliente
    Quando eu digito "Ana" no campo de busca
    Então eu devo ver apenas a conversa com "Ana Souza"

  @sucesso @listagem
  Cenário: Ordenar por mensagens não lidas
    Quando eu ordeno por "Não lidas primeiro"
    Então as conversas com mensagens não lidas devem aparecer primeiro

  # ==========================================
  # CENÁRIOS DE SUCESSO - VISUALIZAÇÃO
  # ==========================================

  @sucesso @visualizacao
  Cenário: Visualizar conversa completa
    Quando eu clico na conversa com "Ana Souza"
    Então eu devo ver o histórico completo de mensagens
    E cada mensagem deve exibir:
      | campo           |
      | Texto/conteúdo  |
      | Horário         |
      | Status (enviado/entregue/lido) |
      | Remetente       |

  @sucesso @visualizacao
  Cenário: Visualizar informações do cliente na conversa
    Quando eu acesso a conversa com "Ana Souza"
    Então eu devo ver o painel lateral com:
      | informacao       | valor         |
      | Nome             | Ana Souza     |
      | Plano            | Mensal        |
      | Aulas restantes  | 5             |
      | Última aula      | 10/01/2024    |
      | Status           | Ativa         |

  @sucesso @visualizacao
  Cenário: Visualizar mídia enviada/recebida
    Quando eu acesso a conversa que contém imagens
    Então as imagens devem ser exibidas inline
    E eu posso clicar para ver em tamanho maior

  # ==========================================
  # CENÁRIOS DE SUCESSO - ENVIO DE MENSAGENS
  # ==========================================

  @sucesso @envio
  Cenário: Enviar mensagem de texto via WhatsApp
    Quando eu acesso a conversa com "Ana Souza"
    E eu digito "Olá Ana, sua aula está confirmada!"
    E eu clico em "Enviar"
    Então a mensagem deve ser enviada via WhatsApp
    E deve aparecer na conversa com status "Enviado"

  @sucesso @envio
  Cenário: Enviar imagem via WhatsApp
    Quando eu acesso a conversa
    E eu clico em "Anexar Imagem"
    E eu seleciono uma imagem
    E eu adiciono uma legenda "Grade de horários atualizada"
    E eu clico em "Enviar"
    Então a imagem deve ser enviada
    E deve aparecer na conversa

  @sucesso @envio
  Cenário: Enviar mensagem via Instagram DM
    Quando eu acesso a conversa de Instagram com "Bruno Costa"
    E eu envio uma mensagem
    Então a mensagem deve ser enviada via Instagram API
    E deve aparecer na conversa

  @sucesso @envio
  Cenário: Usar template de mensagem
    Quando eu clico em "Templates"
    E eu seleciono o template "Confirmação de Aula"
    Então o texto do template deve preencher o campo de mensagem com variáveis substituídas (nome, horário, etc.)

  @sucesso @envio
  Cenário: Enviar link de agendamento
    Quando eu clico em "Enviar Link de Agendamento"
    E eu seleciono a aula disponível
    Então um link de agendamento deve ser gerado e enviado
    E o cliente pode confirmar clicando no link

  # ==========================================
  # CENÁRIOS DE SUCESSO - GERENCIAMENTO
  # ==========================================

  @sucesso @gerenciamento
  Cenário: Marcar conversa como resolvida
    Quando eu acesso a conversa com "Ana Souza"
    E eu clico em "Marcar como Resolvida"
    Então o status deve mudar para "closed"
    E a conversa deve ir para a lista de arquivadas

  @sucesso @gerenciamento
  Cenário: Atribuir conversa a outro membro da equipe
    Quando eu clico em "Atribuir"
    E eu seleciono "Maria Silva" (recepcionista)
    E eu confirmo
    Então a conversa deve ser atribuída a Maria
    E ela deve ser notificada

  @sucesso @gerenciamento
  Cenário: Adicionar tag/etiqueta à conversa
    Quando eu clico em "Adicionar Tag"
    E eu seleciono "Interessado em plano anual"
    Então a tag deve ser adicionada à conversa
    E eu posso filtrar por esta tag depois

  @sucesso @gerenciamento
  Cenário: Arquivar conversa antiga
    Quando eu clico em "Arquivar" na conversa de "Carla Lima"
    Então a conversa deve ser arquivada
    E não deve aparecer na lista principal
    E eu posso acessar em "Arquivadas"

  # ==========================================
  # CENÁRIOS DE SUCESSO - AUTOMAÇÃO
  # ==========================================

  @sucesso @automacao
  Cenário: Resposta automática fora do horário
    Dado que é fora do horário comercial (após 22h)
    Quando um cliente envia uma mensagem
    Então uma resposta automática deve ser enviada:
      | mensagem                                              |
      | Olá! Obrigado por entrar em contato.                 |
      | Nosso horário de atendimento é de 8h às 22h.         |
      | Responderemos assim que possível!                    |

  @sucesso @automacao
  Cenário: Identificar intenção e sugerir resposta
    Dado que o cliente perguntou "Qual o preço?"
    Quando eu acesso a conversa
    Então o sistema deve sugerir uma resposta automática com informações sobre os planos e preços

  @sucesso @automacao
  Cenário: Criar cliente automaticamente de conversa
    Dado que recebi mensagem de um número não cadastrado
    Quando eu clico em "Criar Cliente"
    Então um formulário deve aparecer com o telefone já preenchido
    E eu posso completar os dados e salvar

  # ==========================================
  # CENÁRIOS DE ERRO
  # ==========================================

  @erro @envio
  Cenário: Enviar mensagem para cliente que bloqueou
    Dado que o cliente "Diego Santos" bloqueou nosso número
    Quando eu tento enviar uma mensagem
    Então eu devo ver a mensagem de erro "Não foi possível entregar a mensagem"
    E o status deve mostrar "Falha no envio"

  @erro @envio
  Cenário: Enviar mensagem com arquivo muito grande
    Quando eu tento enviar um arquivo de 20MB
    Então eu devo ver a mensagem de erro "Arquivo muito grande. Máximo permitido: 16MB"

  @erro @integracao
  Cenário: Integração do WhatsApp desconectada
    Dado que o token do Twilio expirou
    Quando eu tento enviar uma mensagem
    Então eu devo ver "Integração do WhatsApp desconectada"
    E eu devo ter link para reconectar

  @erro @integracao
  Cenário: Limite de mensagens do WhatsApp Business
    Dado que atingi o limite de mensagens do período
    Quando eu tento enviar mensagem
    Então eu devo ver "Limite de mensagens atingido"
    E informação sobre quando o limite será renovado

  # ==========================================
  # EDGE CASES
  # ==========================================

  @edge-case
  Cenário: Conversa com cliente não cadastrado
    Dado que recebi mensagem de número não cadastrado
    Quando eu acesso a conversa
    Então eu devo ver "Cliente não identificado"
    E eu devo ter opção de:
      | acao                        |
      | Associar a cliente existente|
      | Criar novo cliente          |
      | Marcar como lead            |

  @edge-case
  Cenário: Múltiplas conversas do mesmo cliente
    Dado que "Ana Souza" tem conversas via WhatsApp e Instagram
    Quando eu acesso "Ver Todas"
    Então eu devo ver ambas as conversas
    E posso unificar em uma única thread

  @edge-case
  Cenário: Mensagem com emoji e caracteres especiais
    Quando o cliente envia "Oi! Adorei a aula"
    Então os emojis devem ser exibidos corretamente
    E a mensagem deve ser armazenada sem erros

  @edge-case
  Cenário: Cliente responde mensagem antiga
    Dado que a última conversa foi há 30 dias
    Quando o cliente responde
    Então a conversa deve ser reaberta
    E o admin deve ser notificado

  @edge-case
  Cenário: Sincronização de mensagens antigas
    Quando eu conecto a integração do Instagram
    Então as mensagens dos últimos 7 dias devem ser importadas
    E organizadas cronologicamente

  @edge-case
  Cenário: Mensagem de áudio/voz
    Quando o cliente envia um áudio via WhatsApp
    Então o áudio deve ser exibido com player
    E eu posso ouvir sem sair da conversa

  @edge-case
  Cenário: Localização compartilhada
    Quando o cliente envia sua localização
    Então um mini-mapa deve ser exibido
    E eu posso clicar para abrir no Google Maps

  @edge-case
  Cenário: Horário de pico com muitas mensagens
    Dado que estou recebendo 50+ mensagens por minuto
    Quando eu acesso a página de conversas
    Então o sistema deve manter performance
    E notificações devem ser agrupadas para não sobrecarregar
