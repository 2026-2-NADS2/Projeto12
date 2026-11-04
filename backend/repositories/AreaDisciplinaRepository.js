const AreaDisciplina = require('../models/AreaDisciplina');

class AreaDisciplinaRepository {
  #database;

  constructor(database) {
    this.#database = database;
  }

  async criar({ nome }) {
    const sql = 'INSERT INTO areas_disciplina (nome) VALUES (?)';
    const resultado = await this.#database.query(sql, [nome]);
    return new AreaDisciplina({ id: resultado.insertId, nome });
  }

  async listarTodos() {
    const sql = 'SELECT id, nome, ativo, criado_em FROM areas_disciplina WHERE ativo = 1 ORDER BY nome';
    const linhas = await this.#database.query(sql);
    return linhas.map((linha) => this.#linhaParaArea(linha));
  }

  async atualizar(id, { nome }) {
    const sql = 'UPDATE areas_disciplina SET nome = ? WHERE id = ? AND ativo = 1';
    const resultado = await this.#database.query(sql, [nome, id]);
    return resultado.affectedRows > 0;
  }

  async inativar(id) {
    const sql = 'UPDATE areas_disciplina SET ativo = 0 WHERE id = ?';
    await this.#database.query(sql, [id]);
  }

  #linhaParaArea(linha) {
    return new AreaDisciplina({
      id: linha.id,
      nome: linha.nome,
      ativo: !!linha.ativo,
      criadoEm: linha.criado_em
    });
  }

    async buscarPorId(id) {
    const sql = 'SELECT id, nome, ativo, criado_em FROM areas_disciplina WHERE id = ? AND ativo = 1';
    const linhas = await this.#database.query(sql, [id]);
    return linhas.length > 0 ? this.#linhaParaArea(linhas[0]) : null;
  }
}

module.exports = AreaDisciplinaRepository;