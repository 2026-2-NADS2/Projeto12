import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexto/AuthContext';
import { INICIO_DO_PERFIL } from '../perfis';

// Só deixa passar quem está logado E tem o perfil exigido
export default function RotaProtegida({ perfil }) {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return <div className="tela-cheia"><p className="texto-suave">Carregando…</p></div>;
  }
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  if (usuario.perfil !== perfil) {
    return <Navigate to={INICIO_DO_PERFIL[usuario.perfil]} replace />;
  }
  return <Outlet />;
}