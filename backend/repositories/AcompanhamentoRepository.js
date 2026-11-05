const Acompanhamento = require('../models/Acompanhamento');

class AcompanhamentoRepository {
  #database;

  constructor(database) {
    this.#database = database;
  }

  async buscarPorId(id) {
    const linhas = await this.#database.query('SELECT * FROM acompanhamentos WHERE id = ?', [id]);
    return this.#primeiroComTags(linhas);
  }

  async buscarPorChave(alunoId, disciplinaId, bimestreId) {
    const linhas = await this.#database.query(
      'SELECT * FROM acompanhamentos WHERE aluno_id = ? AND disciplina_id = ? AND bimestre_id = ?',
      [alunoId, disciplinaId, bimestreId]
    );
    return this.#primeiroComTags(linhas);
  }

  // Todos os alunos da turma, com o acompanhamento de cada um (ou null se ainda não existe)
  async listarPainel(turmaId, disciplinaId, bimestreId) {
    // ac.* vem primeiro: as colunas do aluno, escritas depois, prevalecem em caso de nome repetido
    const sql = `
      SELECT ac.*, a.id AS aluno_id, a.nome AS aluno_nome, a.matricula
      FROM turma_aluno ta
      JOIN alunos a ON a.id = ta.aluno_id AND a.ativo = 1
      LEFT JOIN acompanhamentos ac
        ON ac.aluno_id = ta.aluno_id AND ac.disciplina_id = ? AND ac.bimestre_id = ?
      WHERE ta.turma_id = ?
      ORDER BY a.nome
    `;
    const linhas = await this.#database.query(sql, [disciplinaId, bimestreId, turmaId]);

    const idsComRegistro = linhas.filter((l) => l.id !== null).map((l) => l.id);
    const tagsPorId = await this.#tagsPorAcompanhamento(idsComRegistro);

    return linhas.map((linha) => ({
      aluno: { id: linha.aluno_id, nome: linha.aluno_nome, matricula: linha.matricula },
      acompanhamento: linha.id === null
        ? null
        : this.#linhaParaAcompanhamento(linha, tagsPorId.get(linha.id) ?? []).paraJSON()
    }));
  }

  // Cria ou atualiza o rascunho e substitui as tags, tudo numa transação
  async salvarRascunho({ alunoId, turmaId, disciplinaId, professorId, bimestreId, descricao, media, tagIds }) {
    return this.#database.transacao(async (executar) => {
      const sql = `
        INSERT INTO acompanhamentos (aluno_id, turma_id, disciplina_id, professor_id, bimestre_id, descricao, media)
        VALUES (?, ?, ?, ?, ?, ?, ?) AS novo
        ON DUPLICATE KEY UPDATE
          descricao = novo.descricao,
          media = novo.media,
          professor_id = novo.professor_id,
          id = LAST_INSERT_ID(acompanhamentos.id)
      `;
      const resultado = await executar(sql, [alunoId, turmaId, disciplinaId, professorId, bimestreId, descricao, media]);
      const id = resultado.insertId;

      await executar('DELETE FROM acompanhamento_tag WHERE acompanhamento_id = ?', [id]);
      if (tagIds.length > 0) {
        const pares = tagIds.map((tagId) => [id, tagId]);
        await executar('INSERT INTO acompanhamento_tag (acompanhamento_id, tag_id) VALUES ?', [pares]);
      }

      return id;
    });
  }

  async marcarEnviado(id) {
    const resultado = await this.#database.query(
      `UPDATE acompanhamentos SET status = 'enviado', enviado_em = NOW()
       WHERE id = ? AND status IN ('rascunho', 'devolvido')`,
      [id]
    );
    return resultado.affectedRows > 0;
  }

  async #primeiroComTags(linhas) {
    if (linhas.length === 0) return null;
    const tagsPorId = await this.#tagsPorAcompanhamento([linhas[0].id]);
    return this.#linhaParaAcompanhamento(linhas[0], tagsPorId.get(linhas[0].id) ?? []);
  }

  // Busca as tags de vários acompanhamentos numa única consulta
  // e as organiza num Map: id do acompanhamento → lista de tags
  async #tagsPorAcompanhamento(ids) {
    const mapa = new Map();
    if (ids.length === 0) return mapa;

    const linhas = await this.#database.query(
      `SELECT acg.acompanhamento_id, t.id, t.nome
       FROM acompanhamento_tag acg
       JOIN tags t ON t.id = acg.tag_id
       WHERE acg.acompanhamento_id IN (?)
       ORDER BY t.nome`,
      [ids]
    );

    for (const linha of linhas) {
      if (!mapa.has(linha.acompanhamento_id)) mapa.set(linha.acompanhamento_id, []);
      mapa.get(linha.acompanhamento_id).push({ id: linha.id, nome: linha.nome });
    }
    return mapa;
  }

  #linhaParaAcompanhamento(linha, tags) {
    return new Acompanhamento({
      id: linha.id,
      alunoId: linha.aluno_id,
      turmaId: linha.turma_id,
      disciplinaId: linha.disciplina_id,
      professorId: linha.professor_id,
      bimestreId: linha.bimestre_id,
      descricao: linha.descricao,
      media: Number(linha.media),
      status: linha.status,
      observacaoRevisao: linha.observacao_revisao,
      tags,
      enviadoEm: linha.enviado_em,
      publicadoEm: linha.publicado_em,
      atualizadoEm: linha.atualizado_em
    });
  }
}

module.exports = AcompanhamentoRepository;