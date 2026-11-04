const express = require('express');
const { verificarToken, somentePerfis } = require('../middlewares/autenticacao');
const { validarId } = require('../middlewares/validacao');

function criarRotasDisciplinas(disciplinaRepository, areaRepository) {
  const router = express.Router();

  router.use(verificarToken, somentePerfis('administrador'));
  router.param('id', validarId);

  // Confere os dados enviados; devolve uma mensagem de erro ou null se estiver tudo certo
  function validarCorpo(nome, areaId) {
    if (!nome) return 'O nome da disciplina é obrigatório.';
    if (!Number.isInteger(areaId) || areaId <= 0) return 'areaId deve ser um número inteiro positivo.';
    return null;
  }

  router.post('/', async (req, res) => {
    const nome = req.body.nome?.trim();
    const { areaId } = req.body;

    const erroValidacao = validarCorpo(nome, areaId);
    if (erroValidacao) {
      return res.status(400).json({ erro: erroValidacao });
    }

    try {
      const area = await areaRepository.buscarPorId(areaId);
      if (!area) {
        return res.status(404).json({ erro: 'Área não encontrada ou inativa.' });
      }

      const disciplina = await disciplinaRepository.criar({ nome, areaId });
      res.status(201).json(disciplina.paraJSON());
    } catch (erro) {
      if (erro.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ erro: 'Já existe uma disciplina com esse nome.' });
      }
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao criar disciplina.' });
    }
  });

  router.get('/', async (req, res) => {
    try {
      const disciplinas = await disciplinaRepository.listarTodos();
      res.json(disciplinas.map((d) => d.paraJSON()));
    } catch (erro) {
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao listar disciplinas.' });
    }
  });

  router.put('/:id', async (req, res) => {
    const nome = req.body.nome?.trim();
    const { areaId } = req.body;

    const erroValidacao = validarCorpo(nome, areaId);
    if (erroValidacao) {
      return res.status(400).json({ erro: erroValidacao });
    }

    try {
      const area = await areaRepository.buscarPorId(areaId);
      if (!area) {
        return res.status(404).json({ erro: 'Área não encontrada ou inativa.' });
      }

      const atualizou = await disciplinaRepository.atualizar(req.params.id, { nome, areaId });
      if (!atualizou) {
        return res.status(404).json({ erro: 'Disciplina não encontrada.' });
      }

      const disciplina = await disciplinaRepository.buscarPorId(req.params.id);
      res.json(disciplina.paraJSON());
    } catch (erro) {
      if (erro.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ erro: 'Já existe uma disciplina com esse nome.' });
      }
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao atualizar disciplina.' });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      await disciplinaRepository.inativar(req.params.id);
      res.status(204).send();
    } catch (erro) {
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao inativar disciplina.' });
    }
  });

  return router;
}

module.exports = criarRotasDisciplinas;