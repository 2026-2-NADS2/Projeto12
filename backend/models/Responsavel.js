class Responsavel {
  constructor({ id = null, usuarioId, nome, email, telefone = null, ativo = true, criadoEm = null }) {
    this.id = id;
    this.usuarioId = usuarioId;
    this.nome = nome;
    this.email = email;
    this.telefone = telefone;
    this.ativo = ativo;
    this.criadoEm = criadoEm;
  }

  paraJSON() {
    return {
      id: this.id,
      nome: this.nome,
      email: this.email,
      telefone: this.telefone,
      ativo: this.ativo,
      criadoEm: this.criadoEm
    };
  }
}

module.exports = Responsavel;