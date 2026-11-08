import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, tokenSalvo, definirAoExpirarSessao } from '../servicos/api';

const AuthContext = createContext(null);

// Guarda quem está logado e oferece entrar() e sair() para qualquer tela
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  // Se há um token salvo, começa "carregando" até confirmar com a API que ele ainda vale
  const [carregando, setCarregando] = useState(() => Boolean(tokenSalvo.ler()));

  const sair = useCallback(() => {
    tokenSalvo.apagar();
    setUsuario(null);
  }, []);

  useEffect(() => {
    definirAoExpirarSessao(sair);
    if (!tokenSalvo.ler()) return;

    api('/auth/me')
      .then(setUsuario)
      .catch(() => tokenSalvo.apagar())
      .finally(() => setCarregando(false));
  }, [sair]);

  async function entrar(email, senha) {
    const { token, usuario: dados } = await api('/auth/login', { metodo: 'POST', corpo: { email, senha } });
    tokenSalvo.gravar(token);
    setUsuario(dados);
    return dados;
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}