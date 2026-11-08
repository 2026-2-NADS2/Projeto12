import { NavLink, Outlet } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../contexto/AuthContext';
import { MENUS, NOME_DO_PERFIL } from '../perfis';

// Moldura das telas internas: barra lateral de ícones + cabeçalho + conteúdo
export default function Layout() {
  const { usuario, sair } = useAuth();
  const itens = MENUS[usuario.perfil];

  return (
    <div className="app">
      <aside className="barra-lateral">
        <div className="logo">KFKA</div>

        <nav className="menu" aria-label="Menu principal">
          {itens.map(({ rota, rotulo, icone: Icone, exato }) => (
            <NavLink key={rota} to={rota} end={exato} className="menu-item" title={rotulo}>
              <Icone size={22} strokeWidth={1.6} aria-hidden="true" />
              <span className="menu-rotulo">{rotulo}</span>
            </NavLink>
          ))}
        </nav>

        <button type="button" className="menu-item menu-sair" onClick={sair} title="Sair">
          <LogOut size={22} strokeWidth={1.6} aria-hidden="true" />
          <span className="menu-rotulo">Sair</span>
        </button>
      </aside>

      <div className="area-principal">
        <header className="cabecalho">
          <span className="cabecalho-titulo">KFKA – Plataforma de Acompanhamento Escolar</span>
          <div className="usuario">
            <div className="usuario-texto">
              <strong>{NOME_DO_PERFIL[usuario.perfil]}</strong>
              <small>{usuario.nome}</small>
            </div>
            <div className="avatar" aria-hidden="true">{usuario.nome.charAt(0)}</div>
          </div>
        </header>

        <main className="conteudo">
          <Outlet />
        </main>
      </div>
    </div>
  );
}