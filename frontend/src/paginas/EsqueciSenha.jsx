import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../servicos/api';
import CartaoAcesso from '../componentes/CartaoAcesso';

export default function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento) {
    evento.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      // A API responde igual exista ou não o e-mail (para não revelar quem tem conta)
      await api('/auth/recuperar-senha', { metodo: 'POST', corpo: { email: email.trim() } });
      setEnviado(true);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setEnviando(false);
    }
  }

  // Depois do envio, o cartão troca para a confirmação (segunda tela do Figma)
  if (enviado) {
    return (
      <CartaoAcesso titulo="E-mail enviado" centralizado
        subtitulo="Se este e-mail estiver cadastrado, enviamos um link de recuperação para ele.">
        <p className="pilula-email">{email.trim()}</p>
        <p className="texto-suave texto-centro">
          O link vale por 30 minutos. Qualquer dúvida, entre em contato com a secretaria da escola.
        </p>
        <div className="formulario">
          <Link to="/login" className="botao botao-primario">Voltar ao login</Link>
        </div>
      </CartaoAcesso>
    );
  }

  return (
    <CartaoAcesso titulo="Esqueci minha senha"
      subtitulo="Informe o seu e-mail. Enviaremos um link para você criar uma nova senha.">
      <form onSubmit={aoEnviar} className="formulario">
        <label className="campo">
          <span>E-mail</span>
          <input type="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
        </label>
        {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
        <button type="submit" className="botao botao-primario" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviar link'}
        </button>
        <Link to="/login" className="link-pequeno link-centro">Voltar ao login</Link>
      </form>
    </CartaoAcesso>
  );
}