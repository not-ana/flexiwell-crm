# language: pt
@admin @clients
Funcionalidade: Gerenciamento de Clientes
  Como um Admin/Owner do studio
  Eu quero gerenciar os clientes do meu studio
  Para manter um controle eficiente da base de alunos

  Contexto:
    Dado que estou logado como admin
    E existem os seguintes clientes cadastrados:
      | nome           | email                 | plano     | status   | aulas_restantes |
      | Ana Souza      | ana@email.com         | Mensal    | active   | 5               |
      | Bruno Costa    | bruno@email.com       | Trimestral| active   | 18              |
      | Carla Lima     | carla@email.com       | Avulso    | active   | 1               |
      | Diego Santos   | diego@email.com       | Mensal    | inactive | 0               |
      | Elena Rocha    | elena@email.com       | Anual     | pending  | 96              |

  # ==========================================
  # CENÁRIOS DE SUCESSO - LISTAGEM
  # ==========================================

  @sucesso @listagem
  Cenário: Visualizar lista de clientes
    Quando eu acesso a página de clientes
    Então eu devo ver a lista de todos os clientes
    E cada cliente deve exibir:
      | campo           |
      | Nome            |
      | Email           |
      | Telefone        |
      | Plano           |
      | Status          |
      | Aulas Restantes |
      | Ações           |

  @sucesso @listagem
  Cenário: Filtrar clientes por status
    Quando eu acesso a página de clientes
    E eu seleciono o filtro "Status" com valor "Ativo"
    Então eu devo ver apenas os clientes com status "active"
    E eu não devo ver "Diego Santos" na lista

  @sucesso @listagem
  Cenário: Filtrar clientes por plano
    Quando eu seleciono o filtro "Plano" com valor "Mensal"
    Então eu devo ver apenas "Ana Souza" e "Diego Santos"

  @sucesso @listagem
  Cenário: Buscar cliente por nome ou email
    Quando eu digito "Ana" no campo de busca
    Então eu devo ver apenas "Ana Souza" na lista

  @sucesso @listagem
  Cenário: Ordenar clientes por diferentes critérios
    Quando eu clico no cabeçalho "Aulas Restantes"
    Então a lista deve ser ordenada por aulas restantes em ordem decrescente
    E "Elena Rocha" deve aparecer primeiro

  # ==========================================
  # CENÁRIOS DE SUCESSO - CADASTRO
  # ==========================================

  @sucesso @cadastro
  Cenário: Cadastrar novo cliente
    Quando eu clico no botão "Adicionar Cliente"
    E eu preencho os seguintes dados:
      | campo           | valor                |
      | nome            | Fernando Alves       |
      | email           | fernando@email.com   |
      | telefone        | (11) 99999-6666      |
      | cpf             | 123.456.789-00       |
      | data_nascimento | 15/05/1990           |
      | plano           | Mensal               |
    E eu clico no botão "Salvar"
    Então eu devo ver a mensagem "Cliente cadastrado com sucesso!"
    E um email de boas-vindas deve ser enviado
    E o cliente deve aparecer na lista

  @sucesso @cadastro
  Cenário: Cadastrar cliente com endereço completo
    Quando eu cadastro um novo cliente
    E eu preencho os dados de endereço:
      | campo       | valor                    |
      | cep         | 01310-100                |
      | logradouro  | Av. Paulista, 1000       |
      | bairro      | Bela Vista               |
      | cidade      | São Paulo                |
      | estado      | SP                       |
    E eu clico no botão "Salvar"
    Então o endereço deve ser salvo corretamente

  @sucesso @cadastro
  Cenário: Cadastrar cliente com contato de emergência
    Quando eu cadastro um novo cliente
    E eu preencho os dados de contato de emergência:
      | campo       | valor                |
      | nome        | Maria Mãe            |
      | telefone    | (11) 98888-7777      |
      | parentesco  | Mãe                  |
    E eu clico no botão "Salvar"
    Então o contato de emergência deve ser salvo

  # ==========================================
  # CENÁRIOS DE SUCESSO - EDIÇÃO
  # ==========================================

  @sucesso @edicao
  Cenário: Editar dados de cliente
    Quando eu clico em "Editar" no cliente "Ana Souza"
    E eu altero o campo "telefone" para "(11) 77777-8888"
    E eu clico no botão "Salvar"
    Então eu devo ver a mensagem "Dados atualizados com sucesso!"

  @sucesso @edicao
  Cenário: Alterar plano do cliente
    Quando eu edito o cliente "Ana Souza"
    E eu altero o plano de "Mensal" para "Trimestral"
    E eu clico no botão "Salvar"
    Então o sistema deve calcular o valor proporcional
    E as aulas restantes devem ser atualizadas

  @sucesso @edicao
  Cenário: Adicionar observações ao cliente
    Quando eu edito o cliente "Bruno Costa"
    E eu adiciono a observação "Cliente prefere aulas matutinas"
    E eu clico no botão "Salvar"
    Então a observação deve ser salva e visível para instrutores

  # ==========================================
  # CENÁRIOS DE SUCESSO - DETALHES
  # ==========================================

  @sucesso @detalhes
  Cenário: Visualizar histórico de aulas do cliente
    Quando eu clico em "Ver Detalhes" no cliente "Ana Souza"
    E eu acesso a aba "Histórico de Aulas"
    Então eu devo ver a lista de aulas frequentadas com data, tipo de aula, instrutor e status de presença

  @sucesso @detalhes
  Cenário: Visualizar histórico de pagamentos do cliente
    Quando eu acesso os detalhes do cliente "Ana Souza"
    E eu acesso a aba "Pagamentos"
    Então eu devo ver o histórico de pagamentos com data, valor, método e status

  @sucesso @detalhes
  Cenário: Visualizar preferências do cliente
    Quando eu acesso os detalhes do cliente "Bruno Costa"
    Então eu devo ver as preferências:
      | preferencia        | valor              |
      | Horário preferido  | Manhã              |
      | Instrutor favorito | Maria Silva        |
      | Tipo de aula       | Pilates Reformer   |

  # ==========================================
  # CENÁRIOS DE SUCESSO - COMUNICAÇÃO
  # ==========================================

  @sucesso @comunicacao
  Cenário: Enviar mensagem para cliente
    Quando eu acesso os detalhes do cliente "Ana Souza"
    E eu clico em "Enviar Mensagem"
    E eu seleciono "WhatsApp" como canal
    E eu escrevo a mensagem "Lembrete: sua aula é amanhã às 9h"
    E eu clico em "Enviar"
    Então a mensagem deve ser enviada via WhatsApp
    E o histórico de comunicação deve ser atualizado

  @sucesso @comunicacao
  Cenário: Enviar email para múltiplos clientes
    Quando eu seleciono múltiplos clientes na lista
    E eu clico em "Ações em Lote" > "Enviar Email"
    E eu preencho o assunto e corpo do email
    E eu clico em "Enviar"
    Então o email deve ser enviado para todos os clientes selecionados

  # ==========================================
  # CENÁRIOS DE SUCESSO - STATUS
  # ==========================================

  @sucesso @status
  Cenário: Desativar cliente
    Quando eu clico em "Desativar" no cliente "Ana Souza"
    E eu seleciono o motivo "Solicitação do cliente"
    E eu confirmo a desativação
    Então o status do cliente deve mudar para "Inativo"
    E as aulas futuras devem ser canceladas
    E o cliente deve ser notificado

  @sucesso @status
  Cenário: Reativar cliente
    Quando eu clico em "Reativar" no cliente "Diego Santos"
    E eu seleciono um plano para renovação
    Então o status do cliente deve mudar para "Ativo"
    E as aulas devem ser creditadas conforme o plano

  # ==========================================
  # CENÁRIOS DE ERRO
  # ==========================================

  @erro @cadastro
  Cenário: Cadastrar cliente com email já existente
    Quando eu clico no botão "Adicionar Cliente"
    E eu preencho o campo "email" com "ana@email.com"
    E eu preencho os demais dados
    E eu clico no botão "Salvar"
    Então eu devo ver a mensagem de erro "Este email já está cadastrado"

  @erro @cadastro
  Cenário: Cadastrar cliente com CPF inválido
    Quando eu clico no botão "Adicionar Cliente"
    E eu preencho o campo "cpf" com "111.111.111-11"
    E eu clico no botão "Salvar"
    Então eu devo ver a mensagem de erro "CPF inválido"

  @erro @cadastro
  Cenário: Cadastrar cliente menor de idade sem responsável
    Quando eu cadastro um cliente com data de nascimento de menor de 18 anos
    E não preencho os dados do responsável
    E eu clico no botão "Salvar"
    Então eu devo ver a mensagem de erro "Clientes menores de idade precisam de um responsável cadastrado"

  @erro @edicao
  Cenário: Alterar plano com pagamento pendente
    Dado que o cliente "Ana Souza" tem pagamento pendente
    Quando eu tento alterar o plano dela
    Então eu devo ver a mensagem "Cliente possui pagamento pendente. Regularize antes de alterar o plano."

  # ==========================================
  # EDGE CASES
  # ==========================================

  @edge-case
  Cenário: Cliente com aulas prestes a expirar
    Dado que o cliente "Carla Lima" tem apenas 1 aula restante
    Quando eu acesso a página de clientes
    Então "Carla Lima" deve estar destacada com indicador de alerta
    E deve haver uma sugestão de renovação

  @edge-case
  Cenário: Importar clientes em lote via CSV
    Quando eu clico em "Importar Clientes"
    E eu faço upload de um arquivo CSV com 50 clientes
    Então o sistema deve validar cada registro
    E exibir um resumo da importação
    E listar os registros com erro para correção

  @edge-case
  Cenário: Mesclar clientes duplicados
    Dado que existem dois registros para o mesmo cliente com emails diferentes
    Quando eu acesso "Gerenciar Duplicados"
    E eu seleciono os registros para mesclar
    E eu escolho os dados principais
    E eu confirmo a mesclagem
    Então os registros devem ser unificados
    E o histórico de ambos deve ser preservado

  @edge-case
  Cenário: Cliente com plano expirado tenta agendar aula
    Dado que o plano do cliente "Diego Santos" expirou
    E ele está inativo
    Quando o admin tenta agendar uma aula para ele
    Então eu devo ver a mensagem "Cliente com plano expirado"
    E deve haver opção de renovar ou atribuir aula avulsa

  @edge-case
  Cenário: Exportar dados de clientes (LGPD)
    Quando eu clico em "Exportar Dados" para o cliente "Ana Souza"
    Então todos os dados pessoais do cliente devem ser exportados em formato legível conforme LGPD
    E um registro de auditoria deve ser criado

  @edge-case
  Cenário: Solicitar exclusão de dados (LGPD)
    Quando o cliente "Ana Souza" solicita exclusão de dados
    E eu processo a solicitação
    Então todos os dados pessoais devem ser anonimizados
    E os dados financeiros devem ser mantidos por obrigação legal
    E um comprovante deve ser enviado ao cliente
