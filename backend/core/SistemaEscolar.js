const AlunoRepository = require('../repositories/AlunoRepository');
const criarRotasAlunos = require('../routes/alunos');
const criarRotasAuth = require('../routes/auth');
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const ProfessorRepository = require('../repositories/ProfessorRepository');
const criarRotasProfessores = require('../routes/professores');

const Database = require('./Database');
const UsuarioRepository = require('../repositories/UsuarioRepository');
const criarRotasUsuarios = require('../routes/usuarios');
const ResponsavelRepository = require('../repositories/ResponsavelRepository');
const criarRotasResponsaveis = require('../routes/responsaveis');

const AreaDisciplinaRepository = require('../repositories/AreaDisciplinaRepository');
const criarRotasAreasDisciplina = require('../routes/areasDisciplina');

const DisciplinaRepository = require('../repositories/DisciplinaRepository');
const criarRotasDisciplinas = require('../routes/disciplinas');

const TurmaRepository = require('../repositories/TurmaRepository');
const criarRotasTurmas = require('../routes/turmas');

const TagRepository = require('../repositories/TagRepository');
const criarRotasTags = require('../routes/tags');

const BimestreRepository = require('../repositories/BimestreRepository');
const criarRotasBimestres = require('../routes/bimestres');

const AcompanhamentoRepository = require('../repositories/AcompanhamentoRepository');
const AcompanhamentoService = require('../services/AcompanhamentoService');
const criarRotasAreaProfessor = require('../routes/areaProfessor');

const RevisaoService = require('../services/RevisaoService');
const criarRotasRevisao = require('../routes/revisao');
const AreaResponsavelService = require('../services/AreaResponsavelService');
const GeradorPdf = require('../services/GeradorPdf');
const criarRotasAreaResponsavel = require('../routes/areaResponsavel');

const RelatorioRepository = require('../repositories/RelatorioRepository');
const ExportadorPlanilha = require('../services/ExportadorPlanilha');
const criarRotasRelatorios = require('../routes/relatorios');

const SenhaService = require('../services/SenhaService');
const RecuperacaoSenhaRepository = require('../repositories/RecuperacaoSenhaRepository');
const NotificadorEmail = require('../services/NotificadorEmail');

class SistemaEscolar {
  #app;
  #database;
  #porta;

  constructor(porta = 3001) {
    this.#app = express();
    this.#database = new Database();
    this.#porta = porta;
  }

  #configurarMiddlewares() {
    this.#app.use(cors());
    this.#app.use(express.json());
  }

  // Em produção (deploy), o próprio backend entrega as telas do React já compiladas (pasta frontend/dist).
  // Assim o sistema inteiro fica num único endereço. No computador de desenvolvimento a pasta não existe
  // e nada muda: o React continua rodando pelo Vite na porta 5173.
  #servirFrontend() {
    const pastaFrontend = path.join(__dirname, '..', '..', 'frontend', 'dist');
    if (!fs.existsSync(pastaFrontend)) return;

    // Arquivos estáticos: JavaScript, CSS, ícones...
    this.#app.use(express.static(pastaFrontend, { index: false }));

    // Quando o NAVEGADOR abre um endereço (ex.: /professor/turmas), ele pede uma página HTML:
    // devolvemos o index.html e o React Router mostra a tela certa.
    // As chamadas da API (fetch) pedem JSON e seguem para as rotas normais.
    this.#app.use((req, res, next) => {
      if (req.method === 'GET' && req.accepts(['json', 'html']) === 'html') {
        return res.sendFile(path.join(pastaFrontend, 'index.html'));
      }
      next();
    });
    console.log('Servindo o frontend a partir de frontend/dist');
  }

  #configurarRotas() {
    // Usuários e autenticação
    const usuarioRepository = new UsuarioRepository(this.#database);
    const senhaService = new SenhaService({
      usuarioRepository,
      recuperacaoRepository: new RecuperacaoSenhaRepository(this.#database),
      notificador: new NotificadorEmail(),
      urlFrontend: process.env.FRONTEND_URL ?? 'http://localhost:5173'
    });
    this.#app.use('/auth', criarRotasAuth({ usuarioRepository, senhaService }));
    this.#app.use('/usuarios', criarRotasUsuarios(usuarioRepository));
    // Pessoas
    const alunoRepository = new AlunoRepository(this.#database);
    this.#app.use('/alunos', criarRotasAlunos(alunoRepository));

    const professorRepository = new ProfessorRepository(this.#database, usuarioRepository);
    this.#app.use('/professores', criarRotasProfessores(professorRepository));

    const responsavelRepository = new ResponsavelRepository(this.#database, usuarioRepository);
    this.#app.use('/responsaveis', criarRotasResponsaveis(responsavelRepository));

    // Estrutura acadêmica
    const areaDisciplinaRepository = new AreaDisciplinaRepository(this.#database);
    this.#app.use('/areas', criarRotasAreasDisciplina(areaDisciplinaRepository));

    const disciplinaRepository = new DisciplinaRepository(this.#database);
    this.#app.use('/disciplinas', criarRotasDisciplinas(disciplinaRepository, areaDisciplinaRepository));

    const turmaRepository = new TurmaRepository(this.#database);
        this.#app.use('/turmas', criarRotasTurmas({
      turmaRepository,
      alunoRepository,
      disciplinaRepository,
      professorRepository
    }));
    const tagRepository = new TagRepository(this.#database);
    this.#app.use('/tags', criarRotasTags(tagRepository));

        // Calendário
    const bimestreRepository = new BimestreRepository(this.#database);
    this.#app.use('/bimestres', criarRotasBimestres(bimestreRepository));

        const relatorioRepository = new RelatorioRepository(this.#database);

        // Acompanhamento (RF05)
    const acompanhamentoRepository = new AcompanhamentoRepository(this.#database);
    const acompanhamentoService = new AcompanhamentoService({
      acompanhamentoRepository,
      professorRepository,
      turmaRepository,
      bimestreRepository,
      tagRepository,
      relatorioRepository
    });
    this.#app.use('/professor', criarRotasAreaProfessor(acompanhamentoService));

        // Revisão e publicação (RF06) com auditoria (RF07)
    const revisaoService = new RevisaoService({ acompanhamentoRepository, tagRepository });
    this.#app.use('/revisao', criarRotasRevisao(revisaoService));

        // Área do responsável (RF08, RF09, RF12)
    const areaResponsavelService = new AreaResponsavelService({
      responsavelRepository,
      acompanhamentoRepository,
      turmaRepository,
      bimestreRepository,
      geradorPdf: new GeradorPdf()
    });
    this.#app.use('/responsavel', criarRotasAreaResponsavel(areaResponsavelService));

        // Relatórios gerenciais e exportação (RF10, RF11)
    this.#app.use('/relatorios', criarRotasRelatorios(relatorioRepository, new ExportadorPlanilha()));

    // Rota de verificação: confirma que a API está no ar
    this.#app.get('/', (req, res) => {
      res.send('API rodando');
    });
  }

  async iniciar() {
    try {
      await this.#database.conectar();
    } catch (erro) {
      console.error('Erro ao conectar ao banco de dados:', erro);
      process.exit(1);
    }

    this.#configurarMiddlewares();
    this.#servirFrontend();
    this.#configurarRotas();

    this.#app.listen(this.#porta, (erro) => {
      if (erro) {
        console.error(`Não foi possível iniciar o servidor na porta ${this.#porta}:`, erro.message);
        process.exit(1);
      }
      console.log(`Servidor rodando na porta ${this.#porta}`);
    });
  }
}

module.exports = SistemaEscolar;