# language: pt
@admin @staff
Funcionalidade: Gerenciamento de Equipe
  Como um Admin/Owner do studio
  Eu quero gerenciar minha equipe de funcionários
  Para organizar os recursos humanos do meu negócio

  Contexto:
    Dado que estou logado como admin
    E existem os seguintes funcionários cadastrados:
      | nome          | email                  | role         | status  |
      | Maria Silva   | maria@studio.com       | teacher      | active  |
      | João Santos   | joao@studio.com        | teacher      | active  |
      | Ana Costa     | ana@studio.com         | receptionist | active  |
      | Pedro Lima    | pedro@studio.com       | teacher      | inactive|

  # ==========================================
  # CENÁRIOS DE SUCESSO - LISTAGEM
  # ==========================================

  @sucesso @listagem
  Cenário: Visualizar lista de funcionários
    Quando eu acesso a página de equipe
    Então eu devo ver a lista de todos os funcionários
    E cada funcionário deve exibir:
      | campo           |
      | Avatar          |
      | Nome            |
      | Função          |
      | Email           |
      | Status          |
      | Ações           |

  @sucesso @listagem
  Cenário: Filtrar funcionários por função
    Quando eu acesso a página de equipe
    E eu seleciono o filtro "Função" com valor "Instrutor"
    Então eu devo ver apenas os funcionários com função "teacher"
    E eu não devo ver funcionários com função "receptionist"

  @sucesso @listagem
  Cenário: Filtrar funcionários por status
    Quando eu acesso a página de equipe
    E eu seleciono o filtro "Status" com valor "Ativo"
    Então eu devo ver apenas os funcionários ativos
    E eu não devo ver "Pedro Lima" na lista

  @sucesso @listagem
  Cenário: Buscar funcionário por nome
    Quando eu acesso a página de equipe
    E eu digito "Maria" no campo de busca
    Então eu devo ver apenas "Maria Silva" na lista

  # ==========================================
  # CENÁRIOS DE SUCESSO - CADASTRO
  # ==========================================

  @sucesso @cadastro
  Cenário: Cadastrar novo instrutor
    Quando eu acesso a página de equipe
    E eu clico no botão "Adicionar Funcionário"
    E eu preencho os seguintes dados:
      | campo           | valor                    |
      | nome            | Carlos Oliveira          |
      | email           | carlos@studio.com        |
      | telefone        | (11) 99999-7777          |
      | funcao          | Instrutor                |
      | especialidades  | Pilates, Yoga            |
    E eu clico no botão "Salvar"
    Então eu devo ver a mensagem "Funcionário cadastrado com sucesso!"
    E um email de boas-vindas deve ser enviado para "carlos@studio.com"
    E o funcionário deve aparecer na lista

  @sucesso @cadastro
  Cenário: Cadastrar recepcionista
    Quando eu clico no botão "Adicionar Funcionário"
    E eu preencho os dados do funcionário
    E eu seleciono a função "Recepcionista"
    E eu clico no botão "Salvar"
    Então o funcionário deve ser cadastrado com permissões de recepcionista

  @sucesso @cadastro
  Cenário: Cadastrar funcionário com foto
    Quando eu clico no botão "Adicionar Funcionário"
    E eu faço upload de uma foto de perfil
    E eu preencho os demais dados do funcionário
    E eu clico no botão "Salvar"
    Então a foto deve ser salva e exibida no perfil do funcionário

  # ==========================================
  # CENÁRIOS DE SUCESSO - EDIÇÃO
  # ==========================================

  @sucesso @edicao
  Cenário: Editar dados de funcionário
    Quando eu acesso a página de equipe
    E eu clico em "Editar" no funcionário "Maria Silva"
    E eu altero o campo "telefone" para "(11) 88888-9999"
    E eu clico no botão "Salvar"
    Então eu devo ver a mensagem "Dados atualizados com sucesso!"
    E o novo telefone deve ser exibido

  @sucesso @edicao
  Cenário: Alterar função de funcionário
    Quando eu edito o funcionário "Ana Costa"
    E eu altero a função de "Recepcionista" para "Instrutor"
    E eu clico no botão "Salvar"
    Então as permissões do funcionário devem ser atualizadas
    E o funcionário deve ter acesso às funcionalidades de instrutor

  @sucesso @edicao
  Cenário: Adicionar especialidades ao instrutor
    Quando eu edito o funcionário "João Santos"
    E eu adiciono a especialidade "Pilates Reformer"
    E eu clico no botão "Salvar"
    Então a especialidade deve aparecer no perfil do instrutor

  # ==========================================
  # CENÁRIOS DE SUCESSO - DESATIVAÇÃO/ATIVAÇÃO
  # ==========================================

  @sucesso @status
  Cenário: Desativar funcionário
    Quando eu acesso a página de equipe
    E eu clico em "Desativar" no funcionário "Maria Silva"
    E eu confirmo a desativação
    Então o status do funcionário deve mudar para "Inativo"
    E o funcionário não deve poder fazer login
    E as aulas futuras do instrutor devem ser sinalizadas

  @sucesso @status
  Cenário: Reativar funcionário
    Quando eu acesso a página de equipe
    E eu clico em "Ativar" no funcionário "Pedro Lima"
    Então o status do funcionário deve mudar para "Ativo"
    E o funcionário deve poder fazer login

  # ==========================================
  # CENÁRIOS DE SUCESSO - PERFORMANCE
  # ==========================================

  @sucesso @performance
  Cenário: Visualizar métricas de performance do instrutor
    Quando eu clico em "Ver Detalhes" no funcionário "Maria Silva"
    Então eu devo ver as seguintes métricas:
      | metrica             | valor |
      | Aulas no mês        | 40    |
      | Taxa de presença    | 92%   |
      | Avaliação média     | 4.8   |
      | Alunos atendidos    | 120   |

  @sucesso @performance
  Cenário: Visualizar histórico de aulas do instrutor
    Quando eu acesso os detalhes do instrutor "Maria Silva"
    E eu clico na aba "Histórico de Aulas"
    Então eu devo ver a lista de aulas ministradas com data, tipo de aula e número de alunos

  # ==========================================
  # CENÁRIOS DE ERRO
  # ==========================================

  @erro @cadastro
  Cenário: Cadastrar funcionário com email já existente
    Quando eu clico no botão "Adicionar Funcionário"
    E eu preencho o campo "email" com "maria@studio.com"
    E eu preencho os demais dados
    E eu clico no botão "Salvar"
    Então eu devo ver a mensagem de erro "Este email já está cadastrado"

  @erro @cadastro
  Cenário: Cadastrar funcionário com campos obrigatórios vazios
    Quando eu clico no botão "Adicionar Funcionário"
    E eu clico no botão "Salvar" sem preencher os campos
    Então eu devo ver mensagens de erro para:
      | campo  | mensagem                |
      | nome   | Nome é obrigatório      |
      | email  | Email é obrigatório     |
      | funcao | Função é obrigatória    |

  @erro @edicao
  Cenário: Editar para email já existente
    Quando eu edito o funcionário "João Santos"
    E eu altero o email para "maria@studio.com"
    E eu clico no botão "Salvar"
    Então eu devo ver a mensagem de erro "Este email já está em uso"

  @erro @status
  Cenário: Desativar funcionário com aulas agendadas
    Dado que "Maria Silva" tem 5 aulas agendadas para a próxima semana
    Quando eu tento desativar o funcionário
    Então eu devo ver a mensagem "Este instrutor possui aulas agendadas"
    E eu devo ver as opções:
      | opcao                           |
      | Transferir aulas para outro instrutor |
      | Cancelar aulas                  |
      | Manter ativo                    |

  # ==========================================
  # EDGE CASES
  # ==========================================

  @edge-case
  Cenário: Upload de foto em formato inválido
    Quando eu clico no botão "Adicionar Funcionário"
    E eu tento fazer upload de um arquivo ".pdf"
    Então eu devo ver a mensagem "Formato de arquivo não suportado. Use JPG, PNG ou GIF."

  @edge-case
  Cenário: Upload de foto muito grande
    Quando eu tento fazer upload de uma foto de 10MB
    Então eu devo ver a mensagem "O arquivo deve ter no máximo 5MB"

  @edge-case
  Cenário: Desativar o próprio usuário admin
    Dado que sou o único admin do studio
    Quando eu tento desativar minha própria conta
    Então eu devo ver a mensagem "Você não pode desativar sua própria conta"

  @edge-case
  Cenário: Excluir funcionário com histórico
    Quando eu tento excluir o funcionário "Maria Silva" que tem histórico de aulas
    Então eu devo ver a mensagem "Funcionário com histórico não pode ser excluído"
    E eu devo ver a opção "Desativar funcionário" como alternativa

  @edge-case
  Cenário: Importar funcionários em lote via CSV
    Quando eu clico em "Importar Funcionários"
    E eu faço upload de um arquivo CSV com 10 funcionários
    Então o sistema deve validar cada registro
    E exibir um resumo: "8 importados com sucesso, 2 com erro"
    E listar os erros encontrados

  @edge-case
  Cenário: Funcionário sem especialidades atribuídas
    Dado que "João Santos" não tem especialidades cadastradas
    Quando eu tento atribuir uma aula para ele
    Então eu devo ver um aviso "Este instrutor não possui especialidades definidas"
