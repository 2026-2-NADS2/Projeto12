const express = require('express');
const { verificarToken, somentePerfis } = require('../middlewares/autenticacao');
const { validarId } = require('../middlewares/validacao');

function criarRotasAlunos(alunoRepository) {
  const router = express.Router();

  router.use(verificarToken, somentePerfis('administrador'));
  router.param('id', validarId);

  router.post('/', async (req, res) => {
    const { nome, dataNascimento, matricula } = req.body;

    if (!nome || !dataNascimento || !matricula) {
      return res.status(400).json({ erro: 'Nome, data de nascimento e matrícula são obrigatórios.' });
    }

    try {
      const aluno = await alunoRepository.criar({ nome, dataNascimento, matricula });
      res.status(201).json(aluno.paraJSON());
    } catch (erro) {
      if (erro.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ erro: 'Já existe um aluno com essa matrícula.' });
      }
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao criar aluno.' });
    }
  });

  router.get('/', async (req, res) => {
    try {
      const alunos = await alunoRepository.listarTodos();
      res.json(alunos.map((aluno) => aluno.paraJSON()));
    } catch (erro) {
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao listar alunos.' });
    }
  });

  router.put('/:id', async (req, res) => {
    const nome = req.body.nome?.trim();
    const matricula = req.body.matricula?.trim();
    const { dataNascimento } = req.body;

    if (!nome || !matricula || !/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento ?? '')) {
      return res.status(400).json({ erro: 'Informe nome, matrícula e data de nascimento (AAAA-MM-DD).' });
    }

    try {
      const aluno = await alunoRepository.atualizar(req.params.id, { nome, dataNascimento, matricula });
      if (!aluno) {
        return res.status(404).json({ erro: 'Aluno não encontrado.' });
      }
      res.json(aluno.paraJSON());
    } catch (erro) {
      if (erro.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ erro: 'Já existe um aluno com essa matrícula.' });
      }
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao atualizar aluno.' });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      await alunoRepository.inativar(req.params.id);
      res.status(204).send();
    } catch (erro) {
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao inativar aluno.' });
    }
  });

  return router;
}

module.exports = criarRotasAlunos;