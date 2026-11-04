const express = require('express');
const { verificarToken, somentePerfis } = require('../middlewares/autenticacao');
const { validarId } = require('../middlewares/validacao');

function criarRotasResponsaveis(responsavelRepository) {
  const router = express.Router();

  router.use(verificarToken, somentePerfis('administrador'));
    router.param('id', validarId);
  router.param('alunoId', validarId);
  
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

    // ----- Vínculos responsável ↔ aluno -----

  router.post('/:id/alunos', async (req, res) => {
    const { alunoId, parentesco } = req.body;

    if (!alunoId || !parentesco) {
      return res.status(400).json({ erro: 'alunoId e parentesco são obrigatórios.' });
    }

    try {
      await responsavelRepository.vincularAluno(req.params.id, alunoId, parentesco);
      res.status(201).json({ mensagem: 'Aluno vinculado ao responsável.' });
    } catch (erro) {
      if (erro.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ erro: 'Esse aluno já está vinculado a esse responsável.' });
      }
      if (erro.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(404).json({ erro: 'Responsável ou aluno não encontrado.' });
      }
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao vincular aluno.' });
    }
  });

  router.get('/:id/alunos', async (req, res) => {
    try {
      const alunos = await responsavelRepository.listarAlunos(req.params.id);
      res.json(alunos);
    } catch (erro) {
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao listar alunos do responsável.' });
    }
  });

  router.delete('/:id/alunos/:alunoId', async (req, res) => {
    try {
      const removido = await responsavelRepository.desvincularAluno(req.params.id, req.params.alunoId);
      if (!removido) {
        return res.status(404).json({ erro: 'Vínculo não encontrado.' });
      }
      res.status(204).send();
    } catch (erro) {
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao desvincular aluno.' });
    }
  });

  return router;
}

module.exports = criarRotasResponsaveis;