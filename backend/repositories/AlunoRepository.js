const Aluno = require('../models/Aluno');
const { escaparLike } = require('../utils/sql');

class AlunoRepository {
  #database;

  constructor(database) {
    this.#database = database;
  }

  async criar({ nome, dataNascimento, matricula }) {
    const sql = 'INSERT INTO alunos (nome, data_nascimento, matricula) VALUES (?, ?, ?)';
    const resultado = await this.#database.query(sql, [nome, dataNascimento, matricula]);

    return new Aluno({ id: resultado.insertId, nome, dataNascimento, matricula });
  }

  // Lista paginada de alunos ativos, com busca opcional por nome ou matrícula
  async listarTodos({ busca = null, limite = 20, offset = 0 } = {}) {
    let where = 'WHERE ativo = 1';
    const valores = [];

    if (busca) {
      const termo = `%${escaparLike(busca)}%`;
      where += ' AND (nome LIKE ? OR matricula LIKE ?)';
      valores.push(termo, termo);
    }

    const [{ total }] = await this.#database.query(`SELECT COUNT(*) AS total FROM alunos ${where}`, valores);
    const linhas = await this.#database.query(
      `SELECT * FROM alunos ${where} ORDER BY nome LIMIT ? OFFSET ?`,
      [...valores, limite, offset]
    );

    return { itens: linhas.map((linha) => this.#linhaParaAluno(linha)), total };
  }
  
  async buscarPorId(id) {
    const sql = 'SELECT * FROM alunos WHERE id = ?';
    const linhas = await this.#database.query(sql, [id]);

    if (linhas.length === 0) {
      return null;
    }

    return this.#linhaParaAluno(linhas[0]);
  }

  async atualizar(id, { nome, dataNascimento, matricula }) {
    const sql = 'UPDATE alunos SET nome = ?, data_nascimento = ?, matricula = ? WHERE id = ? AND ativo = 1';
    const resultado = await this.#database.query(sql, [nome, dataNascimento, matricula, id]);
    return resultado.affectedRows > 0 ? this.buscarPorId(id) : null;
  }

  async inativar(id) {
    const sql = 'UPDATE alunos SET ativo = 0 WHERE id = ?';
    await this.#database.query(sql, [id]);
  }

  #linhaParaAluno(linha) {
    return new Aluno({
      id: linha.id,
      nome: linha.nome,
      dataNascimento: linha.data_nascimento,
      matricula: linha.matricula,
      ativo: !!linha.ativo,
      criadoEm: linha.criado_em
    });
  }
}

module.exports = AlunoRepository;