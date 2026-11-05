const express = require('express');
const { verificarToken, somentePerfis } = require('../middlewares/autenticacao');
const { validarId } = require('../middlewares/validacao');
const { responderErro } = require('./auxiliares');

// Lê ano letivo e bimestre (vindos da URL ou do corpo)
function lerPeriodo({ anoLetivo, bimestre }) {
  const ano = String(anoLetivo ?? '');
  const numero = String(bimestre ?? '');
  if (!/^\d{4}$/.test(ano) || !/^[1-4]$/.test(numero)) {
    return { erro: 'Informe o ano letivo (4 dígitos) e o bimestre (1 a 4).' };
  }
  return { periodo: { anoLetivo: Number(ano), bimestre: Number(numero) } };
}

function criarRotasAreaResponsavel(areaResponsavelService) {
  const router = express.Router();

  router.use(verificarToken, somentePerfis('responsavel'));
  router.param('alunoId', validarId);

  // Meus alunos
  router.get('/alunos', async (req, res) => {
    try {
      res.json(await areaResponsavelService.listarMeusAlunos(req.usuarioLogado.id));
    } catch (e) {
      responderErro(res, e, 'Erro ao listar seus alunos.');
    }
  });

  // Relatório publicado do aluno: ?anoLetivo=2026&bimestre=4
  router.get('/alunos/:alunoId/relatorio', async (req, res) => {
    const { erro, periodo } = lerPeriodo(req.query);
    if (erro) {
      return res.status(400).json({ erro });
    }
    try {
      res.json(await areaResponsavelService.relatorio(
        req.usuarioLogado.id, Number(req.params.alunoId), periodo.anoLetivo, periodo.bimestre
      ));
    } catch (e) {
      responderErro(res, e, 'Erro ao carregar o relatório.');
    }
  });

  // Mesmo relatório, em PDF
  router.get('/alunos/:alunoId/relatorio/pdf', async (req, res) => {
    const { erro, periodo } = lerPeriodo(req.query);
    if (erro) {
      return res.status(400).json({ erro });
    }
    try {
      const { pdf, nomeArquivo } = await areaResponsavelService.relatorioPdf(
        req.usuarioLogado.id, Number(req.params.alunoId), periodo.anoLetivo, periodo.bimestre
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
      res.send(pdf);
    } catch (e) {
      responderErro(res, e, 'Erro ao gerar o PDF.');
    }
  });

  // Registrar ciência (com retorno opcional para a escola)
  router.post('/alunos/:alunoId/ciencia', async (req, res) => {
    const { erro, periodo } = lerPeriodo(req.body);
    if (erro) {
      return res.status(400).json({ erro });
    }
    const retorno = typeof req.body.retorno === 'string' ? req.body.retorno.trim() || null : null;
    if (retorno && retorno.length > 1000) {
      return res.status(400).json({ erro: 'O retorno deve ter até 1000 caracteres.' });
    }
    try {
      res.status(201).json(await areaResponsavelService.registrarCiencia(
        req.usuarioLogado.id, Number(req.params.alunoId), periodo.anoLetivo, periodo.bimestre, retorno
      ));
    } catch (e) {
      responderErro(res, e, 'Erro ao registrar a ciência.');
    }
  });

  return router;
}

module.exports = criarRotasAreaResponsavel;