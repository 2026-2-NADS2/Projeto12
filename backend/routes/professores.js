const express = require('express');
const { verificarToken, somentePerfis } = require('../middlewares/autenticacao');

function criarRotasProfessores(professorRepository) {
  const router = express.Router();

  router.use(verificarToken, somentePerfis('administrador'));

  router.post('/', async (req, res) => {
    const { nome, email, senha, registroFuncional } = req.body;

    if (!nome || !email || !senha || !registroFuncional) {
      return res.status(400).json({ erro: 'Nome, e-mail, senha e registro funcional são obrigatórios.' });
    }

    try {
      const professor = await professorRepository.criar({ nome, email, senha, registroFuncional });
      res.status(201).json(professor.paraJSON());
    } catch (erro) {
      if (erro.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ erro: 'Já existe um professor com esse e-mail ou registro funcional.' });
      }
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao criar professor.' });
    }
  });

  router.get('/', async (req, res) => {
    try {
      const professores = await professorRepository.listarTodos();
      res.json(professores.map((p) => p.paraJSON()));
    } catch (erro) {
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao listar professores.' });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      await professorRepository.inativar(req.params.id);
      res.status(204).send();
    } catch (erro) {
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao inativar professor.' });
    }
  });

  return router;
}

module.exports = criarRotasProfessores;