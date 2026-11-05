const Responsavel = require('../models/Responsavel');

class ResponsavelRepository {
  #database;
  #usuarioRepository;

  constructor(database, usuarioRepository) {
    this.#database = database;
    this.#usuarioRepository = usuarioRepository;
  }

  async criar({ nome, email, senha, telefone = null }) {
    // 1º passo: cria a conta de login com perfil de responsável
    const usuario = await this.#usuarioRepository.criar({
      nome,
      email,
      senha,
      perfil: 'responsavel'
    });

    // 2º passo: cria o cadastro de responsável ligado a essa conta.
    // Se falhar, apaga a conta criada no 1º passo para não deixar "usuário órfão".
    try {
      const sql = 'INSERT INTO responsaveis (usuario_id, telefone) VALUES (?, ?)';
      const resultado = await this.#database.query(sql, [usuario.id, telefone]);

      return new Responsavel({
        id: resultado.insertId,
        usuarioId: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        telefone
      });
    } catch (erro) {
      await this.#database.query('DELETE FROM usuarios WHERE id = ?', [usuario.id]);
      throw erro;
    }
  }

  async listarTodos() {
    const sql = `
      SELECT r.id, r.usuario_id, r.telefone, r.ativo, r.criado_em, u.nome, u.email
      FROM responsaveis r
      JOIN usuarios u ON u.id = r.usuario_id
      WHERE r.ativo = 1
      ORDER BY u.nome
    `;
    const linhas = await this.#database.query(sql);
    return linhas.map((linha) => this.#linhaParaResponsavel(linha));
  }

  async inativar(id) {
    const sql = 'UPDATE responsaveis SET ativo = 0 WHERE id = ?';
    await this.#database.query(sql, [id]);
  }

    async vincularAluno(responsavelId, alunoId, parentesco) {
    const sql = 'INSERT INTO responsavel_aluno (responsavel_id, aluno_id, parentesco) VALUES (?, ?, ?)';
    await this.#database.query(sql, [responsavelId, alunoId, parentesco]);
  }

  async listarAlunos(responsavelId) {
    const sql = `
      SELECT a.id, a.nome, a.matricula, ra.parentesco
      FROM responsavel_aluno ra
      JOIN alunos a ON a.id = ra.aluno_id
      WHERE ra.responsavel_id = ? AND a.ativo = 1
      ORDER BY a.nome
    `;
    const linhas = await this.#database.query(sql, [responsavelId]);
    return linhas.map((linha) => ({
      alunoId: linha.id,
      nome: linha.nome,
      matricula: linha.matricula,
      parentesco: linha.parentesco
    }));
  }

  async desvincularAluno(responsavelId, alunoId) {
    const sql = 'DELETE FROM responsavel_aluno WHERE responsavel_id = ? AND aluno_id = ?';
    const resultado = await this.#database.query(sql, [responsavelId, alunoId]);
    return resultado.affectedRows > 0;
  }

    async buscarPorUsuarioId(usuarioId) {
    const sql = `
      SELECT r.id, r.usuario_id, r.telefone, r.ativo, r.criado_em, u.nome, u.email
      FROM responsaveis r
      JOIN usuarios u ON u.id = r.usuario_id
      WHERE r.usuario_id = ? AND r.ativo = 1
    `;
    const linhas = await this.#database.query(sql, [usuarioId]);
    return linhas.length > 0 ? this.#linhaParaResponsavel(linhas[0]) : null;
  }

  // Devolve o vínculo (com dados do aluno) se o aluno for deste responsável; senão, null
  async buscarVinculo(responsavelId, alunoId) {
    const linhas = await this.#database.query(
      `SELECT a.id, a.nome, a.matricula, ra.parentesco
       FROM responsavel_aluno ra
       JOIN alunos a ON a.id = ra.aluno_id AND a.ativo = 1
       WHERE ra.responsavel_id = ? AND ra.aluno_id = ?`,
      [responsavelId, alunoId]
    );
    if (linhas.length === 0) return null;
    const l = linhas[0];
    return { alunoId: l.id, nome: l.nome, matricula: l.matricula, parentesco: l.parentesco };
  }

  async registrarCiencia(responsavelId, alunoId, bimestreId, retorno) {
    await this.#database.query(
      'INSERT INTO ciencias (responsavel_id, aluno_id, bimestre_id, retorno) VALUES (?, ?, ?, ?)',
      [responsavelId, alunoId, bimestreId, retorno]
    );
  }

  async buscarCiencia(responsavelId, alunoId, bimestreId) {
    const linhas = await this.#database.query(
      'SELECT retorno, registrada_em FROM ciencias WHERE responsavel_id = ? AND aluno_id = ? AND bimestre_id = ?',
      [responsavelId, alunoId, bimestreId]
    );
    return linhas.length > 0 ? { registradaEm: linhas[0].registrada_em, retorno: linhas[0].retorno } : null;
  }

  #linhaParaResponsavel(linha) {
    return new Responsavel({
      id: linha.id,
      usuarioId: linha.usuario_id,
      nome: linha.nome,
      email: linha.email,
      telefone: linha.telefone,
      ativo: !!linha.ativo,
      criadoEm: linha.criado_em
    });
  }
}

module.exports = ResponsavelRepository;