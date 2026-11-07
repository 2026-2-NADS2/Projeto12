const crypto = require('crypto');
const bcrypt = require('bcrypt');
const ErroDeNegocio = require('../errors/ErroDeNegocio');

const VALIDADE_MINUTOS = 30;

// O token vai no link; no banco, só o hash dele
function hashDoToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Recuperação e troca de senha (RF01)
class SenhaService {
  #usuarioRepository;
  #recuperacaoRepository;
  #notificador;
  #urlFrontend;

  constructor({ usuarioRepository, recuperacaoRepository, notificador, urlFrontend }) {
    this.#usuarioRepository = usuarioRepository;
    this.#recuperacaoRepository = recuperacaoRepository;
    this.#notificador = notificador;
    this.#urlFrontend = urlFrontend;
  }

  // Devolve a mensagem de erro, ou null se a senha for aceitável
  static validarForca(senha) {
    if (typeof senha !== 'string' || senha.length < 8 || senha.length > 72
        || !/[A-Za-z]/.test(senha) || !/\d/.test(senha)) {
      return 'A senha deve ter de 8 a 72 caracteres, com pelo menos uma letra e um número.';
    }
    return null;
  }

  // Não informa se o e-mail existe: quem chama responde sempre a mesma mensagem
  async solicitarRecuperacao(email) {
    const usuario = await this.#usuarioRepository.buscarPorEmail(email);
    if (!usuario || !usuario.ativo) {
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    await this.#recuperacaoRepository.criar(usuario.id, hashDoToken(token), VALIDADE_MINUTOS);

    await this.#notificador.enviarRecuperacaoSenha({
      para: usuario.email,
      nome: usuario.nome,
      link: `${this.#urlFrontend}/redefinir-senha?token=${token}`,
      validadeMinutos: VALIDADE_MINUTOS
    });
  }

  async redefinir(token, novaSenha) {
    const erroSenha = SenhaService.validarForca(novaSenha);
    if (erroSenha) {
      throw new ErroDeNegocio(400, erroSenha);
    }
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
      throw new ErroDeNegocio(400, 'Link inválido ou expirado. Solicite uma nova recuperação.');
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);
    const trocou = await this.#recuperacaoRepository.redefinirSenha(hashDoToken(token), senhaHash);
    if (!trocou) {
      throw new ErroDeNegocio(400, 'Link inválido ou expirado. Solicite uma nova recuperação.');
    }
  }

  async alterar(usuarioId, senhaAtual, novaSenha) {
    const usuario = await this.#usuarioRepository.buscarPorId(usuarioId);
    if (!usuario || !usuario.ativo) {
      throw new ErroDeNegocio(401, 'Sessão inválida. Entre novamente.');
    }
    if (typeof senhaAtual !== 'string' || !(await usuario.compararSenha(senhaAtual))) {
      throw new ErroDeNegocio(400, 'A senha atual está incorreta.');
    }

    const erroSenha = SenhaService.validarForca(novaSenha);
    if (erroSenha) {
      throw new ErroDeNegocio(400, erroSenha);
    }
    if (novaSenha === senhaAtual) {
      throw new ErroDeNegocio(400, 'A nova senha deve ser diferente da atual.');
    }

    await this.#usuarioRepository.atualizarSenha(usuarioId, await bcrypt.hash(novaSenha, 10));
  }
}

module.exports = SenhaService;