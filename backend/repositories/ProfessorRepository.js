const Professor = require('../models/Professor');

class ProfessorRepository {
  #database;
  #usuarioRepository;

  constructor(database, usuarioRepository) {
    this.#database = database;
    this.#usuarioRepository = usuarioRepository;
  }

  async criar({ nome, email, senha, registroFuncional }) {
    const usuario = await this.#usuarioRepository.criar({
      nome,
      email,
      senha,
      perfil: 'professor'
    });

    try {
      const sql = 'INSERT INTO professores (usuario_id, registro_funcional) VALUES (?, ?)';
      const resultado = await this.#database.query(sql, [usuario.id, registroFuncional]);

      return new Professor({
        id: resultado.insertId,
        usuarioId: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        registroFuncional
      });
    } catch (erro) {
      await this.#database.query('DELETE FROM usuarios WHERE id = ?', [usuario.id]);
      throw erro;
    }
  }

  async listarTodos() {
    const sql = `
      SELECT p.id, p.usuario_id, p.registro_funcional, p.ativo, p.criado_em, u.nome, u.email
      FROM professores p
      JOIN usuarios u ON u.id = p.usuario_id
      WHERE p.ativo = 1
    `;
    const linhas = await this.#database.query(sql);
    return linhas.map((linha) => this.#linhaParaProfessor(linha));
  }

    // Inativa o professor E a conta de login dele, num único comando
  async inativar(id) {
    const sql = `
      UPDATE professores p
      JOIN usuarios u ON u.id = p.usuario_id
      SET p.ativo = 0, u.ativo = 0
      WHERE p.id = ? AND p.ativo = 1
    `;
    const resultado = await this.#database.query(sql, [id]);
    return resultado.affectedRows > 0;
  }

  // Nome e e-mail ficam em "usuarios"; o registro funcional, em "professores"
  async atualizar(id, { nome, email, registroFuncional }) {
    const sql = `
      UPDATE professores p
      JOIN usuarios u ON u.id = p.usuario_id
      SET u.nome = ?, u.email = ?, p.registro_funcional = ?
      WHERE p.id = ? AND p.ativo = 1
    `;
    const resultado = await this.#database.query(sql, [nome, email, registroFuncional, id]);
    return resultado.affectedRows > 0;
  }

    async buscarPorId(id) {
    const sql = `
      SELECT p.id, p.usuario_id, p.registro_funcional, p.ativo, p.criado_em, u.nome, u.email
      FROM professores p
      JOIN usuarios u ON u.id = p.usuario_id
      WHERE p.id = ? AND p.ativo = 1
    `;
    const linhas = await this.#database.query(sql, [id]);
    return linhas.length > 0 ? this.#linhaParaProfessor(linhas[0]) : null;
  }

    async buscarPorUsuarioId(usuarioId) {
    const sql = `
      SELECT p.id, p.usuario_id, p.registro_funcional, p.ativo, p.criado_em, u.nome, u.email
      FROM professores p
      JOIN usuarios u ON u.id = p.usuario_id
      WHERE p.usuario_id = ? AND p.ativo = 1
    `;
    const linhas = await this.#database.query(sql, [usuarioId]);
    return linhas.length > 0 ? this.#linhaParaProfessor(linhas[0]) : null;
  }

  #linhaParaProfessor(linha) {
    return new Professor({
      id: linha.id,
      usuarioId: linha.usuario_id,
      nome: linha.nome,
      email: linha.email,
      registroFuncional: linha.registro_funcional,
      ativo: !!linha.ativo,
      criadoEm: linha.criado_em
    });
  }
}

module.exports = ProfessorRepository;