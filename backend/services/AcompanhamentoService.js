const ErroDeNegocio = require('../errors/ErroDeNegocio');

// Regras de negócio do acompanhamento (RF05 e envio do RF06)
class AcompanhamentoService {
  #acompanhamentoRepository;
  #professorRepository;
  #turmaRepository;
  #bimestreRepository;
  #tagRepository;

  constructor({ acompanhamentoRepository, professorRepository, turmaRepository, bimestreRepository, tagRepository }) {
    this.#acompanhamentoRepository = acompanhamentoRepository;
    this.#professorRepository = professorRepository;
    this.#turmaRepository = turmaRepository;
    this.#bimestreRepository = bimestreRepository;
    this.#tagRepository = tagRepository;
  }

  async listarMinhasTurmas(usuarioId) {
    const professor = await this.#professorLogado(usuarioId);
    return this.#turmaRepository.listarAlocacoesDoProfessor(professor.id);
  }

  async painel(usuarioId, turmaId, disciplinaId, numeroBimestre) {
    const professor = await this.#professorLogado(usuarioId);
    const { turma, bimestre } = await this.#contextoDeLancamento(professor, turmaId, disciplinaId, numeroBimestre);
    const alunos = await this.#acompanhamentoRepository.listarPainel(turma.id, disciplinaId, bimestre.id);

    return {
      turma: turma.nome,
      bimestre: bimestre.paraJSON(),
      digitacaoAberta: bimestre.estaAberto(),
      alunos
    };
  }

  async salvarRascunho(usuarioId, { turmaId, disciplinaId, numeroBimestre, alunoId, descricao, media, tagIds }) {
    const professor = await this.#professorLogado(usuarioId);
    const { turma, bimestre } = await this.#contextoDeLancamento(professor, turmaId, disciplinaId, numeroBimestre);

    if (!bimestre.estaAberto()) {
      throw new ErroDeNegocio(403, 'O período de digitação deste bimestre está fechado.');
    }
    if (!(await this.#turmaRepository.alunoEstaNaTurma(turma.id, alunoId))) {
      throw new ErroDeNegocio(404, 'Esse aluno não está matriculado nesta turma.');
    }

    const existente = await this.#acompanhamentoRepository.buscarPorChave(alunoId, disciplinaId, bimestre.id);
    if (existente && !existente.podeSerEditadoPeloProfessor()) {
      throw new ErroDeNegocio(409, `Este acompanhamento está "${existente.status}" e não pode mais ser editado pelo professor.`);
    }

    if (tagIds.length > 0) {
      const ativas = await this.#tagRepository.contarAtivas(tagIds);
      if (ativas !== tagIds.length) {
        throw new ErroDeNegocio(400, 'Uma ou mais tags não existem ou estão inativas.');
      }
    }

    const id = await this.#acompanhamentoRepository.salvarRascunho({
      alunoId, turmaId: turma.id, disciplinaId, professorId: professor.id,
      bimestreId: bimestre.id, descricao, media, tagIds,
      usuarioId, anterior: existente ? existente.retrato() : null
    });   
    return this.#acompanhamentoRepository.buscarPorId(id);
  }

  async enviar(usuarioId, acompanhamentoId) {
    const professor = await this.#professorLogado(usuarioId);
    const acompanhamento = await this.#acompanhamentoRepository.buscarPorId(acompanhamentoId);

    // Só quem leciona HOJE a disciplina na turma pode enviar
    const professorAtual = acompanhamento
      ? await this.#turmaRepository.professorDaDisciplina(acompanhamento.turmaId, acompanhamento.disciplinaId)
      : null;
    if (!acompanhamento || professorAtual !== professor.id) {
      throw new ErroDeNegocio(404, 'Acompanhamento não encontrado.');
    }
    if (!acompanhamento.podeSerEditadoPeloProfessor()) {
      throw new ErroDeNegocio(409, `Este acompanhamento já está "${acompanhamento.status}".`);
    }

    const bimestre = await this.#bimestreRepository.buscarPorId(acompanhamento.bimestreId);
    if (!bimestre.estaAberto()) {
      throw new ErroDeNegocio(403, 'O período de digitação deste bimestre está fechado.');
    }
    await this.#acompanhamentoRepository.enviar(acompanhamento.id, usuarioId, acompanhamento.retrato());
    return this.#acompanhamentoRepository.buscarPorId(acompanhamento.id);
  }

  // ----- Verificações reaproveitadas -----

  async #professorLogado(usuarioId) {
    const professor = await this.#professorRepository.buscarPorUsuarioId(usuarioId);
    if (!professor) {
      throw new ErroDeNegocio(403, 'Seu usuário não está cadastrado como professor ativo.');
    }
    return professor;
  }

  async #contextoDeLancamento(professor, turmaId, disciplinaId, numeroBimestre) {
    const turma = await this.#turmaRepository.buscarPorId(turmaId);
    if (!turma) {
      throw new ErroDeNegocio(404, 'Turma não encontrada.');
    }

    const professorDaDisciplina = await this.#turmaRepository.professorDaDisciplina(turma.id, disciplinaId);
    if (professorDaDisciplina !== professor.id) {
      throw new ErroDeNegocio(403, 'Você não leciona essa disciplina nesta turma.');
    }

    const bimestre = await this.#bimestreRepository.buscar(turma.anoLetivo, numeroBimestre);
    if (!bimestre) {
      throw new ErroDeNegocio(404, `O ${numeroBimestre}º bimestre de ${turma.anoLetivo} ainda não foi configurado.`);
    }

    return { turma, bimestre };
  }
}

module.exports = AcompanhamentoService;