const AlunoRepository = require('../repositories/AlunoRepository');
const criarRotasAlunos = require('../routes/alunos');
const criarRotasAuth = require('../routes/auth');
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

  #configurarRotas() {
    const usuarioRepository = new UsuarioRepository(this.#database);
    const usuariosRoutes = criarRotasUsuarios(usuarioRepository);
    const authRoutes = criarRotasAuth(usuarioRepository);
    this.#app.use('/auth', authRoutes);
    const alunoRepository = new AlunoRepository(this.#database);
    const alunosRoutes = criarRotasAlunos(alunoRepository);
    this.#app.use('/alunos', alunosRoutes);
    this.#app.use('/usuarios', usuariosRoutes);
    const professorRepository = new ProfessorRepository(this.#database, usuarioRepository);
    const professoresRoutes = criarRotasProfessores(professorRepository);
    this.#app.use('/professores', professoresRoutes);
        const responsavelRepository = new ResponsavelRepository(this.#database, usuarioRepository);
    const responsaveisRoutes = criarRotasResponsaveis(responsavelRepository);
    this.#app.use('/responsaveis', responsaveisRoutes);
        const areaDisciplinaRepository = new AreaDisciplinaRepository(this.#database);
    this.#app.use('/areas', criarRotasAreasDisciplina(areaDisciplinaRepository));
    this.#app.get('/', (req, res) => {
      res.send('API rodando');
    });
        const disciplinaRepository = new DisciplinaRepository(this.#database);
    this.#app.use('/disciplinas', criarRotasDisciplinas(disciplinaRepository, areaDisciplinaRepository));

  }

  async iniciar() {
    try {
      await this.#database.conectar();
    } catch (erro) {
      console.error('Erro ao conectar ao banco de dados:', erro);
      process.exit(1);
    }

    this.#configurarMiddlewares();
    this.#configurarRotas();

    this.#app.listen(this.#porta, () => {
      console.log(`Servidor rodando na porta ${this.#porta}`);
    });
  }
}

module.exports = SistemaEscolar;