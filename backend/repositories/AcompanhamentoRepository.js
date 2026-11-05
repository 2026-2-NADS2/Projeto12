const Acompanhamento = require('../models/Acompanhamento');
const Turma = require('../models/Turma');

// Acompanhamento com os nomes de tudo o que ele referencia (usado na revisão)
const SELECT_DETALHE = `
  SELECT ac.*,
         a.nome AS aluno_nome, a.matricula,
         t.ano_serie, t.identificacao, t.ano_letivo,
         d.nome AS disciplina_nome,
         u.nome AS professor_nome,
         b.numero AS bimestre_numero
  FROM acompanhamentos ac
  JOIN alunos a ON a.id = ac.aluno_id
  JOIN turmas t ON t.id = ac.turma_id
  JOIN disciplinas d ON d.id = ac.disciplina_id
  JOIN professores p ON p.id = ac.professor_id
  JOIN usuarios u ON u.id = p.usuario_id
  JOIN bimestres b ON b.id = ac.bimestre_id
`;

class AcompanhamentoRepository {
  #database;

  constructor(database) {
    this.#database = database;
  }

  // ===== Consultas =====

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

  async buscarDetalhe(id) {
    const linhas = await this.#database.query(`${SELECT_DETALHE} WHERE ac.id = ?`, [id]);
    if (linhas.length === 0) return null;
    const tagsPorId = await this.#tagsPorAcompanhamento([linhas[0].id]);
    return this.#linhaParaDetalhe(linhas[0], tagsPorId);
  }

  // Fila de revisão: status obrigatório, demais filtros opcionais
  async listarParaRevisao({ status, anoLetivo, bimestre, turmaId, disciplinaId }) {
    const condicoes = ['ac.status = ?'];
    const valores = [status];

    if (anoLetivo) { condicoes.push('b.ano_letivo = ?'); valores.push(anoLetivo); }
    if (bimestre) { condicoes.push('b.numero = ?'); valores.push(bimestre); }
    if (turmaId) { condicoes.push('ac.turma_id = ?'); valores.push(turmaId); }
    if (disciplinaId) { condicoes.push('ac.disciplina_id = ?'); valores.push(disciplinaId); }

    const sql = `${SELECT_DETALHE} WHERE ${condicoes.join(' AND ')} ORDER BY ac.enviado_em, a.nome`;
    const linhas = await this.#database.query(sql, valores);
    const tagsPorId = await this.#tagsPorAcompanhamento(linhas.map((l) => l.id));
    return linhas.map((linha) => this.#linhaParaDetalhe(linha, tagsPorId));
  }

  async listarHistorico(acompanhamentoId) {
    const linhas = await this.#database.query(
      `SELECT h.id, h.acao, h.estado_anterior, h.estado_posterior, h.observacao, h.criado_em,
              u.id AS usuario_id, u.nome AS usuario_nome, u.perfil
       FROM historico_auditoria h
       JOIN usuarios u ON u.id = h.usuario_id
       WHERE h.entidade = 'acompanhamento' AND h.entidade_id = ?
       ORDER BY h.criado_em, h.id`,
      [acompanhamentoId]
    );
    return linhas.map((l) => ({
      id: l.id,
      acao: l.acao,
      usuario: { id: l.usuario_id, nome: l.usuario_nome, perfil: l.perfil },
      dataHora: l.criado_em,
      estadoAnterior: l.estado_anterior,
      estadoPosterior: l.estado_posterior,
      observacao: l.observacao
    }));
  }

