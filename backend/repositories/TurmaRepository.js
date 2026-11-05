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

    async matricularAluno(turmaId, alunoId, anoLetivo) {
    const sql = 'INSERT INTO turma_aluno (turma_id, aluno_id, ano_letivo) VALUES (?, ?, ?)';
    await this.#database.query(sql, [turmaId, alunoId, anoLetivo]);
  }

  async listarAlunos(turmaId) {
    const sql = `
      SELECT a.id, a.nome, a.matricula
      FROM turma_aluno ta
      JOIN alunos a ON a.id = ta.aluno_id
      WHERE ta.turma_id = ? AND a.ativo = 1
      ORDER BY a.nome
    `;
    const linhas = await this.#database.query(sql, [turmaId]);
    return linhas.map((linha) => ({ alunoId: linha.id, nome: linha.nome, matricula: linha.matricula }));
  }

  async removerAluno(turmaId, alunoId) {
    const sql = 'DELETE FROM turma_aluno WHERE turma_id = ? AND aluno_id = ?';
    const resultado = await this.#database.query(sql, [turmaId, alunoId]);
    return resultado.affectedRows > 0;
  }

    async alocarDisciplina(turmaId, disciplinaId, professorId) {
    const sql = 'INSERT INTO turma_disciplina_professor (turma_id, disciplina_id, professor_id) VALUES (?, ?, ?)';
    await this.#database.query(sql, [turmaId, disciplinaId, professorId]);
  }

  async trocarProfessor(turmaId, disciplinaId, professorId) {
    const sql = 'UPDATE turma_disciplina_professor SET professor_id = ? WHERE turma_id = ? AND disciplina_id = ?';
    const resultado = await this.#database.query(sql, [professorId, turmaId, disciplinaId]);
    return resultado.affectedRows > 0;
  }

  async listarDisciplinas(turmaId) {
    const sql = `
      SELECT d.id AS disciplina_id, d.nome AS disciplina_nome,
             p.id AS professor_id, u.nome AS professor_nome
      FROM turma_disciplina_professor tdp
      JOIN disciplinas d ON d.id = tdp.disciplina_id
      JOIN professores p ON p.id = tdp.professor_id
      JOIN usuarios u ON u.id = p.usuario_id
      WHERE tdp.turma_id = ?
      ORDER BY d.nome
    `;
    const linhas = await this.#database.query(sql, [turmaId]);
    return linhas.map((linha) => ({
      disciplina: { id: linha.disciplina_id, nome: linha.disciplina_nome },
      professor: { id: linha.professor_id, nome: linha.professor_nome }
    }));
  }

  async removerDisciplina(turmaId, disciplinaId) {
    const sql = 'DELETE FROM turma_disciplina_professor WHERE turma_id = ? AND disciplina_id = ?';
    const resultado = await this.#database.query(sql, [turmaId, disciplinaId]);
    return resultado.affectedRows > 0;
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
