const ErroDeNegocio = require('../errors/ErroDeNegocio');

// Regras da revisão administrativa (RF06) — toda ação fica no histórico (RF07)
class RevisaoService {
  #acompanhamentoRepository;
  #tagRepository;

  constructor({ acompanhamentoRepository, tagRepository }) {
    this.#acompanhamentoRepository = acompanhamentoRepository;
    this.#tagRepository = tagRepository;
  }

  listarFila(filtros) {
    return this.#acompanhamentoRepository.listarParaRevisao(filtros);
  }

  async detalhar(id) {
    const detalhe = await this.#acompanhamentoRepository.buscarDetalhe(id);
    if (!detalhe) {
      throw new ErroDeNegocio(404, 'Acompanhamento não encontrado.');
    }
    detalhe.historico = await this.#acompanhamentoRepository.listarHistorico(id);
    return detalhe;
  }

  async alterar(usuarioId, id, { descricao, media, tagIds }) {
    const acompanhamento = await this.#emRevisao(id);

    if (tagIds.length > 0) {
      const ativas = await this.#tagRepository.contarAtivas(tagIds);
      if (ativas !== tagIds.length) {
        throw new ErroDeNegocio(400, 'Uma ou mais tags não existem ou estão inativas.');
      }
    }

    await this.#acompanhamentoRepository.alterarNaRevisao(id, { descricao, media, tagIds }, usuarioId, acompanhamento.retrato());
    return this.detalhar(id);
  }

  async devolver(usuarioId, id, observacao) {
    const acompanhamento = await this.#emRevisao(id);
    await this.#acompanhamentoRepository.devolver(id, observacao, usuarioId, acompanhamento.retrato());
    return this.detalhar(id);
  }

  async publicar(usuarioId, id) {
    const acompanhamento = await this.#emRevisao(id);
    await this.#acompanhamentoRepository.publicar(id, usuarioId, acompanhamento.retrato());
    return this.detalhar(id);
  }

  // O admin só age sobre acompanhamentos enviados (aguardando revisão)
  async #emRevisao(id) {
    const acompanhamento = await this.#acompanhamentoRepository.buscarPorId(id);
    if (!acompanhamento) {
      throw new ErroDeNegocio(404, 'Acompanhamento não encontrado.');
    }
    if (!acompanhamento.aguardandoRevisao()) {
      throw new ErroDeNegocio(409, `Só é possível revisar acompanhamentos enviados. Este está "${acompanhamento.status}".`);
    }
    return acompanhamento;
  }
}

module.exports = RevisaoService;