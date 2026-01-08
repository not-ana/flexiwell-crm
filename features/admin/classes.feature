# language: pt
@admin @classes
Funcionalidade: Gerenciamento de Aulas
  Como um Admin/Owner do studio
  Eu quero gerenciar as aulas do meu studio
  Para organizar a grade de horários e oferta de serviços

  Contexto:
    Dado que estou logado como admin
    E existem os seguintes tipos de aula:
      | tipo             | duracao | capacidade_padrao |
      | Pilates Mat      | 60min   | 10                |
      | Pilates Reformer | 50min   | 6                 |
      | Yoga Flow        | 75min   | 15                |
      | Funcional        | 45min   | 12                |
    E existem as seguintes aulas agendadas:
      | aula             | data       | horario | instrutor    | sala      | inscritos |
      | Pilates Mat      | 2024-01-15 | 07:00   | Maria Silva  | Sala 1    | 8/10      |
      | Pilates Reformer | 2024-01-15 | 09:00   | João Santos  | Sala 2    | 6/6       |
      | Yoga Flow        | 2024-01-15 | 18:00   | Ana Costa    | Sala 1    | 10/15     |

  # ==========================================
  # CENÁRIOS DE SUCESSO - LISTAGEM
  # ==========================================

  @sucesso @listagem
  Cenário: Visualizar grade de aulas semanal
    Quando eu acesso a página de aulas
    Então eu devo ver a grade de aulas da semana com as aulas organizadas por dia e horário
    E cada aula deve exibir tipo, instrutor e ocupação

  @sucesso @listagem
  Cenário: Visualizar aulas em modo calendário
    Quando eu acesso a página de aulas
    E eu seleciono a visualização "Calendário"
    Então eu devo ver as aulas em formato de calendário mensal
    E eu posso navegar entre os meses

  @sucesso @listagem
  Cenário: Filtrar aulas por tipo
    Quando eu seleciono o filtro "Tipo" com valor "Pilates"
    Então eu devo ver apenas as aulas de Pilates
    E eu não devo ver "Yoga Flow" na lista

  @sucesso @listagem
  Cenário: Filtrar aulas por instrutor
    Quando eu seleciono o filtro "Instrutor" com valor "Maria Silva"
    Então eu devo ver apenas as aulas da Maria Silva

  @sucesso @listagem
  Cenário: Filtrar aulas por sala
    Quando eu seleciono o filtro "Sala" com valor "Sala 1"
    Então eu devo ver apenas as aulas na Sala 1

  # ==========================================
  # CENÁRIOS DE SUCESSO - CRIAÇÃO
  # ==========================================

  @sucesso @criacao
  Cenário: Criar nova aula única
    Quando eu clico no botão "Nova Aula"
    E eu preencho os seguintes dados:
      | campo           | valor            |
      | tipo            | Pilates Mat      |
      | data            | 20/01/2024       |
      | horario         | 10:00            |
      | instrutor       | Maria Silva      |
      | sala            | Sala 1           |
      | capacidade      | 10               |
    E eu clico no botão "Criar Aula"
    Então eu devo ver a mensagem "Aula criada com sucesso!"
    E a aula deve aparecer na grade

  @sucesso @criacao
  Cenário: Criar aula recorrente semanal
    Quando eu clico no botão "Nova Aula"
    E eu preencho os dados básicos da aula
    E eu marco a opção "Aula Recorrente"
    E eu seleciono "Semanal" como frequência
    E eu seleciono os dias "Segunda, Quarta, Sexta"
    E eu defino o período de "01/02/2024" até "30/04/2024"
    E eu clico no botão "Criar Aula"
    Então todas as ocorrências devem ser criadas no período
    E eu devo ver a mensagem "36 aulas criadas com sucesso!"

  @sucesso @criacao
  Cenário: Criar aula com capacidade personalizada
    Quando eu crio uma nova aula de "Pilates Reformer"
    E eu defino a capacidade como 4 (menor que o padrão de 6)
    E eu clico no botão "Criar Aula"
    Então a aula deve ser criada com capacidade de 4 alunos

  @sucesso @criacao
  Cenário: Criar aula especial/workshop
    Quando eu clico no botão "Nova Aula"
    E eu seleciono o tipo "Workshop Especial"
    E eu preencho:
      | campo       | valor                        |
      | titulo      | Workshop de Pilates Avançado |
      | descricao   | Técnicas avançadas...        |
      | duracao     | 180min                       |
      | valor_extra | R$150,00                     |
    E eu clico no botão "Criar Aula"
    Então o workshop deve ser criado como evento especial
    E deve aparecer destacado na grade

  # ==========================================
  # CENÁRIOS DE SUCESSO - EDIÇÃO
  # ==========================================

  @sucesso @edicao
  Cenário: Editar aula individual
    Quando eu clico na aula "Pilates Mat" do dia 15/01
    E eu altero o horário de "07:00" para "08:00"
    E eu clico no botão "Salvar"
    Então eu devo ver a mensagem "Aula atualizada com sucesso!"
    E os alunos inscritos devem ser notificados da alteração

  @sucesso @edicao
  Cenário: Editar todas as ocorrências de aula recorrente
    Dado que existe uma aula recorrente de "Yoga Flow" às segundas
    Quando eu edito a aula
    E eu seleciono "Aplicar a todas as ocorrências futuras"
    E eu altero o horário
    E eu clico no botão "Salvar"
    Então todas as ocorrências futuras devem ser atualizadas

  @sucesso @edicao
  Cenário: Substituir instrutor da aula
    Quando eu edito a aula "Pilates Mat"
    E eu altero o instrutor de "Maria Silva" para "João Santos"
    E eu clico no botão "Salvar"
    Então o instrutor deve ser atualizado
    E os alunos devem ser notificados da substituição

  @sucesso @edicao
  Cenário: Alterar capacidade de aula com inscritos
    Dado que a aula "Pilates Mat" tem 8 inscritos
    Quando eu edito a capacidade para 12
    E eu clico no botão "Salvar"
    Então a capacidade deve ser aumentada
    E os clientes na lista de espera devem ser notificados

  # ==========================================
  # CENÁRIOS DE SUCESSO - CANCELAMENTO
  # ==========================================

  @sucesso @cancelamento
  Cenário: Cancelar aula individual
    Quando eu clico na aula "Pilates Mat"
    E eu clico em "Cancelar Aula"
    E eu seleciono o motivo "Indisponibilidade do instrutor"
    E eu confirmo o cancelamento
    Então a aula deve ser marcada como cancelada
    E todos os alunos inscritos devem ser notificados
    E as aulas devem ser creditadas de volta aos clientes

  @sucesso @cancelamento
  Cenário: Cancelar aula com opção de reposição
    Quando eu cancelo a aula "Yoga Flow"
    E eu seleciono "Agendar aula de reposição"
    E eu defino a nova data e horário
    E eu confirmo
    Então a aula original deve ser cancelada
    E uma nova aula de reposição deve ser criada
    E os alunos devem ser transferidos automaticamente

  # ==========================================
  # CENÁRIOS DE SUCESSO - GERENCIAMENTO DE INSCRITOS
  # ==========================================

  @sucesso @inscritos
  Cenário: Visualizar lista de inscritos na aula
    Quando eu clico na aula "Pilates Mat"
    E eu acesso a aba "Inscritos"
    Então eu devo ver a lista de 8 alunos inscritos com nome, plano e status de confirmação

  @sucesso @inscritos
  Cenário: Adicionar aluno à aula manualmente
    Quando eu clico na aula "Yoga Flow"
    E eu clico em "Adicionar Aluno"
    E eu seleciono o cliente "Ana Souza"
    E eu confirmo
    Então o aluno deve ser adicionado à lista de inscritos
    E as aulas do plano do cliente devem ser debitadas

  @sucesso @inscritos
  Cenário: Remover aluno da aula
    Quando eu acesso a lista de inscritos da aula "Pilates Mat"
    E eu clico em "Remover" no aluno "Bruno Costa"
    E eu seleciono "Creditar aula de volta"
    E eu confirmo
    Então o aluno deve ser removido da lista
    E a aula deve ser creditada de volta

  # ==========================================
  # CENÁRIOS DE ERRO
  # ==========================================

  @erro @criacao
  Cenário: Criar aula com conflito de horário do instrutor
    Dado que "Maria Silva" já tem aula às 07:00 do dia 15/01
    Quando eu tento criar outra aula no mesmo horário com Maria Silva
    Então eu devo ver a mensagem de erro "Instrutor já possui aula neste horário"

  @erro @criacao
  Cenário: Criar aula com conflito de sala
    Dado que a Sala 1 já está ocupada às 07:00 do dia 15/01
    Quando eu tento criar outra aula na Sala 1 no mesmo horário
    Então eu devo ver a mensagem de erro "Sala já está ocupada neste horário"

  @erro @criacao
  Cenário: Criar aula em data passada
    Quando eu tento criar uma aula para uma data que já passou
    Então eu devo ver a mensagem de erro "Não é possível criar aulas em datas passadas"

  @erro @edicao
  Cenário: Reduzir capacidade abaixo do número de inscritos
    Dado que a aula "Pilates Mat" tem 8 inscritos
    Quando eu tento reduzir a capacidade para 5
    Então eu devo ver a mensagem de erro "Capacidade não pode ser menor que o número de inscritos (8)"

  @erro @cancelamento
  Cenário: Cancelar aula que já aconteceu
    Dado que a aula já foi realizada e a presença foi registrada
    Quando eu tento cancelar a aula
    Então eu devo ver a mensagem de erro "Não é possível cancelar aulas já realizadas"

  # ==========================================
  # EDGE CASES
  # ==========================================

  @edge-case
  Cenário: Criar aula em feriado
    Quando eu tento criar uma aula no dia 25/12 (Natal)
    Então eu devo ver um aviso "Esta data é um feriado. Deseja continuar?"
    E eu posso confirmar ou cancelar a criação

  @edge-case
  Cenário: Aula lotada com lista de espera
    Dado que a aula "Pilates Reformer" está com 6/6 inscritos
    Quando eu acesso a aula
    Então eu devo ver a opção "Ver Lista de Espera"
    E eu posso gerenciar a fila de espera

  @edge-case
  Cenário: Aula com clima/evento adverso
    Quando eu marco a aula como "Afetada por evento externo"
    E eu seleciono "Chuva forte"
    Então os alunos devem receber notificação especial
    E a opção de cancelamento facilitado deve ser oferecida

  @edge-case
  Cenário: Duplicar grade de aulas para próxima semana
    Quando eu acesso "Copiar Grade"
    E eu seleciono a semana de origem
    E eu seleciono a semana de destino
    E eu clico em "Duplicar"
    Então todas as aulas da semana devem ser copiadas com os mesmos horários, instrutores e salas

  @edge-case
  Cenário: Instrutor sem disponibilidade no horário
    Dado que "João Santos" definiu indisponibilidade às quintas-feiras
    Quando eu tento criar uma aula com ele na quinta-feira
    Então eu devo ver um aviso "Instrutor marcou indisponibilidade neste dia"
    E eu posso forçar a criação ou escolher outro instrutor

  @edge-case
  Cenário: Aula com equipamento específico
    Quando eu crio uma aula de "Pilates Reformer"
    E a sala selecionada não possui reformers suficientes
    Então eu devo ver um aviso sobre equipamento
    E devo selecionar uma sala adequada

  @edge-case
  Cenário: Múltiplas aulas simultâneas na mesma sala (subturmas)
    Quando eu crio uma aula com "Permitir subturmas"
    E eu defino 2 subturmas de 5 alunos cada
    Então a aula deve permitir até 10 inscrições
    E deve separar os alunos em subturmas