    // Somente PUBLICADOS: é o que o responsável pode ver
  async listarPublicadosDoAluno(alunoId, bimestreId) {
    const linhas = await this.#database.query(
      `SELECT ac.id, ac.media, ac.descricao, ac.publicado_em,
              d.nome AS disciplina_nome, u.nome AS professor_nome
       FROM acompanhamentos ac
       JOIN disciplinas d ON d.id = ac.disciplina_id
       JOIN professores p ON p.id = ac.professor_id
       JOIN usuarios u ON u.id = p.usuario_id
       WHERE ac.aluno_id = ? AND ac.bimestre_id = ? AND ac.status = 'publicado'
       ORDER BY d.nome`,
      [alunoId, bimestreId]
    );
    const tagsPorId = await this.#tagsPorAcompanhamento(linhas.map((l) => l.id));
    return linhas.map((l) => ({
      disciplina: l.disciplina_nome,
      professor: l.professor_nome,
      media: Number(l.media),
      descricao: l.descricao,
      tags: tagsPorId.get(l.id) ?? [],
      publicadoEm: l.publicado_em
    }));
  }

  // ===== Gravações: cada uma numa transação, junto com o registro no histórico =====

  async salvarRascunho({ alunoId, turmaId, disciplinaId, professorId, bimestreId, descricao, media, tagIds, usuarioId, anterior }) {
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

      await this.#substituirTags(executar, id, tagIds);

      const posterior = {
        descricao,
        media,
        status: anterior?.status ?? 'rascunho',
        observacaoRevisao: anterior?.observacaoRevisao ?? null,
        tagIds
      };
      await this.#registrarHistorico(executar, { id, acao: anterior ? 'editado' : 'criado', usuarioId, anterior, posterior });
      return id;
    });
  }

  async enviar(id, usuarioId, anterior) {
    return this.#database.transacao(async (executar) => {
      await executar(`UPDATE acompanhamentos SET status = 'enviado', enviado_em = NOW() WHERE id = ?`, [id]);
      await this.#registrarHistorico(executar, {
        id, acao: 'enviado', usuarioId, anterior, posterior: { ...anterior, status: 'enviado' }
      });
    });
  }

  async alterarNaRevisao(id, { descricao, media, tagIds }, usuarioId, anterior) {
    return this.#database.transacao(async (executar) => {
      await executar(
        'UPDATE acompanhamentos SET descricao = ?, media = ?, revisor_id = ?, revisado_em = NOW() WHERE id = ?',
        [descricao, media, usuarioId, id]
      );
      await this.#substituirTags(executar, id, tagIds);
      await this.#registrarHistorico(executar, {
        id, acao: 'alterado', usuarioId, anterior, posterior: { ...anterior, descricao, media, tagIds }
      });
    });
  }

  async devolver(id, observacao, usuarioId, anterior) {
    return this.#database.transacao(async (executar) => {
      await executar(
        `UPDATE acompanhamentos SET status = 'devolvido', observacao_revisao = ?, revisor_id = ?, revisado_em = NOW()
         WHERE id = ?`,
        [observacao, usuarioId, id]
      );
      await this.#registrarHistorico(executar, {
        id, acao: 'devolvido', usuarioId, anterior, observacao,
        posterior: { ...anterior, status: 'devolvido', observacaoRevisao: observacao }
      });
    });
  }

  async publicar(id, usuarioId, anterior) {
    return this.#database.transacao(async (executar) => {
      await executar(
        `UPDATE acompanhamentos SET status = 'publicado', publicado_em = NOW(), revisor_id = ?, revisado_em = NOW()
         WHERE id = ?`,
        [usuarioId, id]
      );
      await this.#registrarHistorico(executar, {
        id, acao: 'publicado', usuarioId, anterior, posterior: { ...anterior, status: 'publicado' }
      });
    });
  }

  // ===== Auxiliares =====

  async #substituirTags(executar, id, tagIds) {
    await executar('DELETE FROM acompanhamento_tag WHERE acompanhamento_id = ?', [id]);
    if (tagIds.length > 0) {
      const pares = tagIds.map((tagId) => [id, tagId]);
      await executar('INSERT INTO acompanhamento_tag (acompanhamento_id, tag_id) VALUES ?', [pares]);
    }
  }

  async #registrarHistorico(executar, { id, acao, usuarioId, anterior, posterior, observacao = null }) {
    await executar(
      `INSERT INTO historico_auditoria (entidade, entidade_id, acao, usuario_id, estado_anterior, estado_posterior, observacao)
       VALUES ('acompanhamento', ?, ?, ?, ?, ?, ?)`,
      [id, acao, usuarioId, anterior ? JSON.stringify(anterior) : null, JSON.stringify(posterior), observacao]
    );
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

  #linhaParaDetalhe(linha, tagsPorId) {
    const turma = new Turma({
      id: linha.turma_id,
      anoSerie: linha.ano_serie,
      identificacao: linha.identificacao,
      anoLetivo: linha.ano_letivo
    });
    return {
      acompanhamento: this.#linhaParaAcompanhamento(linha, tagsPorId.get(linha.id) ?? []).paraJSON(),
      aluno: { id: linha.aluno_id, nome: linha.aluno_nome, matricula: linha.matricula },
      turma: { id: turma.id, nome: turma.nome, anoLetivo: turma.anoLetivo },
      disciplina: { id: linha.disciplina_id, nome: linha.disciplina_nome },
      professor: { id: linha.professor_id, nome: linha.professor_nome },
      bimestre: { id: linha.bimestre_id, numero: linha.bimestre_numero, nome: `${linha.bimestre_numero}º bimestre` }
    };
  }
}

module.exports = AcompanhamentoRepository;