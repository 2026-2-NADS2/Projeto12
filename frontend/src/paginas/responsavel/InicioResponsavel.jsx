import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock, GraduationCap } from 'lucide-react';
import { api } from '../../servicos/api';
import { useAuth } from '../../contexto/AuthContext';
import { buscarRelatorio } from '../../servicos/relatorioResponsavel';
import { useCarregar } from '../../ganchos/useCarregar';
import EstadoTela from '../../componentes/EstadoTela';
import { ANO_LETIVO, bimestreAtual, primeiroNome } from '../../utils/formatar';

const disciplinasPublicadas = (n) => `${n} ${n === 1 ? 'disciplina publicada' : 'disciplinas publicadas'}`;

async function carregar() {
  const [alunos, bimestres] = await Promise.all([
    api('/responsavel/alunos'),
    api(`/bimestres?anoLetivo=${ANO_LETIVO}`)
  ]);
  const atual = bimestreAtual(bimestres);
  // Para cada filho, um resumo do bimestre da vez (quantas disciplinas publicadas e se já deu ciência)
  const resumos = await Promise.all(alunos.map((a) =>
    atual ? buscarRelatorio(a.alunoId, ANO_LETIVO, atual.numero) : null
  ));
  return { atual, alunos: alunos.map((a, i) => ({ ...a, relatorio: resumos[i] })) };
}

export default function InicioResponsavel() {
  const { usuario } = useAuth();
  const { dados, carregando, erro, recarregar } = useCarregar(carregar);

  return (
    <section>
      <h1 className="titulo-pagina">Olá, {primeiroNome(usuario.nome)}</h1>
      <p className="subtitulo-pagina">Acompanhe os relatórios bimestrais publicados pela escola.</p>

      {carregando || erro ? (
        <EstadoTela carregando={carregando} erro={erro} aoTentar={recarregar} />
      ) : dados.alunos.length === 0 ? (
        <div className="cartao estado-vazio">
          Nenhum aluno vinculado ao seu cadastro. Procure a secretaria da escola.
        </div>
      ) : (
        <>
          <h2 className="secao-titulo">Meus alunos</h2>
          <div className="grade-2">
            {dados.alunos.map((a) => (
              <Link key={a.alunoId} to={`/responsavel/alunos/${a.alunoId}`} className="cartao cartao-turma">
                <div className="cartao-topo">
                  <span className="icone-cartao"><GraduationCap size={22} strokeWidth={1.6} aria-hidden="true" /></span>
                  <small className="texto-suave">{a.parentesco}</small>
                </div>
                <strong>{a.nome}</strong>
                <small className="texto-suave">
                  {a.turmaAtual ? `${a.turmaAtual.nome} – ${a.turmaAtual.anoLetivo}` : 'Sem turma neste ano'} · Matrícula {a.matricula}
                </small>

                {dados.atual && (
                  <p className="resumo-bimestre">
                    {!a.relatorio ? (
                      <><Clock size={16} aria-hidden="true" /> {dados.atual.nome}: nenhum relatório publicado ainda</>
                    ) : a.relatorio.ciencia ? (
                      <><CheckCircle2 size={16} className="icone-ok" aria-hidden="true" />
                        {dados.atual.nome}: {disciplinasPublicadas(a.relatorio.disciplinas.length)} · ciência registrada</>
                    ) : (
                      <><Clock size={16} className="icone-pendente" aria-hidden="true" />
                        {dados.atual.nome}: {disciplinasPublicadas(a.relatorio.disciplinas.length)} · <strong>ciência pendente</strong></>
                    )}
                  </p>
                )}

                <span className="link-acao">Ver relatório <ArrowRight size={16} aria-hidden="true" /></span>
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}