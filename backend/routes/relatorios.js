const express = require('express');
const { verificarToken, somentePerfis } = require('../middlewares/autenticacao');
const { responderErro } = require('./auxiliares');
const RelatorioRepository = require('../repositories/RelatorioRepository');

const STATUS_FILTRO = ['rascunho', 'enviado', 'devolvido', 'publicado', 'todos'];

// Filtros comuns: anoLetivo obrigatório; bimestre, turmaId, disciplinaId e status opcionais
function lerFiltros(query) {
  if (!/^\d{4}$/.test(query.anoLetivo ?? '')) {
    return { erro: 'Informe o ano letivo com 4 dígitos (ex.: ?anoLetivo=2026).' };
  }
  const filtros = { anoLetivo: Number(query.anoLetivo), status: query.status ?? 'publicado' };

  if (!STATUS_FILTRO.includes(filtros.status)) {
    return { erro: 'Status inválido. Use: rascunho, enviado, devolvido, publicado ou todos.' };
  }

  const opcionais = { bimestre: /^[1-4]$/, turmaId: /^[1-9]\d*$/, disciplinaId: /^[1-9]\d*$/ };
  for (const [nome, formato] of Object.entries(opcionais)) {
    if (query[nome] === undefined) continue;
    if (!formato.test(query[nome])) {
      return { erro: `Filtro "${nome}" inválido.` };
    }
    filtros[nome] = Number(query[nome]);
  }
  return { filtros };
}

function criarRotasRelatorios(relatorioRepository, exportadorPlanilha) {
  const router = express.Router();

  router.use(verificarToken, somentePerfis('administrador'));

  // Lê os filtros uma vez para todas as rotas deste arquivo
  router.use((req, res, next) => {
    const { erro, filtros } = lerFiltros(req.query);
    if (erro) {
      return res.status(400).json({ erro });
    }
    req.filtros = filtros;
    next();
  });

  router.get('/medias', async (req, res) => {
    const { agrupar } = req.query;
    const validos = RelatorioRepository.agrupamentosValidos();
    if (!validos.includes(agrupar)) {
      return res.status(400).json({ erro: `Informe ?agrupar= com um destes: ${validos.join(', ')}.` });
    }
    try {
      res.json(await relatorioRepository.mediasPorGrupo(agrupar, req.filtros));
    } catch (e) {
      responderErro(res, e, 'Erro ao gerar o relatório de médias.');
    }
  });

  router.get('/tags', async (req, res) => {
    try {
      res.json(await relatorioRepository.contagemPorTag(req.filtros));
    } catch (e) {
      responderErro(res, e, 'Erro ao gerar o relatório de tags.');
    }
  });

  router.get('/status', async (req, res) => {
    try {
      res.json(await relatorioRepository.contagemPorStatus(req.filtros));
    } catch (e) {
      responderErro(res, e, 'Erro ao contar os status.');
    }
  });

  router.get('/retornos', async (req, res) => {
    try {
      res.json(await relatorioRepository.listarRetornos(req.filtros));
    } catch (e) {
      responderErro(res, e, 'Erro ao listar os retornos.');
    }
  });

  // Exportação: ?formato=xlsx (padrão) ou ?formato=csv
  router.get('/exportar', async (req, res) => {
    const formato = req.query.formato ?? 'xlsx';
    if (!['xlsx', 'csv'].includes(formato)) {
      return res.status(400).json({ erro: 'Formato inválido. Use xlsx ou csv.' });
    }
    try {
      const linhas = await relatorioRepository.listarParaExportacao(req.filtros);
      const nome = `acompanhamentos-${req.filtros.anoLetivo}.${formato}`;

      if (formato === 'xlsx') {
        const arquivo = await exportadorPlanilha.xlsx(linhas);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
        return res.send(Buffer.from(arquivo));
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
      res.send(exportadorPlanilha.csv(linhas));
    } catch (e) {
      responderErro(res, e, 'Erro ao exportar os dados.');
    }
  });

  return router;
}

module.exports = criarRotasRelatorios;