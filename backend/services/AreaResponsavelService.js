const ErroDeNegocio = require('../errors/ErroDeNegocio');

// Regras da área do responsável (RF08, RF09, RF12)
class AreaResponsavelService {
  #responsavelRepository;
  #acompanhamentoRepository;
  #turmaRepository;
  #bimestreRepository;
  #geradorPdf;

  constructor({ responsavelRepository, acompanhamentoRepository, turmaRepository, bimestreRepository, geradorPdf }) {
    this.#responsavelRepository = responsavelRepository;
    this.#acompanhamentoRepository = acompanhamentoRepository;
    this.#turmaRepository = turmaRepository;
    this.#bimestreRepository = bimestreRepository;
    this.#geradorPdf = geradorPdf;
  }

  async listarMeusAlunos(usuarioId) {
    const responsavel = await this.#responsavelLogado(usuarioId);
    const alunos = await this.#responsavelRepository.listarAlunos(responsavel.id);

    // Para cada aluno, busca a turma mais recente (as buscas rodam em paralelo)
    return Promise.all(alunos.map(async (aluno) => {
      const turma = await this.#turmaRepository.turmaDoAluno(aluno.alunoId);
      return {
        ...aluno,
        turmaAtual: turma ? { id: turma.id, nome: turma.nome, anoLetivo: turma.anoLetivo } : null
      };
    }));
  }

  async relatorio(usuarioId, alunoId, anoLetivo, numeroBimestre) {
    const responsavel = await this.#responsavelLogado(usuarioId);
    return this.#montarRelatorio(responsavel, alunoId, anoLetivo, numeroBimestre);
  }

  async relatorioPdf(usuarioId, alunoId, anoLetivo, numeroBimestre) {
    const relatorio = await this.relatorio(usuarioId, alunoId, anoLetivo, numeroBimestre);
    if (relatorio.disciplinas.length === 0) {
      throw new ErroDeNegocio(404, 'Ainda não há relatório publicado para este bimestre.');
    }
    const pdf = await this.#geradorPdf.relatorioDoAluno(relatorio);
    const nomeArquivo = `relatorio-${relatorio.aluno.matricula}-${anoLetivo}-${numeroBimestre}bim.pdf`;
    return { pdf, nomeArquivo };
  }

  async registrarCiencia(usuarioId, alunoId, anoLetivo, numeroBimestre, retorno) {
    const responsavel = await this.#responsavelLogado(usuarioId);
    const relatorio = await this.#montarRelatorio(responsavel, alunoId, anoLetivo, numeroBimestre);

    if (relatorio.disciplinas.length === 0) {
      throw new ErroDeNegocio(409, 'Não há relatório publicado neste bimestre para registrar ciência.');
    }
    if (relatorio.ciencia) {
      throw new ErroDeNegocio(409, 'A ciência deste bimestre já foi registrada.');
    }

    await this.#responsavelRepository.registrarCiencia(responsavel.id, alunoId, relatorio.bimestre.id, retorno);
    return this.#montarRelatorio(responsavel, alunoId, anoLetivo, numeroBimestre);
  }

  // ----- Verificações reaproveitadas -----

  async #responsavelLogado(usuarioId) {
    const responsavel = await this.#responsavelRepository.buscarPorUsuarioId(usuarioId);
    if (!responsavel) {
      throw new ErroDeNegocio(403, 'Seu usuário não está cadastrado como responsável ativo.');
    }
    return responsavel;
  }

  async #montarRelatorio(responsavel, alunoId, anoLetivo, numeroBimestre) {
    // Aluno que não é deste responsável → 404, para não revelar que ele existe
    const vinculo = await this.#responsavelRepository.buscarVinculo(responsavel.id, alunoId);
    if (!vinculo) {
      throw new ErroDeNegocio(404, 'Aluno não encontrado entre os seus vinculados.');
    }

    const bimestre = await this.#bimestreRepository.buscar(anoLetivo, numeroBimestre);
    if (!bimestre) {
      throw new ErroDeNegocio(404, `O ${numeroBimestre}º bimestre de ${anoLetivo} não existe.`);
    }

    const turma = await this.#turmaRepository.turmaDoAluno(alunoId, anoLetivo);
    const disciplinas = await this.#acompanhamentoRepository.listarPublicadosDoAluno(alunoId, bimestre.id);
    const ciencia = await this.#responsavelRepository.buscarCiencia(responsavel.id, alunoId, bimestre.id);

    return {
      aluno: { id: vinculo.alunoId, nome: vinculo.nome, matricula: vinculo.matricula },
      parentesco: vinculo.parentesco,
      turma: turma ? turma.nome : null,
      anoLetivo,
      bimestre: { id: bimestre.id, numero: bimestre.numero, nome: `${bimestre.numero}º bimestre` },
      disciplinas,
      ciencia
    };
  }
}

module.exports = AreaResponsavelService;