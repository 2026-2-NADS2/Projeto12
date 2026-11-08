import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import { api } from '../../servicos/api';
import { useCarregar } from '../../ganchos/useCarregar';
import EstadoTela from '../../componentes/EstadoTela';
import Selo from '../../componentes/Selo';
import { formatarDataHoraAno } from '../../utils/formatar';

const LIMITE_DESCRICAO = 2000;

async function carregar(turmaId, disciplinaId, numero) {
  const [vinculos, painel, tags] = await Promise.all([
    api('/professor/turmas'),
    api(`/professor/turmas/${turmaId}/disciplinas/${disciplinaId}/bimestres/${numero}`),
    api('/tags')
  ]);
  const vinculo = vinculos.find((v) => v.turma.id === turmaId && v.disciplina.id === disciplinaId);
  return { vinculo, painel, tags };
}

// Aceita "8,5" ou "8.5". Devolve { valor } ou { erro }
function lerMedia(texto) {
  const normalizado = texto.trim().replace(',', '.');
  if (normalizado === '') return { erro: 'Informe a média.' };
  if (!/^\d{1,2}(\.\d)?$/.test(normalizado)) {
    return { erro: 'A média deve ter no máximo uma casa decimal (ex.: 8,5).' };
  }
  const valor = Number(normalizado);
  if (valor < 0 || valor > 10) return { erro: 'A média deve estar entre 0 e 10.' };
  return { valor };
}

export default function FormularioLancamento() {
  const params = useParams();
  const turmaId = Number(params.turmaId);
  const disciplinaId = Number(params.disciplinaId);
  const numero = Number(params.numero);
  const alunoId = Number(params.alunoId);

  const { dados, carregando, erro, recarregar } = useCarregar(
    () => carregar(turmaId, disciplinaId, numero),
    `${turmaId}-${disciplinaId}-${numero}`
  );

  const caminhoLista = `/professor/turmas/${turmaId}/disciplinas/${disciplinaId}?bimestre=${numero}`;
  const voltar = (
    <Link to={caminhoLista} className="link-voltar"><ArrowLeft size={16} aria-hidden="true" /> Lista de alunos</Link>
  );

  if (carregando || erro) {
    return <section>{voltar}<EstadoTela carregando={carregando} erro={erro} aoTentar={recarregar} /></section>;
  }

  const { vinculo, painel, tags } = dados;
  const posicao = painel.alunos.findIndex((a) => a.aluno.id === alunoId);
  if (posicao === -1) {
    return <section>{voltar}<EstadoTela erro="Esse aluno não está matriculado nesta turma." /></section>;
  }

  const linha = painel.alunos[posicao];
  const caminhoDoAluno = (a) =>
    `/professor/turmas/${turmaId}/disciplinas/${disciplinaId}/bimestres/${numero}/alunos/${a.aluno.id}`;
  const anterior = painel.alunos[posicao - 1];
  const proximo = painel.alunos[posicao + 1];

  return (
    <section>
      {voltar}
      <p className="texto-suave">
        {vinculo?.turma.nome} – {vinculo?.disciplina.nome} · {painel.bimestre.nome}
      </p>
      <h1 className="titulo-pagina">{linha.aluno.nome}</h1>
      <p className="subtitulo-pagina">Matrícula {linha.aluno.matricula}</p>

      {/* key: ao trocar de aluno, o formulário é recriado com os dados do novo aluno */}
      <Formulario key={linha.aluno.id}
        inicial={linha.acompanhamento}
        tags={tags}
        digitacaoAberta={painel.digitacaoAberta}
        enderecoSalvar={`/professor/turmas/${turmaId}/disciplinas/${disciplinaId}/bimestres/${numero}/alunos/${alunoId}`}
        aoMudar={recarregar}
        caminhoLista={caminhoLista} />

      <nav className="navegacao-alunos" aria-label="Outros alunos">
        {anterior
          ? <Link to={caminhoDoAluno(anterior)} className="link-pequeno"><ArrowLeft size={14} aria-hidden="true" /> {anterior.aluno.nome}</Link>
          : <span />}
        {proximo && (
          <Link to={caminhoDoAluno(proximo)} className="link-pequeno">{proximo.aluno.nome} <ArrowRight size={14} aria-hidden="true" /></Link>
        )}
      </nav>
    </section>
  );
}

