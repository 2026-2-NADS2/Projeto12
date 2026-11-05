const express = require('express');
const { verificarToken, somentePerfis } = require('../middlewares/autenticacao');
const { validarId } = require('../middlewares/validacao');
const { responderErro, lerLancamento } = require('./auxiliares');

const STATUS_VALIDOS = ['rascunho', 'enviado', 'devolvido', 'publicado'];

// Filtros opcionais da fila: ?status=&anoLetivo=&bimestre=&turmaId=&disciplinaId=
function lerFiltros(query) {
  const status = query.status ?? 'enviado';
  if (!STATUS_VALIDOS.includes(status)) {
    return { erro: 'Status inválido. Use: rascunho, enviado, devolvido ou publicado.' };
  }

  const filtros = { status };
  const formatos = {
    anoLetivo: /^\d{4}$/,
    bimestre: /^[1-4]$/,
    turmaId: /^[1-9]\d*$/,
    disciplinaId: /^[1-9]\d*$/
  };

  for (const [nome, formato] of Object.entries(formatos)) {
    if (query[nome] === undefined) continue;
    if (!formato.test(query[nome])) {
      return { erro: `Filtro "${nome}" inválido.` };
    }
    filtros[nome] = Number(query[nome]);
  }
  return { filtros };
}

function criarRotasRevisao(revisaoService) {
  const router = express.Router();

  router.use(verificarToken, somentePerfis('administrador'));
  router.param('id', validarId);

  // Fila de revisão (por padrão, os enviados)
  router.get('/acompanhamentos', async (req, res) => {
    const { erro, filtros } = lerFiltros(req.query);
    if (erro) {
      return res.status(400).json({ erro });
    }
    try {
      res.json(await revisaoService.listarFila(filtros));
    } catch (e) {
      responderErro(res, e, 'Erro ao carregar a fila de revisão.');
    }
  });

  // Detalhe com histórico
  router.get('/acompanhamentos/:id', async (req, res) => {
    try {
      res.json(await revisaoService.detalhar(Number(req.params.id)));
    } catch (e) {
      responderErro(res, e, 'Erro ao carregar o acompanhamento.');
    }
  });

  // Alterar descrição, média e tags durante a revisão
  router.put('/acompanhamentos/:id', async (req, res) => {
    const { erro, dados } = lerLancamento(req.body);
    if (erro) {
      return res.status(400).json({ erro });
    }
    try {
      res.json(await revisaoService.alterar(req.usuarioLogado.id, Number(req.params.id), dados));
    } catch (e) {
      responderErro(res, e, 'Erro ao alterar o acompanhamento.');
    }
  });

  // Devolver ao professor (observação obrigatória)
  router.post('/acompanhamentos/:id/devolver', async (req, res) => {
    const observacao = typeof req.body.observacao === 'string' ? req.body.observacao.trim() : '';
    if (!observacao || observacao.length > 500) {
      return res.status(400).json({ erro: 'Informe a observação para o professor (até 500 caracteres).' });
    }
    try {
      res.json(await revisaoService.devolver(req.usuarioLogado.id, Number(req.params.id), observacao));
    } catch (e) {
      responderErro(res, e, 'Erro ao devolver o acompanhamento.');
    }
  });

  // Publicar ao responsável
  router.post('/acompanhamentos/:id/publicar', async (req, res) => {
    try {
      res.json(await revisaoService.publicar(req.usuarioLogado.id, Number(req.params.id)));
    } catch (e) {
      responderErro(res, e, 'Erro ao publicar o acompanhamento.');
    }
  });

  return router;
}

module.exports = criarRotasRevisao;