const express = require('express');
const jwt = require('jsonwebtoken');
const { verificarToken } = require('../middlewares/autenticacao');
const { responderErro } = require('./auxiliares');

function criarRotasAuth({ usuarioRepository, senhaService }) {
  const router = express.Router();

  router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
    }

    try {
      const usuario = await usuarioRepository.buscarPorEmail(email);

      // Mensagem genérica de propósito (não revela quais e-mails existem)
      if (!usuario) {
        return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
      }

      const senhaCorreta = await usuario.compararSenha(senha);
      if (!senhaCorreta) {
        return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
      }

      if (!usuario.ativo) {
        return res.status(403).json({ erro: 'Esta conta está desativada. Procure a secretaria da escola.' });
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

  // Quem sou eu: o frontend usa ao recarregar a página para conferir se a sessão ainda vale
  router.get('/me', verificarToken, async (req, res) => {
    try {
      const usuario = await usuarioRepository.buscarPorId(req.usuarioLogado.id);
      if (!usuario || !usuario.ativo) {
        return res.status(401).json({ erro: 'Sessão inválida. Entre novamente.' });
      }
      res.json(usuario.paraJSON());
    } catch (e) {
      responderErro(res, e, 'Erro ao carregar o usuário.');
    }
  });

  // Esqueci minha senha: a resposta é sempre a mesma, exista o e-mail ou não
  router.post('/recuperar-senha', async (req, res) => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
    if (!email) {
      return res.status(400).json({ erro: 'Informe o e-mail.' });
    }
    try {
      await senhaService.solicitarRecuperacao(email);
      res.json({ mensagem: 'Se o e-mail estiver cadastrado, você receberá as instruções para criar uma nova senha.' });
    } catch (e) {
      responderErro(res, e, 'Erro ao solicitar a recuperação de senha.');
    }
  });

  // Nova senha a partir do link recebido por e-mail
  router.post('/redefinir-senha', async (req, res) => {
    try {
      await senhaService.redefinir(req.body.token, req.body.novaSenha);
      res.json({ mensagem: 'Senha alterada. Você já pode entrar com a nova senha.' });
    } catch (e) {
      responderErro(res, e, 'Erro ao redefinir a senha.');
    }
  });

  // Troca de senha de quem está logado
  router.post('/alterar-senha', verificarToken, async (req, res) => {
    try {
      await senhaService.alterar(req.usuarioLogado.id, req.body.senhaAtual, req.body.novaSenha);
      res.json({ mensagem: 'Senha alterada com sucesso.' });
    } catch (e) {
      responderErro(res, e, 'Erro ao alterar a senha.');
    }
  });

  return router;
}

module.exports = criarRotasAuth;