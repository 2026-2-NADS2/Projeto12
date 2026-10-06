const express = require('express');
const jwt = require('jsonwebtoken');

function criarRotasAuth(usuarioRepository) {
  const router = express.Router();

  router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
    }

    try {
      const usuario = await usuarioRepository.buscarPorEmail(email);

      if (!usuario) {
        return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
      }

      const senhaCorreta = await usuario.compararSenha(senha);

      if (!senhaCorreta) {
        return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
      }

      const token = jwt.sign(
        { id: usuario.id, perfil: usuario.perfil },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.json({ token, usuario: usuario.paraJSON() });
    } catch (erro) {
      console.error(erro);
      res.status(500).json({ erro: 'Erro ao realizar login.' });
    }
  });

  return router;
}

module.exports = criarRotasAuth;