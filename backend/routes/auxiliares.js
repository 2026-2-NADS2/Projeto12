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

// Formato básico de e-mail: algo@algo.algo, sem espaços
function emailValido(email) {
  return typeof email === 'string' && email.length <= 150 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Telefone opcional: guarda só os dígitos e confere o tamanho (DDD + número)
function normalizarTelefone(valor) {
  if (valor === undefined || valor === null || valor === '') {
    return { telefone: null };
  }
  const telefone = String(valor).replace(/\D/g, '');
  if (telefone.length < 10 || telefone.length > 11) {
    return { erro: 'Telefone inválido. Informe DDD + número (10 ou 11 dígitos).' };
  }
  return { telefone };
}

// Lê ?pagina= e ?porPagina= (padrão: página 1, 20 itens; máximo 100 por página)
function lerPaginacao(query) {
  const pagina = query.pagina === undefined ? 1 : Number(query.pagina);
  const porPagina = query.porPagina === undefined ? 20 : Number(query.porPagina);

  if (!Number.isInteger(pagina) || pagina < 1) {
    return { erro: 'pagina deve ser um número inteiro a partir de 1.' };
  }
  if (!Number.isInteger(porPagina) || porPagina < 1 || porPagina > 100) {
    return { erro: 'porPagina deve ser um número inteiro de 1 a 100.' };
  }

  return { paginacao: { pagina, porPagina, limite: porPagina, offset: (pagina - 1) * porPagina } };
}

// Monta a resposta padrão das listas paginadas
function montarPagina(itens, total, { pagina, porPagina }) {
  return { itens, pagina, porPagina, total, totalPaginas: Math.ceil(total / porPagina) };
}

// Termo de busca opcional (?busca=), sem espaços nas pontas e com tamanho limitado
function lerBusca(query) {
  const busca = typeof query.busca === 'string' ? query.busca.trim() : '';
  return busca ? busca.slice(0, 100) : null;
}

module.exports = { responderErro, lerLancamento, emailValido, normalizarTelefone, lerPaginacao, montarPagina, lerBusca };