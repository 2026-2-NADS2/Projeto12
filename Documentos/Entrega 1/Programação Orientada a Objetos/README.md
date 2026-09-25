Entrega 1 — Programação Orientada a Objetos
Sistema de Comunicação Escolar

CLASSE PRINCIPAL: SistemaEscolar (backend/core/SistemaEscolar.js)

Responsável por orquestrar a inicialização do sistema, integrando as demais
classes: conecta o banco de dados, configura middlewares, registra as rotas
e sobe o servidor, nesta ordem, tratando falhas de conexão antes de expor
qualquer rota.

CLASSES DE APOIO:
- Database (backend/core/Database.js): encapsula a conexão com o MySQL,
  com atributo privado (#connection) e métodos assíncronos (conectar, query).
- Usuario (backend/models/Usuario.js): representa a entidade Usuário, com
  atributos e comportamentos próprios (ehAdministrador, ehProfessor,
  ehResponsavel, paraJSON).
- UsuarioRepository (backend/repositories/UsuarioRepository.js): isola o
  acesso a dados da tabela usuarios, recebendo a instância de Database por
  injeção de dependência.

CONCEITOS DE POO APLICADOS:
- Encapsulamento: atributos e métodos privados (#connection, #app,
  #database, #linhaParaUsuario) acessíveis somente de dentro da própria classe.
- Responsabilidade única: cada classe cuida de uma única preocupação
  (conexão, entidade, acesso a dados, orquestração).
- Composição / injeção de dependência: SistemaEscolar cria o Database e o
  injeta no UsuarioRepository, em vez de cada classe criar suas próprias
  dependências internamente.
- Abstração: as rotas HTTP (backend/routes/usuarios.js) não sabem como o
  usuário é persistido — só chamam métodos do repository.

COMO EXECUTAR LOCALMENTE:
1. cd backend && npm install
2. Configurar .env (não versionado) com as credenciais do MySQL
3. Executar o schema em backend/database/schema.sql no banco sistema_escolar
4. node server.js
5. Testar as rotas POST/GET em http://localhost:3001/usuarios

Código-fonte completo em: backend/core, backend/models, backend/repositories,
backend/routes deste repositório.
