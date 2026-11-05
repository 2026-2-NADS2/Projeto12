// Status em que o professor ainda pode alterar o registro
const STATUS_EDITAVEIS_PELO_PROFESSOR = ['rascunho', 'devolvido'];

class Acompanhamento {
  constructor({
    id = null, alunoId, turmaId, disciplinaId, professorId, bimestreId,
    descricao, media, status = 'rascunho', observacaoRevisao = null, tags = [],
    enviadoEm = null, publicadoEm = null, atualizadoEm = null
  }) {
    // Copia todos os campos recebidos para o objeto de uma vez
    Object.assign(this, {
      id, alunoId, turmaId, disciplinaId, professorId, bimestreId,
      descricao, media, status, observacaoRevisao, tags,
      enviadoEm, publicadoEm, atualizadoEm
    });
  }

  podeSerEditadoPeloProfessor() {
    return STATUS_EDITAVEIS_PELO_PROFESSOR.includes(this.status);
  }

  paraJSON() {
    return {
      id: this.id,
      alunoId: this.alunoId,
      turmaId: this.turmaId,
      disciplinaId: this.disciplinaId,
      bimestreId: this.bimestreId,
      descricao: this.descricao,
      media: this.media,
      status: this.status,
      observacaoRevisao: this.observacaoRevisao,
      tags: this.tags,
      enviadoEm: this.enviadoEm,
      publicadoEm: this.publicadoEm,
      atualizadoEm: this.atualizadoEm
    };
  }
}

module.exports = Acompanhamento;
