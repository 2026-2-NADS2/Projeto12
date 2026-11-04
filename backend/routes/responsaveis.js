const express = require('express');
const { verificarToken, somentePerfis } = require('../middlewares/autenticacao');

function criarRotasResponsaveis(responsavelRepository) {
  const router = express.Router();

  router.use(verificarToken, somentePerfis('administrador'));

  router.post('/', async (req, res) => {
    const { nome, email, senha } = req.body;
    let { telefone } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });
    }

    // Telefone é opcional. Se vier, guardamos só os dígitos e conferimos o tamanho.
    if (telefone) {
      telefone = String(telefone).replace(/\D/g, '');
      if (telefone.length < 10 || telefone.length > 11) {
        return res.status(400).json({ erro: 'Telefone inválido. Informe DDD + número (10 ou 11 dígitos).' });
      }
    } else {
      telefone = null;
    }

    try {
      const responsavel = await responsavelRepository.criar({ nome, email, senha, telefone });
      res.status(201).json(responsavel.paraJSON());
    } catch (erro) {
      if (erro.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ erro: 'Já existe um usuário com esse e-mail.' });
      }
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao criar responsável.' });
    }
  });

  router.get('/', async (req, res) => {
    try {
      const responsaveis = await responsavelRepository.listarTodos();
      res.json(responsaveis.map((r) => r.paraJSON()));
    } catch (erro) {
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao listar responsáveis.' });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      await responsavelRepository.inativar(req.params.id);
      res.status(204).send();
    } catch (erro) {
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao inativar responsável.' });
    }
  });

  return router;
}

module.exports = criarRotasResponsaveis;