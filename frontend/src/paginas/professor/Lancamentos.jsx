import { useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, Lock } from 'lucide-react';
import { api } from '../../servicos/api';
import { useCarregar } from '../../ganchos/useCarregar';
import EstadoTela from '../../componentes/EstadoTela';
import Selo from '../../componentes/Selo';
import { NOME_DO_TURNO, bimestreAtual, formatarDataHoraAno } from '../../utils/formatar';

const STATUS = ['sem', 'rascunho', 'enviado', 'devolvido', 'publicado'];

// 1) acha a turma/disciplina entre as do professor  2) busca os bimestres do ano da turma
// 3) busca o painel do bimestre escolhido (ou do bimestre "da vez")
async function carregar(turmaId, disciplinaId, numeroEscolhido) {
  const vinculos = await api('/professor/turmas');
  const vinculo = vinculos.find((v) => v.turma.id === turmaId && v.disciplina.id === disciplinaId);
  if (!vinculo) {
    throw new Error('Você não leciona essa disciplina nesta turma.');
  }
  const bimestres = await api(`/bimestres?anoLetivo=${vinculo.turma.anoLetivo}`);
  const numero = numeroEscolhido ?? bimestreAtual(bimestres)?.numero;
  if (!numero) {
    throw new Error('Os bimestres deste ano letivo ainda não foram configurados.');
  }
  const painel = await api(`/professor/turmas/${turmaId}/disciplinas/${disciplinaId}/bimestres/${numero}`);
  return { vinculo, bimestres, numero, painel };
}

// Texto do botão de cada linha, conforme a situação
function acaoDaLinha(acompanhamento, digitacaoAberta) {
  if (!digitacaoAberta) return { texto: 'Ver', primario: false };
  if (!acompanhamento) return { texto: 'Lançar', primario: true };
  if (acompanhamento.status === 'rascunho') return { texto: 'Editar', primario: false };
  if (acompanhamento.status === 'devolvido') return { texto: 'Corrigir', primario: true };
  return { texto: 'Ver', primario: false };
}

export default function Lancamentos() {
  const turmaId = Number(useParams().turmaId);
  const disciplinaId = Number(useParams().disciplinaId);
  const [parametros, setParametros] = useSearchParams();
  const numeroEscolhido = Number(parametros.get('bimestre')) || null;
  const alunoDoLink = parametros.get('aluno');
  const [filtro, setFiltro] = useState('todos');

  const { dados, carregando, atualizando, erro, recarregar } = useCarregar(
    () => carregar(turmaId, disciplinaId, numeroEscolhido),
    `${turmaId}-${disciplinaId}-${numeroEscolhido}`
  );

  const voltar = (
    <Link to="/professor/turmas" className="link-voltar"><ArrowLeft size={16} aria-hidden="true" /> Minhas turmas</Link>
  );

  if (carregando || erro) {
    return <section>{voltar}<EstadoTela carregando={carregando} erro={erro} aoTentar={recarregar} /></section>;
  }

  const { vinculo, bimestres, numero, painel } = dados;
  const caminhoAluno = (alunoId) =>
    `/professor/turmas/${turmaId}/disciplinas/${disciplinaId}/bimestres/${numero}/alunos/${alunoId}`;

  // Link vindo do painel inicial (?aluno=ID): abre direto o formulário daquele aluno
  if (alunoDoLink) {
    return <Navigate to={caminhoAluno(alunoDoLink)} replace />;
  }

  const contagem = Object.fromEntries(STATUS.map((s) => [s, 0]));
  painel.alunos.forEach((a) => { contagem[a.acompanhamento?.status ?? 'sem'] += 1; });
  const alunosVisiveis = filtro === 'todos'
    ? painel.alunos
    : painel.alunos.filter((a) => (a.acompanhamento?.status ?? 'sem') === filtro);

  return (
    <section>
      {voltar}
      <h1 className="titulo-pagina">{vinculo.turma.nome} – {vinculo.disciplina.nome}</h1>
      <p className="subtitulo-pagina">{NOME_DO_TURNO[vinculo.turma.turno]} – {vinculo.turma.anoLetivo}</p>

      {/* Abas dos bimestres */}
      <div className="abas" role="tablist" aria-label="Bimestres">
        {bimestres.map((b) => (
          <button key={b.id} type="button" role="tab" aria-selected={b.numero === numero}
            className={`aba ${b.numero === numero ? 'aba-ativa' : ''}`}
            onClick={() => { setFiltro('todos'); setParametros({ bimestre: b.numero }); }}>
            {b.nome}
          </button>
        ))}
      </div>

      {painel.digitacaoAberta ? (
        <p className="aviso">
          <CalendarCheck size={20} aria-hidden="true" />
          <span>Digitação aberta até <strong>{formatarDataHoraAno(painel.bimestre.encerramento)}</strong>.</span>
        </p>
      ) : (
        <p className="aviso aviso-neutro">
          <Lock size={18} aria-hidden="true" />
          <span>
            {painel.bimestre.situacao === 'aguardando'
              ? `A digitação do ${painel.bimestre.nome} ainda não começou.`
              : `A digitação do ${painel.bimestre.nome} está encerrada. Os lançamentos ficam somente para consulta.`}
          </span>
        </p>
      )}

      {/* Filtro por situação: clicar num selo mostra só aqueles alunos */}
      <div className="filtros" aria-label="Filtrar por situação">
        <button type="button" className={`filtro ${filtro === 'todos' ? 'filtro-ativo' : ''}`}
          onClick={() => setFiltro('todos')}>
          Todos <strong>{painel.alunos.length}</strong>
        </button>
        {STATUS.map((s) => (
          <button key={s} type="button" className={`filtro ${filtro === s ? 'filtro-ativo' : ''}`}
            onClick={() => setFiltro(s)}>
            <Selo tipo={s} /> <strong>{contagem[s]}</strong>
          </button>
        ))}
      </div>

      <div className={`cartao tabela-cartao ${atualizando ? 'atualizando' : ''}`}>
        <table className="tabela">
          <thead>
            <tr>
              <th>Aluno</th>
              <th className="so-tela-grande">Matrícula</th>
              <th>Média</th>
              <th>Situação</th>
              <th><span className="menu-rotulo">Ação</span></th>
            </tr>
          </thead>
          <tbody>
            {alunosVisiveis.map(({ aluno, acompanhamento }) => {
              const acao = acaoDaLinha(acompanhamento, painel.digitacaoAberta);
              return (
                <tr key={aluno.id}>
                  <td><strong>{aluno.nome}</strong></td>
                  <td className="so-tela-grande texto-suave">{aluno.matricula}</td>
                  <td>{acompanhamento ? acompanhamento.media.toFixed(1).replace('.', ',') : '—'}</td>
                  <td><Selo tipo={acompanhamento?.status ?? 'sem'} /></td>
                  <td className="celula-acao">
                    <Link to={caminhoAluno(aluno.id)}
                      className={`botao botao-pequeno ${acao.primario ? 'botao-primario' : 'botao-secundario'}`}>
                      {acao.texto}
                    </Link>
                  </td>
                </tr>
              );
            })}
            {alunosVisiveis.length === 0 && (
              <tr><td colSpan={5} className="texto-suave texto-centro">Nenhum aluno nesta situação.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}