import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { api } from '../../servicos/api';
import { useCarregar } from '../../ganchos/useCarregar';
import EstadoTela from '../../componentes/EstadoTela';

const PARENTESCOS = ['Mãe', 'Pai', 'Avó', 'Avô', 'Tia', 'Tio', 'Irmã', 'Irmão', 'Responsável legal'];

async function carregar(id) {
  const [vinculados, responsaveis, alunos] = await Promise.all([
    api(`/responsaveis/${id}/alunos`),
    api('/responsaveis?porPagina=100'),
    api('/alunos?porPagina=100')
  ]);
  return {
    responsavel: responsaveis.itens.find((r) => r.id === id),
    vinculados,
    todosAlunos: alunos.itens
  };
}

export default function ResponsavelDetalhe() {
  const id = Number(useParams().id);
  const { dados, carregando, atualizando, erro, recarregar } = useCarregar(() => carregar(id), String(id));
  const [alunoId, setAlunoId] = useState('');
  const [parentesco, setParentesco] = useState('');
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
  const [ocupado, setOcupado] = useState(false);

  const voltar = (
    <Link to="/admin/cadastros?aba=responsaveis" className="link-voltar"><ArrowLeft size={16} aria-hidden="true" /> Responsáveis</Link>
  );

  if (carregando || erro) {
    return <section>{voltar}<EstadoTela carregando={carregando} erro={erro} aoTentar={recarregar} /></section>;
  }

  const { responsavel, vinculados, todosAlunos } = dados;
  const jaVinculados = new Set(vinculados.map((v) => v.alunoId));
  const disponiveis = todosAlunos.filter((a) => !jaVinculados.has(a.id));

  async function executar(acao, textoSucesso) {
    setMensagem({ tipo: '', texto: '' });
    setOcupado(true);
    try {
      await acao();
      setMensagem({ tipo: 'sucesso', texto: textoSucesso });
      recarregar();
    } catch (falha) {
      setMensagem({ tipo: 'erro', texto: falha.message });
    } finally {
      setOcupado(false);
    }
  }

  function vincular(evento) {
    evento.preventDefault();
    if (!alunoId || !parentesco.trim()) return;
    const nome = disponiveis.find((a) => a.id === Number(alunoId))?.nome;
    executar(async () => {
      await api(`/responsaveis/${id}/alunos`, { metodo: 'POST', corpo: { alunoId: Number(alunoId), parentesco: parentesco.trim() } });
      setAlunoId('');
      setParentesco('');
    }, `${nome} vinculado(a) a este responsável.`);
  }

  function desvincular(aluno) {
    executar(() => api(`/responsaveis/${id}/alunos/${aluno.alunoId}`, { metodo: 'DELETE' }),
      `${aluno.nome} desvinculado(a). O responsável deixa de ver os relatórios deste aluno.`);
  }

  return (
    <section>
      {voltar}
      <h1 className="titulo-pagina">{responsavel?.nome ?? 'Responsável'}</h1>
      <p className="subtitulo-pagina">
        {responsavel ? `${responsavel.email} · ` : ''}Alunos que este responsável pode acompanhar
      </p>

      <form className="cartao barra-vinculo" onSubmit={vincular}>
        <label className="campo">
          <span>Aluno</span>
          <select value={alunoId} onChange={(e) => setAlunoId(e.target.value)}>
            <option value="">Selecione…</option>
            {disponiveis.map((a) => <option key={a.id} value={a.id}>{a.nome} ({a.matricula})</option>)}
          </select>
        </label>
        <label className="campo">
          <span>Parentesco</span>
          {/* datalist: sugere opções, mas aceita qualquer texto */}
          <input list="parentescos" value={parentesco} placeholder="Ex.: Mãe" maxLength={30}
            onChange={(e) => setParentesco(e.target.value)} />
          <datalist id="parentescos">
            {PARENTESCOS.map((p) => <option key={p} value={p} />)}
          </datalist>
        </label>
        <button type="submit" className="botao botao-primario" disabled={!alunoId || !parentesco.trim() || ocupado}>
          <Plus size={18} aria-hidden="true" /> Vincular aluno
        </button>
      </form>
      <p className="dica">Um aluno pode ter mais de um responsável, e um responsável pode acompanhar vários alunos.</p>

      {mensagem.texto && (
        <p className={mensagem.tipo === 'erro' ? 'mensagem-erro' : 'mensagem-sucesso'} role={mensagem.tipo === 'erro' ? 'alert' : 'status'}>
          {mensagem.texto}
        </p>
      )}

      <div className={atualizando ? 'atualizando' : ''}>
        {vinculados.length === 0 ? (
          <div className="cartao estado-vazio">Nenhum aluno vinculado. Vincule acima para que o responsável veja os relatórios.</div>
        ) : (
          <div className="cartao tabela-cartao">
            <table className="tabela">
              <thead><tr><th>Aluno</th><th>Matrícula</th><th>Parentesco</th><th className="celula-acao"><span className="menu-rotulo">Ação</span></th></tr></thead>
              <tbody>
                {vinculados.map((v) => (
                  <tr key={v.alunoId}>
                    <td><strong>{v.nome}</strong></td>
                    <td className="texto-suave">{v.matricula}</td>
                    <td>{v.parentesco}</td>
                    <td className="celula-acao">
                      <button type="button" className="botao botao-perigo botao-pequeno" disabled={ocupado} onClick={() => desvincular(v)}>
                        Desvincular
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}