const express = require('express');
const { verificarToken, somentePerfis } = require('../middlewares/autenticacao');
const { validarId } = require('../middlewares/validacao');

// Devolve { erro } ou { dados } normalizados
function lerTag(body) {
  const nome = body.nome?.trim();
  // Descrição é opcional: texto vazio ou ausente vira null
  const descricao = body.descricao?.trim() || null;

  if (!nome || nome.length > 50) {
    return { erro: 'O nome da tag é obrigatório e deve ter até 50 caracteres.' };
  }
  if (descricao && descricao.length > 255) {
    return { erro: 'A descrição deve ter até 255 caracteres.' };
  }

  return { dados: { nome, descricao } };
}

function criarRotasTags(tagRepository) {
  const router = express.Router();

  // O professor pode CONSULTAR as tags (para escolher no lançamento); só o administrador cria, edita e inativa
  router.use(verificarToken, (req, res, next) => {
    const perfis = req.method === 'GET' ? ['administrador', 'professor'] : ['administrador'];
    somentePerfis(...perfis)(req, res, next);
  });
  router.param('id', validarId);

  router.post('/', async (req, res) => {
    const { erro, dados } = lerTag(req.body);
    if (erro) {
      return res.status(400).json({ erro });
    }

    try {
      const tag = await tagRepository.criar(dados);
      res.status(201).json(tag.paraJSON());
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ erro: 'Já existe uma tag com esse nome.' });
      }
      console.error(e);
      res.status(500).json({ erro: 'Erro ao criar tag.' });
    }
  });

  router.get('/', async (req, res) => {
    try {
      const tags = await tagRepository.listarTodos();
      res.json(tags.map((t) => t.paraJSON()));
    } catch (e) {
      console.error(e);
      res.status(500).json({ erro: 'Erro ao listar tags.' });
    }
  });

  router.put('/:id', async (req, res) => {
    const { erro, dados } = lerTag(req.body);
    if (erro) {
      return res.status(400).json({ erro });
    }

    try {
      const atualizou = await tagRepository.atualizar(req.params.id, dados);
      if (!atualizou) {
        return res.status(404).json({ erro: 'Tag não encontrada.' });
      }
      const tag = await tagRepository.buscarPorId(req.params.id);
      res.json(tag.paraJSON());
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ erro: 'Já existe uma tag com esse nome.' });
      }
      console.error(e);
      res.status(500).json({ erro: 'Erro ao atualizar tag.' });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      await tagRepository.inativar(req.params.id);
      res.status(204).send();
    } catch (e) {
      console.error(e);
      res.status(500).json({ erro: 'Erro ao inativar tag.' });
    }
  });

  return router;
}

module.exports = criarRotasTags;