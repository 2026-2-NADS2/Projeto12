const ErroDeNegocio = require('../errors/ErroDeNegocio');

// Erro de regra de negócio → responde com o status que ele carrega; qualquer outro → 500
function responderErro(res, e, mensagemPadrao) {
  if (e instanceof ErroDeNegocio) {
    return res.status(e.status).json({ erro: e.message });
  }
  console.error(e);
  return res.status(500).json({ erro: mensagemPadrao });
}

// Valida descrição, média (0 a 10, uma casa) e tags de um acompanhamento
function lerLancamento(body) {
  const descricao = typeof body.descricao === 'string' ? body.descricao.trim() : '';
  const { media } = body;
  const tagIds = body.tagIds ?? [];

  if (!descricao || descricao.length > 2000) {
    return { erro: 'A descrição é obrigatória e deve ter até 2000 caracteres.' };
  }

  const ehNumero = typeof media === 'number';
  const temNoMaximoUmaCasa = ehNumero && Math.abs(media * 10 - Math.round(media * 10)) < 1e-9;
  if (!ehNumero || media < 0 || media > 10 || !temNoMaximoUmaCasa) {
    return { erro: 'A média deve ser um número de 0 a 10, com no máximo uma casa decimal.' };
  }

  if (!Array.isArray(tagIds) || !tagIds.every((id) => Number.isInteger(id) && id > 0)) {
    return { erro: 'tagIds deve ser uma lista de ids de tags.' };
  }

  // new Set remove ids repetidos: [1, 3, 3] vira [1, 3]
  return { dados: { descricao, media, tagIds: [...new Set(tagIds)] } };
}

module.exports = { responderErro, lerLancamento };