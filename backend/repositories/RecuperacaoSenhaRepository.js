class RecuperacaoSenhaRepository {
  #database;

  constructor(database) {
    this.#database = database;
  }

  // A validade é calculada pelo próprio MySQL (NOW() + N minutos),
  // para que gravação e conferência usem o mesmo relógio
  async criar(usuarioId, tokenHash, validadeMinutos) {
    await this.#database.query(
      'INSERT INTO recuperacoes_senha (usuario_id, token_hash, expira_em) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))',
      [usuarioId, tokenHash, validadeMinutos]
    );
  }

  // Se o token for válido: troca a senha, marca o token como usado
  // e invalida qualquer outro pedido pendente do mesmo usuário — tudo numa transação
  async redefinirSenha(tokenHash, senhaHash) {
    return this.#database.transacao(async (executar) => {
      const linhas = await executar(
        `SELECT usuario_id FROM recuperacoes_senha
         WHERE token_hash = ? AND usado_em IS NULL AND expira_em > NOW()
         FOR UPDATE`,
        [tokenHash]
      );
      if (linhas.length === 0) {
        return false;
      }

      const usuarioId = linhas[0].usuario_id;
      await executar('UPDATE usuarios SET senha_hash = ? WHERE id = ? AND ativo = 1', [senhaHash, usuarioId]);
      await executar(
        'UPDATE recuperacoes_senha SET usado_em = NOW() WHERE usuario_id = ? AND usado_em IS NULL',
        [usuarioId]
      );
      return true;
    });
  }
}

module.exports = RecuperacaoSenhaRepository;