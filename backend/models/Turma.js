class Turma {
  constructor({ id = null, anoSerie, identificacao, turno, anoLetivo, ativo = true, criadoEm = null }) {
    this.id = id;
    this.anoSerie = anoSerie;
    this.identificacao = identificacao;
    this.turno = turno;
    this.anoLetivo = anoLetivo;
    this.ativo = ativo;
    this.criadoEm = criadoEm;
  }

  // Nome de exibição calculado a partir dos outros atributos (ex.: "5º ano A")
  get nome() {
    return `${this.anoSerie}º ano ${this.identificacao}`;
  }

  paraJSON() {
    return {
      id: this.id,
      nome: this.nome,
      anoSerie: this.anoSerie,
      identificacao: this.identificacao,
      turno: this.turno,
      anoLetivo: this.anoLetivo,
      ativo: this.ativo,
      criadoEm: this.criadoEm
    };
  }
}

module.exports = Turma;