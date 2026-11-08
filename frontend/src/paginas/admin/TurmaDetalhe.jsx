import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { api } from '../../servicos/api';
import { useCarregar } from '../../ganchos/useCarregar';
import EstadoTela from '../../componentes/EstadoTela';
import { NOME_DO_TURNO } from '../../utils/formatar';

// Tudo o que a tela da turma usa: dados da turma, alunos, disciplinas e as listas para os campos de seleção
async function carregar(id) {
  const [alunosTurma, disciplinasTurma, todosAlunos, todasDisciplinas, professores] = await Promise.all([
    api(`/turmas/${id}/alunos`),
    api(`/turmas/${id}/disciplinas`),
    api('/alunos?porPagina=100'),
    api('/disciplinas'),
    api('/professores?porPagina=100')
  ]);
  const turmas = await api(`/turmas?anoLetivo=${alunosTurma.anoLetivo}`);
  return {
    turma: turmas.find((t) => t.id === id),
    alunos: alunosTurma.alunos,
    disciplinas: disciplinasTurma.disciplinas,
    todosAlunos: todosAlunos.itens,
    todasDisciplinas,
    professores: professores.itens
  };
}

export default function TurmaDetalhe() {
  const id = Number(useParams().id);
  const [parametros, setParametros] = useSearchParams();
  const aba = parametros.get('aba') ?? 'alunos';
  const { dados, carregando, atualizando, erro, recarregar } = useCarregar(() => carregar(id), String(id));

  const voltar = (
    <Link to="/admin/cadastros?aba=turmas" className="link-voltar"><ArrowLeft size={16} aria-hidden="true" /> Turmas</Link>
  );

  if (carregando || erro) {
    return <section>{voltar}<EstadoTela carregando={carregando} erro={erro} aoTentar={recarregar} /></section>;
  }

  const { turma } = dados;

  return (
    <section>
      {voltar}
      <h1 className="titulo-pagina">{turma ? `${turma.nome} – ${turma.anoLetivo}` : 'Turma'}</h1>
      <p className="subtitulo-pagina">Turno: {turma ? NOME_DO_TURNO[turma.turno] : '—'}</p>

      <div className="abas" role="tablist" aria-label="Vínculos da turma">
        <button type="button" role="tab" aria-selected={aba === 'alunos'}
          className={`aba ${aba === 'alunos' ? 'aba-ativa' : ''}`} onClick={() => setParametros({ aba: 'alunos' })}>
          Alunos ({dados.alunos.length})
        </button>
        <button type="button" role="tab" aria-selected={aba === 'disciplinas'}
          className={`aba ${aba === 'disciplinas' ? 'aba-ativa' : ''}`} onClick={() => setParametros({ aba: 'disciplinas' })}>
          Disciplinas e professores ({dados.disciplinas.length})
        </button>
      </div>

      <div className={atualizando ? 'atualizando' : ''}>
        {aba === 'alunos'
          ? <AbaAlunos turmaId={id} dados={dados} aoMudar={recarregar} />
          : <AbaDisciplinas turmaId={id} dados={dados} aoMudar={recarregar} />}
      </div>
    </section>
  );
}

// Executa uma ação na API e mostra o resultado; usado pelas duas abas
function useAcao(aoMudar) {
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
  const [ocupado, setOcupado] = useState(false);

  async function executar(acao, textoSucesso) {
    setMensagem({ tipo: '', texto: '' });
    setOcupado(true);
    try {
      await acao();
      setMensagem({ tipo: 'sucesso', texto: textoSucesso });
      aoMudar();
    } catch (falha) {
      setMensagem({ tipo: 'erro', texto: falha.message });
    } finally {
      setOcupado(false);
    }
  }

  const aviso = mensagem.texto && (
    <p className={mensagem.tipo === 'erro' ? 'mensagem-erro' : 'mensagem-sucesso'} role={mensagem.tipo === 'erro' ? 'alert' : 'status'}>
      {mensagem.texto}
    </p>
  );
  return { executar, ocupado, aviso };
}

