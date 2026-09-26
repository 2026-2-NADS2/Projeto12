const bcrypt = require('bcrypt');
const Usuario = require('../models/Usuario');

class UsuarioRepository {
  #database;

  constructor(database) {
    this.#database = database;
  }

  async criar({ nome, email, senha, perfil }) {
    const senhaHash = await bcrypt.hash(senha, 10);

    const sql = 'INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)';
    const resultado = await this.#database.query(sql, [nome, email, senhaHash, perfil]);

    return new Usuario({
      id: resultado.insertId,
      nome,
      email,
      perfil
    });
  }

  async buscarPorEmail(email) {
    const sql = 'SELECT * FROM usuarios WHERE email = ?';
    const linhas = await this.#database.query(sql, [email]);

    if (linhas.length === 0) {
      return null;
    }

    return this.#linhaParaUsuario(linhas[0]);
  }

  async listarTodos() {
    const sql = 'SELECT * FROM usuarios';
    const linhas = await this.#database.query(sql);
    return linhas.map((linha) => this.#linhaParaUsuario(linha));
  }

  #linhaParaUsuario(linha) {
    return new Usuario({
      id: linha.id,
      nome: linha.nome,
      email: linha.email,
      senhaHash: linha.senha_hash,
      perfil: linha.perfil,
      ativo: !!linha.ativo,
      criadoEm: linha.criado_em
    });
  }
}

module.exports = UsuarioRepository;