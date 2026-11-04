const Disciplina = require('../models/Disciplina');

// Consulta-base reaproveitada por buscarPorId e listarTodos
const SELECT_DISCIPLINA = `
  SELECT d.id, d.nome, d.area_id, a.nome AS area_nome, d.ativo, d.criado_em
  FROM disciplinas d
  JOIN areas_disciplina a ON a.id = d.area_id
`;

class DisciplinaRepository {
  #database;

  constructor(database) {
    this.#database = database;
  }

  async criar({ nome, areaId }) {
    const sql = 'INSERT INTO disciplinas (nome, area_id) VALUES (?, ?)';
    const resultado = await this.#database.query(sql, [nome, areaId]);
    return this.buscarPorId(resultado.insertId);
  }

  async buscarPorId(id) {
    const linhas = await this.#database.query(`${SELECT_DISCIPLINA} WHERE d.id = ? AND d.ativo = 1`, [id]);
    return linhas.length > 0 ? this.#linhaParaDisciplina(linhas[0]) : null;
  }

  async listarTodos() {
    const linhas = await this.#database.query(`${SELECT_DISCIPLINA} WHERE d.ativo = 1 ORDER BY a.nome, d.nome`);
    return linhas.map((linha) => this.#linhaParaDisciplina(linha));
  }

  async atualizar(id, { nome, areaId }) {
    const sql = 'UPDATE disciplinas SET nome = ?, area_id = ? WHERE id = ? AND ativo = 1';
    const resultado = await this.#database.query(sql, [nome, areaId, id]);
    return resultado.affectedRows > 0;
  }

  async inativar(id) {
    await this.#database.query('UPDATE disciplinas SET ativo = 0 WHERE id = ?', [id]);
  }

  #linhaParaDisciplina(linha) {
    return new Disciplina({
      id: linha.id,
      nome: linha.nome,
      areaId: linha.area_id,
      areaNome: linha.area_nome,
      ativo: !!linha.ativo,
      criadoEm: linha.criado_em
    });
  }
}

module.exports = DisciplinaRepository;