class Usuario {
    constructor({ id = null, nome, email, senhaHash = null, perfil, ativo = true, criadoEm = null }) {
      this.id = id;
      this.nome = nome;
      this.email = email;
      this.senhaHash = senhaHash;
      this.perfil = perfil;
      this.ativo = ativo;
      this.criadoEm = criadoEm;
    }
  
    ehAdministrador() {
      return this.perfil === 'administrador';
    }
  
    ehProfessor() {
      return this.perfil === 'professor';
    }
  
    ehResponsavel() {
      return this.perfil === 'responsavel';
    }
  
    paraJSON() {
      return {
        id: this.id,
        nome: this.nome,
        email: this.email,
        perfil: this.perfil,
        ativo: this.ativo,
        criadoEm: this.criadoEm
      };
    }
  }
  
  module.exports = Usuario;
  