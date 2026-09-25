const express = require('express');

function criarRotasUsuarios(usuarioRepository) {
  const router = express.Router();

  router.post('/', async (req, res) => {
    const { nome, email, senha, perfil } = req.body;

    if (!nome || !email || !senha || !perfil) {
      return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
    }

    try {
      const usuario = await usuarioRepository.criar({ nome, email, senha, perfil });
      res.status(201).json(usuario.paraJSON());
    } catch (erro) {
      if (erro.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ erro: 'Já existe um usuário com esse e-mail.' });
      }
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao criar usuário.' });
    }
  });

  router.get('/', async (req, res) => {
    try {
      const usuarios = await usuarioRepository.listarTodos();
      res.json(usuarios.map((usuario) => usuario.paraJSON()));
    } catch (erro) {
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao listar usuários.' });
    }
  });

  return router;
}

module.exports = criarRotasUsuarios;