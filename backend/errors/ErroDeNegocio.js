// Erro "esperado": uma regra de negócio foi violada (ex.: bimestre fechado).
// Carrega o código HTTP que a rota deve responder.
class ErroDeNegocio extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.name = 'ErroDeNegocio';
    this.status = status;
  }
}

module.exports = ErroDeNegocio;