class Tag {
  constructor({ id = null, nome, descricao = null, ativo = true, criadoEm = null }) {
    this.id = id;
    this.nome = nome;
    this.descricao = descricao;
    this.ativo = ativo;
    this.criadoEm = criadoEm;
  }

  paraJSON() {
    return {
      id: this.id,
      nome: this.nome,
      descricao: this.descricao,
      ativo: this.ativo,
      criadoEm: this.criadoEm
    };
  }
}

module.exports = Tag;
