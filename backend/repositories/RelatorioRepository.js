// Partes comuns às consultas de acompanhamentos
const FROM_ACOMPANHAMENTOS = `
  FROM acompanhamentos ac
  JOIN alunos a ON a.id = ac.aluno_id
  JOIN turmas t ON t.id = ac.turma_id
  JOIN disciplinas d ON d.id = ac.disciplina_id
  JOIN professores p ON p.id = ac.professor_id
  JOIN usuarios u ON u.id = p.usuario_id
  JOIN bimestres b ON b.id = ac.bimestre_id
`;

// Agrupamentos permitidos. A chave escolhida pelo usuário só seleciona um item
// desta lista: nenhum texto vindo da requisição entra direto no SQL.
const AGRUPAMENTOS = {
  turma: { id: 't.id', nome: "CONCAT(t.ano_serie, 'º ano ', t.identificacao)" },
  disciplina: { id: 'd.id', nome: 'd.nome' },
  professor: { id: 'p.id', nome: 'u.nome' },
  aluno: { id: 'a.id', nome: 'a.nome' },
  bimestre: { id: 'b.id', nome: "CONCAT(b.numero, 'º bimestre')" }
};

class RelatorioRepository {
  #database;

  constructor(database) {
    this.#database = database;
  }

  static agrupamentosValidos() {
    return Object.keys(AGRUPAMENTOS);
  }

  async mediasPorGrupo(agrupar, filtros) {
    const grupo = AGRUPAMENTOS[agrupar];
    const { where, valores } = this.#montarWhere(filtros);
    const sql = `
      SELECT ${grupo.id} AS id, ${grupo.nome} AS nome,
             COUNT(*) AS quantidade,
             ROUND(AVG(ac.media), 1) AS media,
             MIN(ac.media) AS menor,
             MAX(ac.media) AS maior
      ${FROM_ACOMPANHAMENTOS}
      ${where}
      GROUP BY ${grupo.id}, ${grupo.nome}
      ORDER BY nome
    `;
    const linhas = await this.#database.query(sql, valores);
    return linhas.map((l) => ({
      id: l.id,
      nome: l.nome,
      quantidade: l.quantidade,
      media: Number(l.media),
      menor: Number(l.menor),
      maior: Number(l.maior)
    }));
  }

  async contagemPorTag(filtros) {
    const { where, valores } = this.#montarWhere(filtros);
    const sql = `
      SELECT tg.id, tg.nome,
             COUNT(DISTINCT ac.id) AS acompanhamentos,
             COUNT(DISTINCT ac.aluno_id) AS alunos,
             ROUND(AVG(ac.media), 1) AS media
      ${FROM_ACOMPANHAMENTOS}
      JOIN acompanhamento_tag acg ON acg.acompanhamento_id = ac.id
      JOIN tags tg ON tg.id = acg.tag_id
      ${where}
      GROUP BY tg.id, tg.nome
      ORDER BY acompanhamentos DESC, tg.nome
    `;
    const linhas = await this.#database.query(sql, valores);
    return linhas.map((l) => ({ ...l, media: Number(l.media) }));
  }