function Formulario({ inicial, tags, digitacaoAberta, enderecoSalvar, aoMudar, caminhoLista }) {
  const [acompanhamento, setAcompanhamento] = useState(inicial);
  const [descricao, setDescricao] = useState(inicial?.descricao ?? '');
  const [media, setMedia] = useState(inicial ? String(inicial.media).replace('.', ',') : '');
  const [tagIds, setTagIds] = useState(() => new Set(inicial?.tags.map((t) => t.id) ?? []));
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [enviando, setEnviando] = useState(false);

  const status = acompanhamento?.status ?? 'sem';
  const editavel = digitacaoAberta && ['sem', 'rascunho', 'devolvido'].includes(status);

  // Tags já escolhidas que foram inativadas depois continuam aparecendo
  const tagsDisponiveis = [...tags];
  acompanhamento?.tags.forEach((t) => {
    if (!tagsDisponiveis.some((d) => d.id === t.id)) tagsDisponiveis.push(t);
  });

  function alternarTag(id) {
    setTagIds((atual) => {
      const nova = new Set(atual);
      if (nova.has(id)) nova.delete(id); else nova.add(id);
      return nova;
    });
  }

  // Confere os campos antes de chamar a API (a API confere de novo)
  function montarCorpo() {
    if (!descricao.trim()) return { erro: 'Escreva a descrição do acompanhamento.' };
    if (descricao.length > LIMITE_DESCRICAO) return { erro: `A descrição deve ter até ${LIMITE_DESCRICAO} caracteres.` };
    const leitura = lerMedia(media);
    if (leitura.erro) return { erro: leitura.erro };
    return { corpo: { descricao: descricao.trim(), media: leitura.valor, tagIds: [...tagIds] } };
  }

  async function salvar(enviarDepois) {
    setErro('');
    setSucesso('');
    const { corpo, erro: erroCampos } = montarCorpo();
    if (erroCampos) {
      setErro(erroCampos);
      return;
    }
    setEnviando(true);
    try {
      // Sempre salva primeiro; para enviar, manda o que acabou de ser salvo
      let salvo = await api(enderecoSalvar, { metodo: 'PUT', corpo });
      if (enviarDepois) {
        salvo = await api(`/professor/acompanhamentos/${salvo.id}/enviar`, { metodo: 'POST' });
      }
      setAcompanhamento(salvo);
      setSucesso(enviarDepois ? 'Enviado para revisão da administração.' : 'Rascunho salvo.');
      aoMudar();
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="cartao formulario-lancamento">
      <div className="cartao-topo">
        <Selo tipo={status} />
        {acompanhamento?.atualizadoEm && (
          <small className="texto-suave">Atualizado em {formatarDataHoraAno(acompanhamento.atualizadoEm)}</small>
        )}
      </div>

      {status === 'devolvido' && acompanhamento.observacaoRevisao && (
        <div className="caixa-alerta" role="note">
          <AlertTriangle size={20} aria-hidden="true" />
          <div>
            <strong>Devolvido pela administração para ajuste</strong>
            <p>{acompanhamento.observacaoRevisao}</p>
          </div>
        </div>
      )}

      {!editavel && (
        <p className="aviso aviso-neutro">
          <Lock size={18} aria-hidden="true" />
          <span>
            {!digitacaoAberta
              ? 'O período de digitação deste bimestre está fechado. Somente consulta.'
              : status === 'publicado'
                ? `Publicado para os responsáveis em ${formatarDataHoraAno(acompanhamento.publicadoEm)}.`
                : `Enviado para revisão em ${formatarDataHoraAno(acompanhamento.enviadoEm)}. Aguardando a administração.`}
          </span>
        </p>
      )}

      <form className="formulario" onSubmit={(e) => { e.preventDefault(); salvar(false); }}>
        <label className="campo">
          <span>Descrição do acompanhamento</span>
          <textarea rows={7} value={descricao} disabled={!editavel} maxLength={LIMITE_DESCRICAO}
            placeholder="Como foi o desenvolvimento do aluno neste bimestre?"
            onChange={(e) => setDescricao(e.target.value)} />
          <small className="contador">{descricao.length}/{LIMITE_DESCRICAO}</small>
        </label>

        <label className="campo campo-media">
          <span>Média (0 a 10)</span>
          <input type="text" inputMode="decimal" value={media} disabled={!editavel}
            placeholder="Ex.: 8,5" onChange={(e) => setMedia(e.target.value)} />
        </label>

        <fieldset className="campo">
          <legend>Tags</legend>
          <div className="seletor-tags">
            {tagsDisponiveis.map((tag) => (
              <button key={tag.id} type="button" disabled={!editavel} title={tag.descricao ?? undefined}
                aria-pressed={tagIds.has(tag.id)}
                className={`tag ${tagIds.has(tag.id) ? 'tag-marcada' : ''}`}
                onClick={() => alternarTag(tag.id)}>
                {tag.nome}
              </button>
            ))}
            {tagsDisponiveis.length === 0 && <span className="texto-suave">Nenhuma tag cadastrada.</span>}
          </div>
        </fieldset>

        {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
        {sucesso && (
          <p className="mensagem-sucesso" role="status">
            <CheckCircle2 size={16} aria-hidden="true" /> {sucesso} <Link to={caminhoLista}>Voltar à lista</Link>
          </p>
        )}

        {editavel && (
          <div className="acoes">
            <button type="submit" className="botao botao-secundario" disabled={enviando}>
              {enviando ? 'Salvando…' : 'Salvar rascunho'}
            </button>
            <button type="button" className="botao botao-primario" disabled={enviando} onClick={() => salvar(true)}>
              Enviar para revisão <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        )}
      </form>
    </div>
  );
}