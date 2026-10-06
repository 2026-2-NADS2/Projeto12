const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ erro: 'Token não fornecido.' });
  }

  const partes = authHeader.split(' ');

  if (partes.length !== 2 || partes[0] !== 'Bearer') {
    return res.status(401).json({ erro: 'Formato de token inválido.' });
  }

  const token = partes[1];

  jwt.verify(token, process.env.JWT_SECRET, (erro, payload) => {
    if (erro) {
      return res.status(401).json({ erro: 'Token inválido ou expirado.' });
    }

    req.usuarioLogado = payload;
    next();
  });
}

function somentePerfis(...perfisPermitidos) {
  return (req, res, next) => {
    if (!req.usuarioLogado || !perfisPermitidos.includes(req.usuarioLogado.perfil)) {
      return res.status(403).json({ erro: 'Você não tem permissão para acessar este recurso.' });
    }
    next();
  };
}

module.exports = { verificarToken, somentePerfis };