const express = require('express');

const { verificarToken, somentePerfis } = require('../middlewares/autenticacao');

// Perfis aceitos pelo banco (mesmos valores do ENUM da coluna usuarios.perfil)
const PERFIS_VALIDOS = ['administrador', 'professor', 'responsavel'];

function criarRotasUsuarios(usuarioRepository) {
  const router = express.Router();

    // Só administrador logado pode criar ou listar usuários.
  // O primeiro admin de um banco novo é criado pelo script scripts/criarAdmin.js.
  router.use(verificarToken, somentePerfis('administrador'));

  router.post('/', async (req, res) => {
    const { nome, email, senha, perfil } = req.body;

    if (!nome || !email || !senha || !perfil) {
      return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
    }   
    
    if (!PERFIS_VALIDOS.includes(perfil)) {
      return res.status(400).json({ erro: 'Perfil inválido. Use: administrador, professor ou responsavel.' });
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