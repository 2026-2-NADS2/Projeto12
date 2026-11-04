const express = require('express');
const { verificarToken, somentePerfis } = require('../middlewares/autenticacao');
const { validarId } = require('../middlewares/validacao');

const TURNOS_VALIDOS = ['manha', 'tarde', 'integral'];

// Lê e valida o corpo da requisição.
// Devolve { erro } se algo estiver errado, ou { dados } já normalizados.
function lerTurma(body) {
  const { anoSerie, turno, anoLetivo } = body;
  const identificacao = body.identificacao?.trim().toUpperCase();

  if (!Number.isInteger(anoSerie) || anoSerie < 1 || anoSerie > 9) {
    return { erro: 'anoSerie deve ser um número inteiro de 1 a 9.' };
  }
  if (!identificacao || identificacao.length > 10) {
    return { erro: 'identificacao é obrigatória e deve ter até 10 caracteres.' };
  }
  if (!TURNOS_VALIDOS.includes(turno)) {
    return { erro: 'turno inválido. Use: manha, tarde ou integral.' };
  }
  if (!Number.isInteger(anoLetivo) || anoLetivo < 2000 || anoLetivo > 2100) {
    return { erro: 'anoLetivo deve ser um ano válido (ex.: 2026).' };
  }

  return { dados: { anoSerie, identificacao, turno, anoLetivo } };
}

function criarRotasTurmas(turmaRepository) {
  const router = express.Router();

  router.use(verificarToken, somentePerfis('administrador'));
  router.param('id', validarId);

  router.post('/', async (req, res) => {
    const { erro, dados } = lerTurma(req.body);
    if (erro) {
      return res.status(400).json({ erro });
    }

    try {
      const turma = await turmaRepository.criar(dados);
      res.status(201).json(turma.paraJSON());
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ erro: 'Já existe essa turma nesse ano letivo.' });
      }
      console.error(e);
      res.status(500).json({ erro: 'Erro ao criar turma.' });
    }
  });

  router.get('/', async (req, res) => {
    const { anoLetivo } = req.query;

    if (anoLetivo !== undefined && !/^\d{4}$/.test(anoLetivo)) {
      return res.status(400).json({ erro: 'anoLetivo deve ter 4 dígitos (ex.: 2026).' });
    }

    try {
      const turmas = await turmaRepository.listarTodos(anoLetivo ? Number(anoLetivo) : null);
      res.json(turmas.map((t) => t.paraJSON()));
    } catch (e) {
      console.error(e);
      res.status(500).json({ erro: 'Erro ao listar turmas.' });
    }
  });

  router.put('/:id', async (req, res) => {
    const { erro, dados } = lerTurma(req.body);
    if (erro) {
      return res.status(400).json({ erro });
    }

    try {
      const atualizou = await turmaRepository.atualizar(req.params.id, dados);
      if (!atualizou) {
        return res.status(404).json({ erro: 'Turma não encontrada.' });
      }
      const turma = await turmaRepository.buscarPorId(req.params.id);
      res.json(turma.paraJSON());
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ erro: 'Já existe essa turma nesse ano letivo.' });
      }
      console.error(e);
      res.status(500).json({ erro: 'Erro ao atualizar turma.' });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      await turmaRepository.inativar(req.params.id);
      res.status(204).send();
    } catch (e) {
      console.error(e);
      res.status(500).json({ erro: 'Erro ao inativar turma.' });
    }
  });

  return router;
}

module.exports = criarRotasTurmas;