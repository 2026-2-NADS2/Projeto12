const express = require('express');
const cors = require('cors');

const Database = require('./Database');
const UsuarioRepository = require('../repositories/UsuarioRepository');
const criarRotasUsuarios = require('../routes/usuarios');

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

    this.#app.use('/usuarios', usuariosRoutes);

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
    this.#configurarRotas();

    this.#app.listen(this.#porta, () => {
      console.log(`Servidor rodando na porta ${this.#porta}`);
    });
  }
}

module.exports = SistemaEscolar;