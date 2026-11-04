const Turma = require('../models/Turma');

const SELECT_TURMA = 'SELECT id, ano_serie, identificacao, turno, ano_letivo, ativo, criado_em FROM turmas';

class TurmaRepository {
  #database;

  constructor(database) {
    this.#database = database;
  }

  async criar({ anoSerie, identificacao, turno, anoLetivo }) {
    const sql = 'INSERT INTO turmas (ano_serie, identificacao, turno, ano_letivo) VALUES (?, ?, ?, ?)';
    const resultado = await this.#database.query(sql, [anoSerie, identificacao, turno, anoLetivo]);
    return this.buscarPorId(resultado.insertId);
  }

  async buscarPorId(id) {
    const linhas = await this.#database.query(`${SELECT_TURMA} WHERE id = ? AND ativo = 1`, [id]);
    return linhas.length > 0 ? this.#linhaParaTurma(linhas[0]) : null;
  }

  async listarTodos(anoLetivo = null) {
    let sql = `${SELECT_TURMA} WHERE ativo = 1`;
    const valores = [];

    // Filtro opcional: só acrescenta a condição se o ano letivo for informado
    if (anoLetivo) {
      sql += ' AND ano_letivo = ?';
      valores.push(anoLetivo);
    }

    sql += ' ORDER BY ano_letivo DESC, ano_serie, identificacao';
    const linhas = await this.#database.query(sql, valores);
    return linhas.map((linha) => this.#linhaParaTurma(linha));
  }

  async atualizar(id, { anoSerie, identificacao, turno, anoLetivo }) {
    const sql = `
      UPDATE turmas SET ano_serie = ?, identificacao = ?, turno = ?, ano_letivo = ?
      WHERE id = ? AND ativo = 1
    `;
    const resultado = await this.#database.query(sql, [anoSerie, identificacao, turno, anoLetivo, id]);
    return resultado.affectedRows > 0;
  }

  async inativar(id) {
    await this.#database.query('UPDATE turmas SET ativo = 0 WHERE id = ?', [id]);
  }

  #linhaParaTurma(linha) {
    return new Turma({
      id: linha.id,
      anoSerie: linha.ano_serie,
      identificacao: linha.identificacao,
      turno: linha.turno,
      anoLetivo: linha.ano_letivo,
      ativo: !!linha.ativo,
      criadoEm: linha.criado_em
    });
  }
}

module.exports = TurmaRepository;
