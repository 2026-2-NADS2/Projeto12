import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexto/AuthContext';
import { INICIO_DO_PERFIL } from '../perfis';
import CartaoAcesso from '../componentes/CartaoAcesso';

export default function Login() {
  const { usuario, entrar } = useAuth();
  const navegar = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Quem já está logado vai direto para a sua página inicial
  if (usuario) {
    return <Navigate to={INICIO_DO_PERFIL[usuario.perfil]} replace />;
  }

  async function aoEnviar(evento) {
    evento.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      const dados = await entrar(email.trim(), senha);
      navegar(INICIO_DO_PERFIL[dados.perfil], { replace: true });
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <CartaoAcesso titulo="Entrar" subtitulo="Use o e-mail e a senha fornecidos pela escola.">
      <form onSubmit={aoEnviar} className="formulario">
        <label className="campo">
          <span>E-mail</span>
          <input type="email" autoComplete="username" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="campo">
          <span>Senha</span>
          <input type="password" autoComplete="current-password" value={senha}
            onChange={(e) => setSenha(e.target.value)} required />
        </label>
        <Link to="/esqueci-senha" className="link-pequeno">Esqueci minha senha</Link>
        {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
        <button type="submit" className="botao botao-primario" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </CartaoAcesso>
  );
}