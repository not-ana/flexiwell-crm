# language: pt
@admin @waitlist
Funcionalidade: Gerenciamento de Lista de Espera
  Como um Admin/Owner do studio
  Eu quero gerenciar a lista de espera de aulas
  Para otimizar a ocupação das turmas e satisfação dos clientes

  Contexto:
    Dado que estou logado como admin
    E existem as seguintes aulas com lista de espera:
      | aula             | data       | horario | capacidade | inscritos | espera |
      | Pilates Reformer | 2024-01-15 | 09:00   | 6          | 6         | 3      |
      | Yoga Flow        | 2024-01-15 | 18:00   | 15         | 15        | 5      |
    E a lista de espera de "Pilates Reformer" contém:
      | posicao | cliente       | data_entrada        | prioridade |
      | 1       | Ana Souza     | 2024-01-10 08:00    | alta       |
      | 2       | Bruno Costa   | 2024-01-10 10:00    | normal     |
      | 3       | Carla Lima    | 2024-01-11 14:00    | normal     |

  # ==========================================
  # CENÁRIOS DE SUCESSO - LISTAGEM
  # ==========================================

  @sucesso @listagem
  Cenário: Visualizar lista de espera geral
    Quando eu acesso a página de lista de espera
    Então eu devo ver todas as aulas que possuem lista de espera
    E cada aula deve exibir o número de pessoas aguardando

  @sucesso @listagem
  Cenário: Visualizar detalhes da lista de espera de uma aula
    Quando eu clico na aula "Pilates Reformer"
    Então eu devo ver a lista de espera com:
      | campo              |
      | Posição na fila    |
      | Nome do cliente    |
      | Data de entrada    |
      | Prioridade         |
      | Preferências       |
      | Ações              |

  @sucesso @listagem
  Cenário: Filtrar lista de espera por período
    Quando eu seleciono o filtro "Período" com valor "Esta semana"
    Então eu devo ver apenas as listas de espera de aulas desta semana

  @sucesso @listagem
  Cenário: Filtrar por tipo de aula
    Quando eu seleciono o filtro "Tipo" com valor "Pilates"
    Então eu devo ver apenas listas de espera de aulas de Pilates

  # ==========================================
  # CENÁRIOS DE SUCESSO - GERENCIAMENTO MANUAL
  # ==========================================

  @sucesso @gerenciamento
  Cenário: Adicionar cliente à lista de espera manualmente
    Quando eu acesso a lista de espera de "Yoga Flow"
    E eu clico em "Adicionar à Fila"
    E eu seleciono o cliente "Diego Santos"
    E eu defino a prioridade como "Normal"
    E eu clico em "Adicionar"
    Então o cliente deve ser adicionado à posição 6 da fila
    E eu devo ver a mensagem "Cliente adicionado à lista de espera"

  @sucesso @gerenciamento
  Cenário: Promover cliente na lista de espera
    Quando eu acesso a lista de espera de "Pilates Reformer"
    E eu clico em "Promover" no cliente "Bruno Costa"
    Então "Bruno Costa" deve subir para a posição 1
    E "Ana Souza" deve ir para a posição 2

  @sucesso @gerenciamento
  Cenário: Remover cliente da lista de espera
    Quando eu acesso a lista de espera de "Pilates Reformer"
    E eu clico em "Remover" no cliente "Carla Lima"
    E eu confirmo a remoção
    Então o cliente deve ser removido da lista
    E a fila deve ser reorganizada

  @sucesso @gerenciamento
  Cenário: Mover cliente para inscritos quando abre vaga
    Dado que um aluno inscrito cancelou a aula "Pilates Reformer"
    Quando eu acesso a lista de espera
    E eu clico em "Mover para Inscritos" no primeiro da fila "Ana Souza"
    Então "Ana Souza" deve ser transferida para a lista de inscritos
    E as aulas do plano dela devem ser debitadas
    E ela deve receber uma notificação de confirmação

  # ==========================================
  # CENÁRIOS DE SUCESSO - NOTIFICAÇÕES
  # ==========================================

  @sucesso @notificacao
  Cenário: Notificar próximo da fila sobre vaga disponível
    Dado que abriu uma vaga na aula "Pilates Reformer"
    Quando o sistema processa a lista de espera
    Então "Ana Souza" (primeira da fila) deve receber notificação via:
      | canal       |
      | WhatsApp    |
      | Email       |
      | Push        |
    E a notificação deve conter link para confirmar a vaga

  @sucesso @notificacao
  Cenário: Definir tempo limite para confirmação
    Dado que "Ana Souza" foi notificada sobre vaga disponível
    Quando ela não responder em 2 horas
    Então a vaga deve ser oferecida para "Bruno Costa" (próximo da fila)
    E "Ana Souza" deve receber aviso de perda da vez

  @sucesso @notificacao
  Cenário: Cliente confirma vaga via link
    Dado que "Ana Souza" recebeu notificação de vaga
    Quando ela clica no link de confirmação dentro do prazo
    Então ela deve ser automaticamente inscrita na aula
    E removida da lista de espera
    E os créditos do plano devem ser debitados

  # ==========================================
  # CENÁRIOS DE SUCESSO - CONFIGURAÇÕES
  # ==========================================

  @sucesso @config
  Cenário: Configurar prioridades da lista de espera
    Quando eu acesso "Configurações" da lista de espera
    E eu defino as seguintes prioridades:
      | criterio                    | peso |
      | Plano anual                 | 3    |
      | Plano trimestral            | 2    |
      | Tempo na lista              | 1    |
      | Cliente frequente (>20 aulas)| 2   |
    E eu clico em "Salvar"
    Então as prioridades devem ser aplicadas automaticamente

  @sucesso @config
  Cenário: Configurar tempo de expiração da oferta de vaga
    Quando eu acesso "Configurações" da lista de espera
    E eu defino o tempo de expiração como 4 horas
    E eu clico em "Salvar"
    Então as ofertas de vaga devem expirar após 4 horas

  @sucesso @config
  Cenário: Ativar/desativar lista de espera por tipo de aula
    Quando eu acesso "Configurações" da lista de espera
    E eu desativo lista de espera para "Aulas Avulsas"
    E eu clico em "Salvar"
    Então aulas avulsas não devem permitir fila de espera

  # ==========================================
  # CENÁRIOS DE SUCESSO - AUTOMAÇÃO INTELIGENTE
  # ==========================================

  @sucesso @automacao
  Cenário: Sistema sugere aulas alternativas para clientes na espera
    Dado que "Ana Souza" está na lista de espera de "Pilates Reformer - Segunda 09:00"
    Quando há vagas disponíveis em "Pilates Reformer - Quarta 09:00"
    Então o sistema deve sugerir a aula alternativa para Ana
    E a sugestão deve considerar suas preferências de horário

  @sucesso @automacao
  Cenário: Preenchimento automático de vagas
    Dado que a configuração "Preenchimento Automático" está ativa
    Quando uma vaga abre em "Yoga Flow"
    Então o sistema deve automaticamente:
      | passo                                    |
      | Identificar primeiro da fila elegível   |
      | Verificar disponibilidade de créditos   |
      | Inscrever automaticamente               |
      | Notificar sobre a inscrição             |
      | Debitar créditos do plano               |

  # ==========================================
  # CENÁRIOS DE ERRO
  # ==========================================

  @erro
  Cenário: Adicionar cliente sem plano ativo à lista de espera
    Dado que "Diego Santos" não possui plano ativo
    Quando eu tento adicioná-lo à lista de espera
    Então eu devo ver a mensagem de erro "Cliente não possui plano ativo"

  @erro
  Cenário: Adicionar cliente que já está na lista
    Dado que "Ana Souza" já está na lista de espera de "Pilates Reformer"
    Quando eu tento adicioná-la novamente
    Então eu devo ver a mensagem de erro "Cliente já está na lista de espera desta aula"

  @erro
  Cenário: Adicionar cliente que já está inscrito
    Dado que "Maria Silva" já está inscrita em "Pilates Reformer"
    Quando eu tento adicioná-la à lista de espera
    Então eu devo ver a mensagem de erro "Cliente já está inscrito nesta aula"

  @erro
  Cenário: Mover para inscritos sem créditos disponíveis
    Dado que abriu vaga em "Pilates Reformer"
    E "Ana Souza" não tem mais aulas no plano
    Quando eu tento movê-la para inscritos
    Então eu devo ver a mensagem "Cliente sem créditos disponíveis"
    E eu devo ter opção de atribuir aula avulsa ou renovar plano

  # ==========================================
  # EDGE CASES
  # ==========================================

  @edge-case
  Cenário: Lista de espera para aula cancelada
    Dado que a aula "Pilates Reformer" foi cancelada
    Quando eu acesso a lista de espera
    Então todos os clientes devem ser notificados do cancelamento
    E devem ser oferecidas aulas alternativas

  @edge-case
  Cenário: Cliente na lista de espera de múltiplas aulas do mesmo horário
    Dado que "Ana Souza" está na lista de espera de 3 aulas no mesmo horário
    Quando abre vaga em uma delas
    E ela confirma
    Então ela deve ser automaticamente removida das outras listas de espera do mesmo horário

  @edge-case
  Cenário: Vaga abre fora do horário comercial
    Dado que uma vaga abriu às 23:00
    E o primeiro da fila é "Ana Souza"
    Quando o sistema processa a lista de espera
    Então a notificação deve ser enviada imediatamente
    Mas o tempo de expiração deve considerar horário comercial

  @edge-case
  Cenário: Múltiplas vagas abrem simultaneamente
    Dado que 3 alunos cancelaram a aula "Yoga Flow" ao mesmo tempo
    Quando o sistema processa a lista de espera
    Então os 3 primeiros da fila devem ser notificados em ordem com intervalo de segundos para evitar conflitos

  @edge-case
  Cenário: Cliente não responde e perde múltiplas ofertas
    Dado que "Bruno Costa" já perdeu 3 ofertas de vaga por não responder
    Quando uma nova vaga abre
    Então ele deve ser pulado temporariamente
    E o sistema deve notificar o admin sobre o padrão

  @edge-case
  Cenário: Preferências específicas de horário do cliente
    Dado que "Ana Souza" definiu preferência apenas por aulas até 12:00
    E abriu vaga em uma aula às 18:00
    Quando o sistema processa a lista de espera
    Então "Ana Souza" deve ser pulada
    E o próximo da fila compatível deve ser notificado
