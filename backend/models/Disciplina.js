class Disciplina {
  constructor({ id = null, nome, areaId, areaNome = null, ativo = true, criadoEm = null }) {
    this.id = id;
    this.nome = nome;
    this.areaId = areaId;
    this.areaNome = areaNome;
    this.ativo = ativo;
    this.criadoEm = criadoEm;
  }

  paraJSON() {
    return {
      id: this.id,
      nome: this.nome,
      area: { id: this.areaId, nome: this.areaNome },
      ativo: this.ativo,
      criadoEm: this.criadoEm
    };
  }
}

module.exports = Disciplina;