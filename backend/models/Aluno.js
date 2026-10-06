class Aluno {
    constructor({ id = null, nome, dataNascimento, matricula, ativo = true, criadoEm = null }) {
      this.id = id;
      this.nome = nome;
      this.dataNascimento = dataNascimento;
      this.matricula = matricula;
      this.ativo = ativo;
      this.criadoEm = criadoEm;
    }
  
    paraJSON() {
      return {
        id: this.id,
        nome: this.nome,
        dataNascimento: this.dataNascimento,
        matricula: this.matricula,
        ativo: this.ativo,
        criadoEm: this.criadoEm
      };
    }
  }
  
  module.exports = Aluno;