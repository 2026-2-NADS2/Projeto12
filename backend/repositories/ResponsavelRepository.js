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