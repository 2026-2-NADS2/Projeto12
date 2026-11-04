const Tag = require('../models/Tag');

const SELECT_TAG = 'SELECT id, nome, descricao, ativo, criado_em FROM tags';

class TagRepository {
  #database;

  constructor(database) {
    this.#database = database;
  }

  async criar({ nome, descricao }) {
    const resultado = await this.#database.query(
      'INSERT INTO tags (nome, descricao) VALUES (?, ?)',
      [nome, descricao]
    );
    return this.buscarPorId(resultado.insertId);
  }

  async buscarPorId(id) {
    const linhas = await this.#database.query(`${SELECT_TAG} WHERE id = ? AND ativo = 1`, [id]);
    return linhas.length > 0 ? this.#linhaParaTag(linhas[0]) : null;
  }

  async listarTodos() {
    const linhas = await this.#database.query(`${SELECT_TAG} WHERE ativo = 1 ORDER BY nome`);
    return linhas.map((linha) => this.#linhaParaTag(linha));
  }

  async atualizar(id, { nome, descricao }) {
    const resultado = await this.#database.query(
      'UPDATE tags SET nome = ?, descricao = ? WHERE id = ? AND ativo = 1',
      [nome, descricao, id]
    );
    return resultado.affectedRows > 0;
  }

  async inativar(id) {
    await this.#database.query('UPDATE tags SET ativo = 0 WHERE id = ?', [id]);
  }

  #linhaParaTag(linha) {
    return new Tag({
      id: linha.id,
      nome: linha.nome,
      descricao: linha.descricao,
      ativo: !!linha.ativo,
      criadoEm: linha.criado_em
    });
  }
}

module.exports = TagRepository;