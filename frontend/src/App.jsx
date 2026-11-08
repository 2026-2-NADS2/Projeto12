import { Navigate, Route, Routes } from 'react-router-dom';
import RotaProtegida from './componentes/RotaProtegida';
import Layout from './componentes/Layout';
import Login from './paginas/Login';
import EsqueciSenha from './paginas/EsqueciSenha';
import RedefinirSenha from './paginas/RedefinirSenha';
import EmConstrucao from './paginas/EmConstrucao';
import InicioAdmin from './paginas/admin/InicioAdmin';
import FilaRevisao from './paginas/admin/FilaRevisao';
import RevisarAcompanhamento from './paginas/admin/RevisarAcompanhamento';
import RelatoriosAdmin from './paginas/admin/RelatoriosAdmin';
import Cadastros from './paginas/admin/Cadastros';
import BimestresAdmin from './paginas/admin/BimestresAdmin';
import InicioProfessor from './paginas/professor/InicioProfessor';
import MinhasTurmas from './paginas/professor/MinhasTurmas';
import Lancamentos from './paginas/professor/Lancamentos';
import FormularioLancamento from './paginas/professor/FormularioLancamento';
import InicioResponsavel from './paginas/responsavel/InicioResponsavel';
import RelatorioAluno from './paginas/responsavel/RelatorioAluno';


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
          <Route path="cadastros" element={<Cadastros />} />
          <Route path="turmas/:id" element={<EmConstrucao titulo="Detalhe da turma" />} />
          <Route path="responsaveis/:id" element={<EmConstrucao titulo="Alunos vinculados" />} />
          <Route path="bimestres" element={<BimestresAdmin />} />          <Route path="revisao" element={<FilaRevisao />} />
          <Route path="revisao/:id" element={<RevisarAcompanhamento />} />         
          <Route path="relatorios" element={<RelatoriosAdmin />} />
        </Route>
      </Route>

      {/* Módulo do professor */}
      <Route element={<RotaProtegida perfil="professor" />}>
        <Route path="/professor" element={<Layout />}>
          <Route index element={<InicioProfessor />} />
          <Route path="turmas" element={<MinhasTurmas />} />
          <Route path="turmas/:turmaId/disciplinas/:disciplinaId" element={<Lancamentos />} />
          <Route path="turmas/:turmaId/disciplinas/:disciplinaId/bimestres/:numero/alunos/:alunoId"
            element={<FormularioLancamento />} />
        </Route>
      </Route>

      {/* Módulo do responsável */}
      <Route element={<RotaProtegida perfil="responsavel" />}>
        <Route path="/responsavel" element={<Layout />}>
          <Route index element={<InicioResponsavel />} />
          <Route path="alunos/:alunoId" element={<RelatorioAluno />} />        </Route>
      </Route>

      {/* Qualquer outro endereço vai para o login (que redireciona quem já está logado) */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}