function AbaAlunos({ turmaId, dados, aoMudar }) {
  const [alunoId, setAlunoId] = useState('');
  const { executar, ocupado, aviso } = useAcao(aoMudar);

  // Só oferece quem ainda não está nesta turma
  const naTurma = new Set(dados.alunos.map((a) => a.alunoId));
  const disponiveis = dados.todosAlunos.filter((a) => !naTurma.has(a.id));

  function matricular(evento) {
    evento.preventDefault();
    if (!alunoId) return;
    const nome = disponiveis.find((a) => a.id === Number(alunoId))?.nome;
    executar(async () => {
      await api(`/turmas/${turmaId}/alunos`, { metodo: 'POST', corpo: { alunoId: Number(alunoId) } });
      setAlunoId('');
    }, `${nome} matriculado(a) na turma.`);
  }

  function remover(aluno) {
    executar(() => api(`/turmas/${turmaId}/alunos/${aluno.alunoId}`, { metodo: 'DELETE' }),
      `${aluno.nome} removido(a) da turma.`);
  }

  return (
    <>
      <form className="cartao barra-vinculo" onSubmit={matricular}>
        <label className="campo">
          <span>Aluno</span>
          <select value={alunoId} onChange={(e) => setAlunoId(e.target.value)}>
            <option value="">Selecione…</option>
            {disponiveis.map((a) => <option key={a.id} value={a.id}>{a.nome} ({a.matricula})</option>)}
          </select>
        </label>
        <button type="submit" className="botao botao-primario" disabled={!alunoId || ocupado}>
          <Plus size={18} aria-hidden="true" /> Matricular aluno
        </button>
      </form>
      <p className="dica">Um aluno só pode estar em uma turma por ano letivo. O sistema avisa se ele já estiver em outra.</p>
      {aviso}

      {dados.alunos.length === 0 ? (
        <div className="cartao estado-vazio">Nenhum aluno matriculado nesta turma.</div>
      ) : (
        <div className="cartao tabela-cartao">
          <table className="tabela">
            <thead><tr><th>Aluno</th><th>Matrícula</th><th className="celula-acao"><span className="menu-rotulo">Ação</span></th></tr></thead>
            <tbody>
              {dados.alunos.map((a) => (
                <tr key={a.alunoId}>
                  <td><strong>{a.nome}</strong></td>
                  <td className="texto-suave">{a.matricula}</td>
                  <td className="celula-acao">
                    <button type="button" className="botao botao-perigo botao-pequeno" disabled={ocupado} onClick={() => remover(a)}>
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function AbaDisciplinas({ turmaId, dados, aoMudar }) {
  const [disciplinaId, setDisciplinaId] = useState('');
  const [professorId, setProfessorId] = useState('');
  const { executar, ocupado, aviso } = useAcao(aoMudar);

  // Cada disciplina tem um único professor por turma: só oferece as que ainda não foram alocadas
  const alocadas = new Set(dados.disciplinas.map((d) => d.disciplina.id));
  const disponiveis = dados.todasDisciplinas.filter((d) => !alocadas.has(d.id));

  function alocar(evento) {
    evento.preventDefault();
    if (!disciplinaId || !professorId) return;
    executar(async () => {
      await api(`/turmas/${turmaId}/disciplinas`, {
        metodo: 'POST', corpo: { disciplinaId: Number(disciplinaId), professorId: Number(professorId) }
      });
      setDisciplinaId('');
      setProfessorId('');
    }, 'Disciplina alocada na turma.');
  }

  function trocarProfessor(item, novoProfessorId) {
    const nome = dados.professores.find((p) => p.id === Number(novoProfessorId))?.nome;
    executar(() => api(`/turmas/${turmaId}/disciplinas/${item.disciplina.id}`, {
      metodo: 'PUT', corpo: { professorId: Number(novoProfessorId) }
    }), `${item.disciplina.nome} agora é com ${nome}.`);
  }

  function remover(item) {
    executar(() => api(`/turmas/${turmaId}/disciplinas/${item.disciplina.id}`, { metodo: 'DELETE' }),
      `${item.disciplina.nome} removida da turma.`);
  }

  return (
    <>
      <form className="cartao barra-vinculo" onSubmit={alocar}>
        <label className="campo">
          <span>Disciplina</span>
          <select value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)}>
            <option value="">Selecione…</option>
            {disponiveis.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>
        </label>
        <label className="campo">
          <span>Professor</span>
          <select value={professorId} onChange={(e) => setProfessorId(e.target.value)}>
            <option value="">Selecione…</option>
            {dados.professores.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </label>
        <button type="submit" className="botao botao-primario" disabled={!disciplinaId || !professorId || ocupado}>
          <Plus size={18} aria-hidden="true" /> Alocar disciplina
        </button>
      </form>
      {aviso}

      {dados.disciplinas.length === 0 ? (
        <div className="cartao estado-vazio">Nenhuma disciplina alocada nesta turma.</div>
      ) : (
        <div className="cartao tabela-cartao">
          <table className="tabela">
            <thead><tr><th>Disciplina</th><th>Professor</th><th className="celula-acao"><span className="menu-rotulo">Ação</span></th></tr></thead>
            <tbody>
              {dados.disciplinas.map((item) => (
                <tr key={item.disciplina.id}>
                  <td><strong>{item.disciplina.nome}</strong></td>
                  <td>
                    {/* Trocar o professor aqui já salva (PUT) */}
                    <select className="select-tabela" value={item.professor.id} disabled={ocupado}
                      aria-label={`Professor de ${item.disciplina.nome}`}
                      onChange={(e) => trocarProfessor(item, e.target.value)}>
                      {dados.professores.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </select>
                  </td>
                  <td className="celula-acao">
                    <button type="button" className="botao botao-perigo botao-pequeno" disabled={ocupado} onClick={() => remover(item)}>
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}