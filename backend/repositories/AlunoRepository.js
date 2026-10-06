const Aluno = require('../models/Aluno');

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

  async listarTodos() {
    const sql = 'SELECT * FROM alunos WHERE ativo = 1';
    const linhas = await this.#database.query(sql);
    return linhas.map((linha) => this.#linhaParaAluno(linha));
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
    const sql = 'UPDATE alunos SET nome = ?, data_nascimento = ?, matricula = ? WHERE id = ?';
    await this.#database.query(sql, [nome, dataNascimento, matricula, id]);
    return this.buscarPorId(id);
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