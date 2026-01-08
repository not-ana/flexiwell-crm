# language: pt
@admin @rooms
Funcionalidade: Gerenciamento de Salas e Estabelecimentos
  Como um Admin/Owner do studio
  Eu quero gerenciar as salas e estabelecimentos
  Para organizar os espaços físicos do meu negócio

  Contexto:
    Dado que estou logado como admin
    E existem os seguintes estabelecimentos:
      | nome               | endereco                    | status |
      | Studio Centro      | Rua Augusta, 1000 - SP      | active |
      | Studio Jardins     | Av. Brasil, 500 - SP        | active |
    E existem as seguintes salas:
      | sala    | estabelecimento  | capacidade | equipamentos              |
      | Sala 1  | Studio Centro    | 10         | Colchonetes, Bolas        |
      | Sala 2  | Studio Centro    | 6          | Reformers (6)             |
      | Sala 3  | Studio Jardins   | 15         | Colchonetes, Blocos Yoga  |

  # ==========================================
  # CENÁRIOS DE SUCESSO - ESTABELECIMENTOS
  # ==========================================

  @sucesso @estabelecimento
  Cenário: Visualizar lista de estabelecimentos
    Quando eu acesso a página de salas/estabelecimentos
    Então eu devo ver a lista de estabelecimentos
    E cada estabelecimento deve exibir:
      | campo              |
      | Nome               |
      | Endereço           |
      | Número de salas    |
      | Status             |

  @sucesso @estabelecimento
  Cenário: Cadastrar novo estabelecimento
    Quando eu clico no botão "Novo Estabelecimento"
    E eu preencho os seguintes dados:
      | campo       | valor                       |
      | nome        | Studio Moema                |
      | endereco    | Av. Moema, 200 - SP         |
      | cep         | 04077-000                   |
      | telefone    | (11) 3456-7890              |
      | email       | moema@studio.com            |
    E eu clico no botão "Salvar"
    Então eu devo ver a mensagem "Estabelecimento cadastrado com sucesso!"
    E o estabelecimento deve aparecer na lista

  @sucesso @estabelecimento
  Cenário: Editar dados do estabelecimento
    Quando eu clico em "Editar" no "Studio Centro"
    E eu altero o telefone para "(11) 3333-4444"
    E eu clico no botão "Salvar"
    Então eu devo ver a mensagem "Estabelecimento atualizado com sucesso!"

  @sucesso @estabelecimento
  Cenário: Configurar horário de funcionamento
    Quando eu acesso as configurações do "Studio Centro"
    E eu defino os horários de funcionamento:
      | dia           | abertura | fechamento |
      | Segunda       | 06:00    | 22:00      |
      | Terça         | 06:00    | 22:00      |
      | Quarta        | 06:00    | 22:00      |
      | Quinta        | 06:00    | 22:00      |
      | Sexta         | 06:00    | 21:00      |
      | Sábado        | 08:00    | 14:00      |
      | Domingo       | Fechado  | Fechado    |
    E eu clico no botão "Salvar"
    Então os horários devem ser salvos

  # ==========================================
  # CENÁRIOS DE SUCESSO - SALAS
  # ==========================================

  @sucesso @sala
  Cenário: Visualizar salas de um estabelecimento
    Quando eu clico no "Studio Centro"
    Então eu devo ver a lista de salas do estabelecimento
    E cada sala deve exibir:
      | campo        |
      | Nome         |
      | Capacidade   |
      | Equipamentos |
      | Status       |

  @sucesso @sala
  Cenário: Cadastrar nova sala
    Quando eu acesso o "Studio Centro"
    E eu clico no botão "Nova Sala"
    E eu preencho os seguintes dados:
      | campo       | valor                  |
      | nome        | Sala 4                 |
      | capacidade  | 8                      |
      | descricao   | Sala para funcional    |
    E eu adiciono os equipamentos:
      | equipamento    | quantidade |
      | Kettlebells    | 10         |
      | Halteres       | 20         |
      | Steps          | 8          |
    E eu clico no botão "Salvar"
    Então eu devo ver a mensagem "Sala cadastrada com sucesso!"

  @sucesso @sala
  Cenário: Editar capacidade da sala
    Quando eu edito a "Sala 1"
    E eu altero a capacidade de 10 para 12
    E eu clico no botão "Salvar"
    Então a capacidade deve ser atualizada
    E as aulas futuras nesta sala devem refletir a nova capacidade

  @sucesso @sala
  Cenário: Adicionar equipamentos à sala
    Quando eu edito a "Sala 1"
    E eu adiciono o equipamento "Barril de Pilates" com quantidade 2
    E eu clico no botão "Salvar"
    Então o equipamento deve aparecer na lista da sala

  @sucesso @sala
  Cenário: Visualizar agenda da sala
    Quando eu clico em "Ver Agenda" na "Sala 1"
    Então eu devo ver o calendário de ocupação da sala com as aulas agendadas e horários disponíveis

  # ==========================================
  # CENÁRIOS DE SUCESSO - MANUTENÇÃO
  # ==========================================

  @sucesso @manutencao
  Cenário: Marcar sala em manutenção
    Quando eu edito a "Sala 2"
    E eu clico em "Marcar em Manutenção"
    E eu defino o período de "15/01/2024" até "17/01/2024"
    E eu adiciono o motivo "Troca de equipamentos"
    E eu confirmo
    Então a sala deve ser marcada como indisponível no período
    E as aulas agendadas no período devem ser sinalizadas para realocação

  @sucesso @manutencao
  Cenário: Liberar sala após manutenção
    Dado que a "Sala 2" está em manutenção
    Quando eu clico em "Liberar Sala"
    Então a sala deve voltar ao status ativo
    E deve estar disponível para agendamentos

  # ==========================================
  # CENÁRIOS DE ERRO
  # ==========================================

  @erro @estabelecimento
  Cenário: Cadastrar estabelecimento com nome duplicado
    Quando eu tento cadastrar um estabelecimento com nome "Studio Centro"
    Então eu devo ver a mensagem de erro "Já existe um estabelecimento com este nome"

  @erro @sala
  Cenário: Cadastrar sala com nome duplicado no mesmo estabelecimento
    Quando eu tento cadastrar uma sala "Sala 1" no "Studio Centro"
    Então eu devo ver a mensagem de erro "Já existe uma sala com este nome neste estabelecimento"

  @erro @sala
  Cenário: Reduzir capacidade abaixo das aulas agendadas
    Dado que existem aulas na "Sala 1" com 10 inscritos
    Quando eu tento reduzir a capacidade para 8
    Então eu devo ver a mensagem de erro "Existem aulas com mais inscritos que a nova capacidade"

  @erro @manutencao
  Cenário: Colocar sala em manutenção com aulas confirmadas
    Dado que existem aulas confirmadas na "Sala 1" para amanhã
    Quando eu tento marcar a sala em manutenção para amanhã
    Então eu devo ver um aviso "Existem 3 aulas agendadas no período"
    E eu devo escolher entre cancelar aulas ou realocá-las

  @erro @estabelecimento
  Cenário: Desativar estabelecimento com aulas futuras
    Dado que o "Studio Jardins" tem aulas agendadas
    Quando eu tento desativar o estabelecimento
    Então eu devo ver a mensagem "Estabelecimento possui aulas agendadas"
    E eu devo primeiro realoca-las ou cancelá-las

  # ==========================================
  # EDGE CASES
  # ==========================================

  @edge-case
  Cenário: Sala com equipamento em quantidade insuficiente para aula
    Dado que "Sala 2" tem 6 Reformers
    Quando eu tento criar uma aula com capacidade 8
    Então eu devo ver um aviso "A sala possui apenas 6 Reformers"
    E eu posso ajustar a capacidade ou escolher outra sala

  @edge-case
  Cenário: Transferir aulas entre salas
    Dado que a "Sala 1" entrará em manutenção
    Quando eu acesso "Transferir Aulas"
    E eu seleciono a "Sala 3" como destino
    E eu confirmo a transferência
    Então todas as aulas do período devem ser movidas
    E os alunos devem ser notificados da mudança de local

  @edge-case
  Cenário: Visualizar taxa de ocupação das salas
    Quando eu acesso "Relatórios" > "Ocupação de Salas"
    Então eu devo ver a taxa de ocupação por sala:
      | sala    | ocupacao |
      | Sala 1  | 75%      |
      | Sala 2  | 90%      |
      | Sala 3  | 60%      |

  @edge-case
  Cenário: Sala compartilhada entre tipos de aula incompatíveis
    Dado que a "Sala 2" é específica para Pilates Reformer
    Quando eu tento agendar uma aula de Funcional na "Sala 2"
    Então eu devo ver um aviso "Esta sala é recomendada para aulas que usam Reformer"
    E eu posso forçar o agendamento ou escolher outra sala

  @edge-case
  Cenário: Acessibilidade da sala
    Quando eu cadastro uma nova sala
    E eu marco as características de acessibilidade:
      | caracteristica           |
      | Acesso para cadeirantes  |
      | Banheiro adaptado        |
      | Piso antiderrapante      |
    E eu clico em "Salvar"
    Então as características devem ser exibidas na descrição da sala

  @edge-case
  Cenário: Histórico de manutenções da sala
    Quando eu acesso "Histórico" da "Sala 2"
    Então eu devo ver todas as manutenções anteriores com data, motivo e duração

  @edge-case
  Cenário: Múltiplos estabelecimentos em cidades diferentes
    Dado que tenho estabelecimentos em São Paulo e Rio de Janeiro
    Quando eu acesso a página de estabelecimentos
    Então eu devo poder filtrar por cidade/região
    E ver estatísticas consolidadas ou por localidade