  async contagemPorStatus(filtros) {
    // Aqui o status não filtra: é justamente o que está sendo contado
    const { where, valores } = this.#montarWhere({ ...filtros, status: 'todos' });
    const linhas = await this.#database.query(
      `SELECT ac.status, COUNT(*) AS quantidade ${FROM_ACOMPANHAMENTOS} ${where} GROUP BY ac.status`,
      valores
    );
    // Começa com todos os status zerados e preenche com o que veio do banco
    const contagem = { rascunho: 0, enviado: 0, devolvido: 0, publicado: 0 };
    for (const linha of linhas) {
      contagem[linha.status] = linha.quantidade;
    }
    return contagem;
  }

  async listarParaExportacao(filtros) {
    const { where, valores } = this.#montarWhere(filtros);
    const sql = `
      SELECT a.nome AS aluno, a.matricula,
             t.ano_serie, t.identificacao,
             d.nome AS disciplina, u.nome AS professor,
             b.numero AS bimestre, b.ano_letivo,
             ac.media, ac.status, ac.descricao, ac.publicado_em,
             GROUP_CONCAT(DISTINCT tg.nome ORDER BY tg.nome SEPARATOR ', ') AS tags,
             (SELECT COUNT(*) FROM ciencias c
               WHERE c.aluno_id = ac.aluno_id AND c.bimestre_id = ac.bimestre_id) AS ciencias
      ${FROM_ACOMPANHAMENTOS}
      LEFT JOIN acompanhamento_tag acg ON acg.acompanhamento_id = ac.id
      LEFT JOIN tags tg ON tg.id = acg.tag_id
      ${where}
      GROUP BY ac.id
      ORDER BY t.ano_serie, t.identificacao, a.nome, d.nome
    `;
    const linhas = await this.#database.query(sql, valores);
    return linhas.map((l) => ({
      aluno: l.aluno,
      matricula: l.matricula,
      turma: `${l.ano_serie}º ano ${l.identificacao}`,
      disciplina: l.disciplina,
      professor: l.professor,
      bimestre: `${l.bimestre}º bimestre de ${l.ano_letivo}`,
      media: Number(l.media),
      status: l.status,
      tags: l.tags ?? '',
      descricao: l.descricao,
      publicadoEm: l.publicado_em,
      ciencias: l.ciencias
    }));
  }

  // Ciências e retornos dos responsáveis; com professorId, só das turmas desse professor
  async listarRetornos({ anoLetivo, bimestre, professorId = null }) {
    const condicoes = ['b.ano_letivo = ?'];
    const valores = [anoLetivo];

    if (bimestre) {
      condicoes.push('b.numero = ?');
      valores.push(bimestre);
    }
    if (professorId) {
      condicoes.push(`EXISTS (
        SELECT 1 FROM turma_disciplina_professor tdp
        WHERE tdp.turma_id = t.id AND tdp.professor_id = ?
      )`);
      valores.push(professorId);
    }

    const sql = `
      SELECT c.id, c.retorno, c.registrada_em,
             a.id AS aluno_id, a.nome AS aluno_nome,
             ur.nome AS responsavel_nome, ra.parentesco,
             t.ano_serie, t.identificacao,
             b.numero AS bimestre
      FROM ciencias c
      JOIN alunos a ON a.id = c.aluno_id
      JOIN responsaveis r ON r.id = c.responsavel_id
      JOIN usuarios ur ON ur.id = r.usuario_id
      LEFT JOIN responsavel_aluno ra ON ra.responsavel_id = c.responsavel_id AND ra.aluno_id = c.aluno_id
      JOIN bimestres b ON b.id = c.bimestre_id
      JOIN turma_aluno ta ON ta.aluno_id = c.aluno_id AND ta.ano_letivo = b.ano_letivo
      JOIN turmas t ON t.id = ta.turma_id
      WHERE ${condicoes.join(' AND ')}
      ORDER BY c.registrada_em DESC
    `;
    const linhas = await this.#database.query(sql, valores);
    return linhas.map((l) => ({
      id: l.id,
      aluno: { id: l.aluno_id, nome: l.aluno_nome },
      turma: `${l.ano_serie}º ano ${l.identificacao}`,
      bimestre: `${l.bimestre}º bimestre`,
      responsavel: l.responsavel_nome,
      parentesco: l.parentesco,
      retorno: l.retorno,
      registradaEm: l.registrada_em
    }));
  }

  #montarWhere({ anoLetivo, bimestre, turmaId, disciplinaId, status }) {
    const condicoes = ['b.ano_letivo = ?'];
    const valores = [anoLetivo];

    if (bimestre) { condicoes.push('b.numero = ?'); valores.push(bimestre); }
    if (turmaId) { condicoes.push('ac.turma_id = ?'); valores.push(turmaId); }
    if (disciplinaId) { condicoes.push('ac.disciplina_id = ?'); valores.push(disciplinaId); }
    if (status && status !== 'todos') { condicoes.push('ac.status = ?'); valores.push(status); }

    return { where: `WHERE ${condicoes.join(' AND ')}`, valores };
  }
}

module.exports = RelatorioRepository;