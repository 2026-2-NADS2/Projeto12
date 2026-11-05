const express = require('express');
const { verificarToken, somentePerfis } = require('../middlewares/autenticacao');
const { validarId } = require('../middlewares/validacao');
const { responderErro, lerLancamento } = require('./auxiliares');

function criarRotasAreaProfessor(acompanhamentoService) {
  const router = express.Router();

  router.use(verificarToken, somentePerfis('professor'));
  for (const nome of ['id', 'turmaId', 'disciplinaId', 'alunoId']) {
    router.param(nome, validarId);
  }
  router.param('numero', (req, res, next, valor) => {
    if (!/^[1-4]$/.test(valor)) {
      return res.status(400).json({ erro: 'O bimestre deve ser de 1 a 4.' });
    }
    next();
  });

  // Minhas turmas e disciplinas
  router.get('/turmas', async (req, res) => {
    try {
      res.json(await acompanhamentoService.listarMinhasTurmas(req.usuarioLogado.id));
    } catch (e) {
      responderErro(res, e, 'Erro ao listar suas turmas.');
    }
  });

  const PAINEL = '/turmas/:turmaId/disciplinas/:disciplinaId/bimestres/:numero';

  // Painel de lançamento: alunos da turma com seus acompanhamentos
  router.get(PAINEL, async (req, res) => {
    const { turmaId, disciplinaId, numero } = req.params;
    try {
      res.json(await acompanhamentoService.painel(req.usuarioLogado.id, Number(turmaId), Number(disciplinaId), Number(numero)));
    } catch (e) {
      responderErro(res, e, 'Erro ao carregar o painel.');
    }
  });

  // Salvar (criar ou atualizar) o rascunho de um aluno
  router.put(`${PAINEL}/alunos/:alunoId`, async (req, res) => {
    const { erro, dados } = lerLancamento(req.body);
    if (erro) {
      return res.status(400).json({ erro });
    }

    const { turmaId, disciplinaId, numero, alunoId } = req.params;
    try {
      const acompanhamento = await acompanhamentoService.salvarRascunho(req.usuarioLogado.id, {
        turmaId: Number(turmaId),
        disciplinaId: Number(disciplinaId),
        numeroBimestre: Number(numero),
        alunoId: Number(alunoId),
        ...dados
      });
      res.json(acompanhamento.paraJSON());
    } catch (e) {
      responderErro(res, e, 'Erro ao salvar o acompanhamento.');
    }
  });

  // Enviar para revisão do administrador
  router.post('/acompanhamentos/:id/enviar', async (req, res) => {
    try {
      const acompanhamento = await acompanhamentoService.enviar(req.usuarioLogado.id, Number(req.params.id));
      res.json(acompanhamento.paraJSON());
    } catch (e) {
      responderErro(res, e, 'Erro ao enviar o acompanhamento.');
    }
  });

  return router;
}

module.exports = criarRotasAreaProfessor;