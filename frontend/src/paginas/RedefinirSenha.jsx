import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../servicos/api';
import CartaoAcesso from '../componentes/CartaoAcesso';

export default function RedefinirSenha() {
  const [parametros] = useSearchParams();
  const token = parametros.get('token') ?? '';
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState('');
  const [concluido, setConcluido] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento) {
    evento.preventDefault();
    setErro('');
    if (novaSenha !== confirmacao) {
      setErro('As senhas digitadas não são iguais.');
      return;
    }
    setEnviando(true);
    try {
      await api('/auth/redefinir-senha', { metodo: 'POST', corpo: { token, novaSenha } });
      setConcluido(true);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setEnviando(false);
    }
  }

  // Link aberto sem o token (ex.: copiado pela metade)
  if (!token) {
    return (
      <CartaoAcesso titulo="Link inválido" centralizado
        subtitulo="Este link de recuperação está incompleto. Peça um novo para continuar.">
        <div className="formulario">
          <Link to="/esqueci-senha" className="botao botao-primario">Pedir um novo link</Link>
        </div>
      </CartaoAcesso>
    );
  }

  if (concluido) {
    return (
      <CartaoAcesso titulo="Senha alterada" centralizado subtitulo="Você já pode entrar com a nova senha.">
        <div className="formulario">
          <Link to="/login" className="botao botao-primario">Ir para o login</Link>
        </div>
      </CartaoAcesso>
    );
  }

  return (
    <CartaoAcesso titulo="Redefina sua senha!" centralizado>
      <form onSubmit={aoEnviar} className="formulario">
        <label className="campo">
          <span>Nova senha</span>
          <input type="password" autoComplete="new-password" value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)} required />
        </label>
        <label className="campo">
          <span>Confirme sua senha</span>
          <input type="password" autoComplete="new-password" value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)} required />
        </label>
        <ul className="regras-senha">
          <li>Mínimo de 8 e máximo de 72 caracteres.</li>
          <li>Pelo menos uma letra e um número.</li>
        </ul>
        {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
        <button type="submit" className="botao botao-primario" disabled={enviando}>
          {enviando ? 'Salvando…' : 'Salvar'}
        </button>
        <Link to="/esqueci-senha" className="link-pequeno link-centro">Pedir um novo link</Link>
      </form>
    </CartaoAcesso>
  );
}