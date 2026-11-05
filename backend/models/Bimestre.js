class Bimestre {
  constructor({ id = null, anoLetivo, numero, abertura, encerramento, atualizadoEm = null }) {
    this.id = id;
    this.anoLetivo = anoLetivo;
    this.numero = numero;
    this.abertura = abertura;         // objeto Date
    this.encerramento = encerramento; // objeto Date
    this.atualizadoEm = atualizadoEm;
  }

  // Diz se a digitação está liberada num certo momento (por padrão, agora).
  // O RF05 vai usar este método para autorizar o professor.
  estaAberto(momento = new Date()) {
    return momento >= this.abertura && momento <= this.encerramento;
  }

  get situacao() {
    const agora = new Date();
    if (agora < this.abertura) return 'aguardando';
    if (agora > this.encerramento) return 'encerrado';
    return 'aberto';
  }

  paraJSON() {
    return {
      id: this.id,
      anoLetivo: this.anoLetivo,
      numero: this.numero,
      nome: `${this.numero}º bimestre`,
      abertura: this.abertura,
      encerramento: this.encerramento,
      situacao: this.situacao,
      atualizadoEm: this.atualizadoEm
    };
  }
}

module.exports = Bimestre;