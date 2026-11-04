const express = require('express');
const { verificarToken, somentePerfis } = require('../middlewares/autenticacao');

function criarRotasAreasDisciplina(areaRepository) {
  const router = express.Router();

  router.use(verificarToken, somentePerfis('administrador'));

  router.post('/', async (req, res) => {
    const nome = req.body.nome?.trim();

    if (!nome) {
      return res.status(400).json({ erro: 'O nome da área é obrigatório.' });
    }

    try {
      const area = await areaRepository.criar({ nome });
      res.status(201).json(area.paraJSON());
    } catch (erro) {
      if (erro.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ erro: 'Já existe uma área com esse nome.' });
      }
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao criar área.' });
    }
  });

  router.get('/', async (req, res) => {
    try {
      const areas = await areaRepository.listarTodos();
      res.json(areas.map((a) => a.paraJSON()));
    } catch (erro) {
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao listar áreas.' });
    }
  });

  router.put('/:id', async (req, res) => {
    const nome = req.body.nome?.trim();

    if (!nome) {
      return res.status(400).json({ erro: 'O nome da área é obrigatório.' });
    }

    try {
      const atualizou = await areaRepository.atualizar(req.params.id, { nome });
      if (!atualizou) {
        return res.status(404).json({ erro: 'Área não encontrada.' });
      }
      res.json({ id: Number(req.params.id), nome });
    } catch (erro) {
      if (erro.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ erro: 'Já existe uma área com esse nome.' });
      }
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao atualizar área.' });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      await areaRepository.inativar(req.params.id);
      res.status(204).send();
    } catch (erro) {
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao inativar área.' });
    }
  });

  return router;
}

module.exports = criarRotasAreasDisciplina;