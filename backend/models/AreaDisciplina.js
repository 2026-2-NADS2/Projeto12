class AreaDisciplina {
  constructor({ id = null, nome, ativo = true, criadoEm = null }) {
    this.id = id;
    this.nome = nome;
    this.ativo = ativo;
    this.criadoEm = criadoEm;
  }

  paraJSON() {
    return {
      id: this.id,
      nome: this.nome,
      ativo: this.ativo,
      criadoEm: this.criadoEm
    };
  }
}

module.exports = AreaDisciplina;