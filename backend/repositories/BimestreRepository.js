const Bimestre = require('../models/Bimestre');

const SELECT_BIMESTRE = 'SELECT id, ano_letivo, numero, abertura, encerramento, atualizado_em FROM bimestres';

class BimestreRepository {
  #database;

  constructor(database) {
    this.#database = database;
  }

  // Upsert: cria o bimestre se não existir; se já existir, atualiza as datas
  async definir({ anoLetivo, numero, abertura, encerramento }) {
    const sql = `
      INSERT INTO bimestres (ano_letivo, numero, abertura, encerramento)
      VALUES (?, ?, ?, ?) AS novo
      ON DUPLICATE KEY UPDATE abertura = novo.abertura, encerramento = novo.encerramento
    `;
    await this.#database.query(sql, [anoLetivo, numero, abertura, encerramento]);
    return this.buscar(anoLetivo, numero);
  }

  async buscar(anoLetivo, numero) {
    const linhas = await this.#database.query(
      `${SELECT_BIMESTRE} WHERE ano_letivo = ? AND numero = ?`,
      [anoLetivo, numero]
    );
    return linhas.length > 0 ? this.#linhaParaBimestre(linhas[0]) : null;
  }

  async listarPorAno(anoLetivo) {
    const linhas = await this.#database.query(
      `${SELECT_BIMESTRE} WHERE ano_letivo = ? ORDER BY numero`,
      [anoLetivo]
    );
    return linhas.map((linha) => this.#linhaParaBimestre(linha));
  }

  // Procura outro bimestre do mesmo ano cujo período se cruze com o informado.
  // Devolve o número do bimestre em conflito, ou null se não houver.
  async buscarSobreposicao(anoLetivo, numero, abertura, encerramento) {
    const sql = `
      SELECT numero FROM bimestres
      WHERE ano_letivo = ? AND numero <> ?
        AND abertura < ? AND encerramento > ?
      LIMIT 1
    `;
    const linhas = await this.#database.query(sql, [anoLetivo, numero, encerramento, abertura]);
    return linhas.length > 0 ? linhas[0].numero : null;
  }

  #linhaParaBimestre(linha) {
    return new Bimestre({
      id: linha.id,
      anoLetivo: linha.ano_letivo,
      numero: linha.numero,
      abertura: linha.abertura,
      encerramento: linha.encerramento,
      atualizadoEm: linha.atualizado_em
    });
  }
}

module.exports = BimestreRepository;