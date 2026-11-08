const express = require('express');
const { verificarToken, somentePerfis } = require('../middlewares/autenticacao');

// Aceita "2026-02-02T07:00" (data e hora locais, sem fuso)
const FORMATO_DATA_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function lerDataHora(texto) {
  if (typeof texto !== 'string' || !FORMATO_DATA_HORA.test(texto)) return null;
  const data = new Date(texto);
  return isNaN(data.getTime()) ? null : data;
}

function criarRotasBimestres(bimestreRepository) {
  const router = express.Router();

  // Todos precisam estar logados...
  router.use(verificarToken);

  // ...mas consultar é permitido a administrador e professor
  // ...mas consultar é permitido a administrador, professor e responsável (as datas aparecem para todos)
  // ...mas consultar é permitido a administrador, professor e responsável (as datas aparecem para todos)
  router.get('/', somentePerfis('administrador', 'professor', 'responsavel'), async (req, res) => {
        const { anoLetivo } = req.query;

    if (!/^\d{4}$/.test(anoLetivo ?? '')) {
      return res.status(400).json({ erro: 'Informe o ano letivo com 4 dígitos (ex.: ?anoLetivo=2026).' });
    }

    try {
      const bimestres = await bimestreRepository.listarPorAno(Number(anoLetivo));
      res.json(bimestres.map((b) => b.paraJSON()));
    } catch (e) {
      console.error(e);
      res.status(500).json({ erro: 'Erro ao listar bimestres.' });
    }
  });

  // ...e definir o período é só do administrador
  router.put('/:anoLetivo/:numero', somentePerfis('administrador'), async (req, res) => {
    const { anoLetivo, numero } = req.params;

    if (!/^\d{4}$/.test(anoLetivo)) {
      return res.status(400).json({ erro: 'Ano letivo deve ter 4 dígitos.' });
    }
    if (!/^[1-4]$/.test(numero)) {
      return res.status(400).json({ erro: 'O número do bimestre deve ser de 1 a 4.' });
    }

    const abertura = lerDataHora(req.body.abertura);
    const encerramento = lerDataHora(req.body.encerramento);

    if (!abertura || !encerramento) {
      return res.status(400).json({ erro: 'Informe abertura e encerramento no formato AAAA-MM-DDTHH:MM (ex.: 2026-02-02T07:00).' });
    }
    if (encerramento <= abertura) {
      return res.status(400).json({ erro: 'O encerramento deve ser depois da abertura.' });
    }

    try {
      const dados = { anoLetivo: Number(anoLetivo), numero: Number(numero), abertura, encerramento };

      const conflito = await bimestreRepository.buscarSobreposicao(dados.anoLetivo, dados.numero, abertura, encerramento);
      if (conflito) {
        return res.status(409).json({ erro: `O período se sobrepõe ao ${conflito}º bimestre de ${anoLetivo}.` });
      }

      const bimestre = await bimestreRepository.definir(dados);
      res.json(bimestre.paraJSON());
    } catch (e) {
      console.error(e);
      res.status(500).json({ erro: 'Erro ao definir bimestre.' });
    }
  });

  return router;
}

module.exports = criarRotasBimestres;