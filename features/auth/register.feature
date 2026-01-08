# language: pt
@auth @register
Funcionalidade: Cadastro de Novos Usuários
  Como um novo usuário
  Eu quero me cadastrar na plataforma FlexiWell
  Para ter acesso aos serviços do studio

  Contexto:
    Dado que estou na página de cadastro
    E existem os seguintes planos disponíveis:
      | plano      | valor   | aulas_por_mes |
      | Mensal     | R$199   | 8             |
      | Trimestral | R$549   | 24            |
      | Anual      | R$1999  | 96            |
      | Avulso     | R$45    | 1             |

  # ==========================================
  # CENÁRIOS DE SUCESSO - CLIENT/STUDENT
  # ==========================================

  @sucesso @client
  Cenário: Cadastro bem-sucedido de cliente
    Quando eu preencho os seguintes dados:
      | campo           | valor                |
      | nome            | Maria Silva          |
      | email           | maria@email.com      |
      | telefone        | (11) 99999-8888      |
      | senha           | Maria123!            |
      | confirmar_senha | Maria123!            |
    E eu seleciono o plano "Mensal"
    E eu aceito os termos de uso
    E eu clico no botão "Criar Conta"
    Então eu devo ver a mensagem "Conta criada com sucesso!"
    E eu devo ser redirecionado para a página de pagamento
    E um email de boas-vindas deve ser enviado para "maria@email.com"

  @sucesso @client
  Cenário: Cadastro com plano avulso (sem recorrência)
    Quando eu preencho os dados de cadastro válidos
    E eu seleciono o plano "Avulso"
    E eu aceito os termos de uso
    E eu clico no botão "Criar Conta"
    Então eu devo ser redirecionado para a página de pagamento único

  @sucesso @client
  Cenário: Cadastro via link de convite do studio
    Dado que acessei a página via link de convite "https://studio.flexiwell.com/signup?ref=PROMO10"
    Quando eu preencho os dados de cadastro válidos
    E eu clico no botão "Criar Conta"
    Então o desconto de 10% deve ser aplicado automaticamente
    E eu devo ver a mensagem "Desconto de boas-vindas aplicado!"

  # ==========================================
  # CENÁRIOS DE SUCESSO - ADMIN/OWNER
  # ==========================================

  @sucesso @admin
  Cenário: Cadastro de novo studio (Admin/Owner)
    Dado que estou na página de cadastro de studio
    Quando eu preencho os seguintes dados do studio:
      | campo              | valor                    |
      | nome_studio        | Wellness Center          |
      | tipo_negocio       | Pilates                  |
      | nome_responsavel   | João Santos              |
      | email              | joao@wellnesscenter.com  |
      | telefone           | (11) 98765-4321          |
      | senha              | Studio123!               |
    E eu seleciono o plano do studio "Professional"
    E eu aceito os termos de uso
    E eu clico no botão "Criar Studio"
    Então eu devo ver a mensagem "Studio criado com sucesso!"
    E eu devo ser redirecionado para "/admin"
    E um email de boas-vindas deve ser enviado
    E o período de trial de 14 dias deve ser iniciado

  # ==========================================
  # CENÁRIOS DE ERRO
  # ==========================================

  @erro
  Cenário: Cadastro com email já existente
    Dado que existe um usuário com email "existente@email.com"
    Quando eu preencho o campo "email" com "existente@email.com"
    E eu preencho os demais dados de cadastro válidos
    E eu clico no botão "Criar Conta"
    Então eu devo ver a mensagem de erro "Este email já está cadastrado"

  @erro
  Cenário: Cadastro com senha fraca
    Quando eu preencho o campo "senha" com "123456"
    E eu clico no botão "Criar Conta"
    Então eu devo ver a mensagem de erro "A senha deve conter pelo menos 8 caracteres, uma letra maiúscula, uma minúscula e um número"

  @erro
  Cenário: Cadastro com senhas não coincidentes
    Quando eu preencho o campo "senha" com "Senha123!"
    E eu preencho o campo "confirmar_senha" com "OutraSenha123!"
    E eu clico no botão "Criar Conta"
    Então eu devo ver a mensagem de erro "As senhas não coincidem"

  @erro
  Cenário: Cadastro sem aceitar termos de uso
    Quando eu preencho os dados de cadastro válidos
    E eu não aceito os termos de uso
    E eu clico no botão "Criar Conta"
    Então eu devo ver a mensagem de erro "Você deve aceitar os termos de uso"

  @erro
  Cenário: Cadastro com telefone inválido
    Quando eu preencho o campo "telefone" com "1234"
    E eu preencho os demais dados de cadastro válidos
    E eu clico no botão "Criar Conta"
    Então eu devo ver a mensagem de erro "Telefone inválido"

  @erro
  Cenário: Cadastro com campos obrigatórios vazios
    Quando eu clico no botão "Criar Conta"
    Então eu devo ver mensagens de erro para todos os campos obrigatórios:
      | campo           | mensagem                  |
      | nome            | Nome é obrigatório        |
      | email           | Email é obrigatório       |
      | senha           | Senha é obrigatória       |
      | confirmar_senha | Confirmação é obrigatória |

  # ==========================================
  # EDGE CASES
  # ==========================================

  @edge-case
  Cenário: Cadastro com nome contendo caracteres especiais
    Quando eu preencho o campo "nome" com "José María O'Connor"
    E eu preencho os demais dados de cadastro válidos
    E eu clico no botão "Criar Conta"
    Então o cadastro deve ser realizado com sucesso
    E o nome deve ser armazenado corretamente

  @edge-case
  Cenário: Cadastro com email internacional
    Quando eu preencho o campo "email" com "user@empresa.com.br"
    E eu preencho os demais dados de cadastro válidos
    E eu clico no botão "Criar Conta"
    Então o cadastro deve ser realizado com sucesso

  @edge-case
  Cenário: Cadastro com telefone internacional
    Quando eu preencho o campo "telefone" com "+55 11 99999-8888"
    E eu preencho os demais dados de cadastro válidos
    E eu clico no botão "Criar Conta"
    Então o cadastro deve ser realizado com sucesso

  @edge-case
  Cenário: Tentativa de cadastro duplo em curto período
    Dado que acabei de criar uma conta com "novo@email.com"
    Quando eu tento criar outra conta com "novo@email.com"
    Então eu devo ver a mensagem de erro "Este email já está cadastrado"

  @edge-case
  Cenário: Cadastro com link de convite expirado
    Dado que acessei a página via link de convite expirado
    Quando eu preencho os dados de cadastro válidos
    E eu clico no botão "Criar Conta"
    Então eu devo ver a mensagem "Link de convite expirado. O cadastro será feito sem desconto."
    E o cadastro deve prosseguir normalmente sem desconto

  @edge-case
  Cenário: Timeout durante cadastro
    Dado que o servidor está demorando para responder
    Quando eu preencho os dados de cadastro válidos
    E eu clico no botão "Criar Conta"
    E aguardo mais de 30 segundos
    Então eu devo ver a mensagem "Tempo de resposta excedido. Tente novamente."
    E nenhuma conta duplicada deve ser criada

  @edge-case @sql-injection
  Cenário: Tentativa de SQL Injection nos campos de cadastro
    Quando eu preencho o campo "nome" com "'; DROP TABLE users;--"
    E eu preencho os demais dados de cadastro válidos
    E eu clico no botão "Criar Conta"
    Então o conteúdo deve ser sanitizado
    E nenhuma operação maliciosa deve ser executada

  @edge-case
  Cenário: Cadastro via dispositivo móvel
    Dado que estou acessando via dispositivo móvel
    Quando eu preencho os dados de cadastro válidos
    E eu clico no botão "Criar Conta"
    Então o cadastro deve ser realizado com sucesso
    E a interface deve estar otimizada para mobile
