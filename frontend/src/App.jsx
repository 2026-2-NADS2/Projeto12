import { Navigate, Route, Routes } from 'react-router-dom';
import RotaProtegida from './componentes/RotaProtegida';
import Layout from './componentes/Layout';
import Login from './paginas/Login';
import EsqueciSenha from './paginas/EsqueciSenha';
import RedefinirSenha from './paginas/RedefinirSenha';
import EmConstrucao from './paginas/EmConstrucao';
import InicioAdmin from './paginas/admin/InicioAdmin';
import InicioProfessor from './paginas/professor/InicioProfessor';

export default function App() {
  return (
    <Routes>
      {/* Telas abertas (sem login) */}
      <Route path="/login" element={<Login />} />
      <Route path="/esqueci-senha" element={<EsqueciSenha />} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />

      {/* Módulo do administrador */}
      <Route element={<RotaProtegida perfil="administrador" />}>
        <Route path="/admin" element={<Layout />}>
          <Route index element={<InicioAdmin />} />
          <Route path="cadastros" element={<EmConstrucao titulo="Cadastros" />} />
          <Route path="bimestres" element={<EmConstrucao titulo="Bimestres" />} />
          <Route path="revisao" element={<EmConstrucao titulo="Fila de revisão" />} />
          <Route path="relatorios" element={<EmConstrucao titulo="Relatórios" />} />
        </Route>
      </Route>

      {/* Módulo do professor */}
      <Route element={<RotaProtegida perfil="professor" />}>
        <Route path="/professor" element={<Layout />}>
          <Route index element={<InicioProfessor />} />
          <Route path="turmas" element={<EmConstrucao titulo="Minhas turmas" />} />
          <Route path="turmas/:turmaId/disciplinas/:disciplinaId" element={<EmConstrucao titulo="Lançamentos" />} />
        </Route>
      </Route>

      {/* Módulo do responsável */}
      <Route element={<RotaProtegida perfil="responsavel" />}>
        <Route path="/responsavel" element={<Layout />}>
          <Route index element={<EmConstrucao titulo="Meus alunos" />} />
        </Route>
      </Route>

      {/* Qualquer outro endereço vai para o login (que redireciona quem já está logado) */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}