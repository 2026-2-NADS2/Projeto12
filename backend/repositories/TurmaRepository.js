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

    // Devolve o id do professor que leciona a disciplina na turma, ou null
  async professorDaDisciplina(turmaId, disciplinaId) {
    const linhas = await this.#database.query(
      'SELECT professor_id FROM turma_disciplina_professor WHERE turma_id = ? AND disciplina_id = ?',
      [turmaId, disciplinaId]
    );
    return linhas.length > 0 ? linhas[0].professor_id : null;
  }

  async alunoEstaNaTurma(turmaId, alunoId) {
    const linhas = await this.#database.query(
      'SELECT 1 FROM turma_aluno WHERE turma_id = ? AND aluno_id = ?',
      [turmaId, alunoId]
    );
    return linhas.length > 0;
  }

  // "Minhas turmas": todas as combinações turma + disciplina de um professor
  async listarAlocacoesDoProfessor(professorId) {
    const sql = `
      SELECT t.id AS turma_id, t.ano_serie, t.identificacao, t.turno, t.ano_letivo,
             d.id AS disciplina_id, d.nome AS disciplina_nome
      FROM turma_disciplina_professor tdp
      JOIN turmas t ON t.id = tdp.turma_id AND t.ativo = 1
      JOIN disciplinas d ON d.id = tdp.disciplina_id
      WHERE tdp.professor_id = ?
      ORDER BY t.ano_letivo DESC, t.ano_serie, t.identificacao, d.nome
    `;
    const linhas = await this.#database.query(sql, [professorId]);
    return linhas.map((linha) => {
      const turma = new Turma({
        id: linha.turma_id,
        anoSerie: linha.ano_serie,
        identificacao: linha.identificacao,
        turno: linha.turno,
        anoLetivo: linha.ano_letivo
      });
      return {
        turma: { id: turma.id, nome: turma.nome, turno: turma.turno, anoLetivo: turma.anoLetivo },
        disciplina: { id: linha.disciplina_id, nome: linha.disciplina_nome }
      };
    });
  }

    // Turma do aluno num ano letivo; sem ano, a turma mais recente
  async turmaDoAluno(alunoId, anoLetivo = null) {
    let sql = `
      SELECT t.id, t.ano_serie, t.identificacao, t.turno, t.ano_letivo, t.ativo, t.criado_em
      FROM turma_aluno ta
      JOIN turmas t ON t.id = ta.turma_id
      WHERE ta.aluno_id = ?
    `;
    const valores = [alunoId];
    if (anoLetivo) {
      sql += ' AND ta.ano_letivo = ?';
      valores.push(anoLetivo);
    }
    sql += ' ORDER BY ta.ano_letivo DESC LIMIT 1';

    const linhas = await this.#database.query(sql, valores);
    return linhas.length > 0 ? this.#linhaParaTurma(linhas[0]) : null;
  }

    async contarAlunos(turmaId) {
    const linhas = await this.#database.query('SELECT COUNT(*) AS total FROM turma_aluno WHERE turma_id = ?', [turmaId]);
    return linhas[0].total;
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
