class Professor {
    constructor({ id = null, usuarioId, nome, email, registroFuncional, ativo = true, criadoEm = null }) {
      this.id = id;
      this.usuarioId = usuarioId;
      this.nome = nome;
      this.email = email;
      this.registroFuncional = registroFuncional;
      this.ativo = ativo;
      this.criadoEm = criadoEm;
    }
  
    paraJSON() {
      return {
        id: this.id,
        nome: this.nome,
        email: this.email,
        registroFuncional: this.registroFuncional,
        ativo: this.ativo,
        criadoEm: this.criadoEm
      };
    }
  }
  
  module.exports = Professor;