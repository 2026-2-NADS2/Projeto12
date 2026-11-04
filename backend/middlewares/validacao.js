// Confere se um parâmetro da URL (como :id) é um número inteiro positivo.
// Usado com router.param(), que o Express chama antes de qualquer rota com esse parâmetro.
function validarId(req, res, next, valor) {
  if (!/^[1-9]\d*$/.test(valor)) {
    return res.status(400).json({ erro: 'Identificador inválido. Use um número inteiro positivo.' });
  }
  next();
}

module.exports = { validarId };