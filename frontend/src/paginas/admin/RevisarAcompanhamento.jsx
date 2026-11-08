import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, History, Lock, Send, Undo2 } from 'lucide-react';
import { api } from '../../servicos/api';
import { useCarregar } from '../../ganchos/useCarregar';
import EstadoTela from '../../componentes/EstadoTela';
import Selo from '../../componentes/Selo';
import Modal from '../../componentes/Modal';
import { formatarDataHoraAno } from '../../utils/formatar';
import { formatarMedia, lerMedia } from '../../utils/media';

const LIMITE_DESCRICAO = 2000;
const LIMITE_OBSERVACAO = 500;

const NOME_DA_ACAO = {
  criado: 'Criou o rascunho',
  editado: 'Editou o rascunho',
  enviado: 'Enviou para revisão',
  alterado: 'Alterou na revisão',
  devolvido: 'Devolveu ao professor',
  publicado: 'Publicou para os responsáveis'
};

async function carregar(id) {
  const [detalhe, tags] = await Promise.all([api(`/revisao/acompanhamentos/${id}`), api('/tags')]);
  return { detalhe, tags };
}

export default function RevisarAcompanhamento() {
  const id = Number(useParams().id);
  const { dados, carregando, erro, recarregar } = useCarregar(() => carregar(id), String(id));
  // Volta para a fila com os mesmos filtros que estavam escolhidos (enviados pela fila no "state" do link)
  const enderecoFila = `/admin/revisao${useLocation().state?.fila ?? ''}`;

  const voltar = (
    <Link to={enderecoFila} className="link-voltar"><ArrowLeft size={16} aria-hidden="true" /> Fila de revisão</Link>
  );

  if (carregando || erro) {
    return <section>{voltar}<EstadoTela carregando={carregando} erro={erro} aoTentar={recarregar} /></section>;
  }

  const { detalhe, tags } = dados;
  const { aluno, turma, disciplina, professor, bimestre } = detalhe;

  return (
    <section>
      {voltar}
      <p className="texto-suave">{turma.nome} – {disciplina.nome} · {bimestre.nome} · Prof. {professor.nome}</p>
      <h1 className="titulo-pagina">{aluno.nome}</h1>
      <p className="subtitulo-pagina">Matrícula {aluno.matricula}</p>

      <div className="grade-revisao">
        <Revisao key={detalhe.acompanhamento.id} detalhe={detalhe} tags={tags} aoMudar={recarregar}
          enderecoFila={enderecoFila} />
        <Historico historico={detalhe.historico} tags={tags} />
      </div>
    </section>
  );
}

function Revisao({ detalhe, tags, aoMudar, enderecoFila }) {
  const navegar = useNavigate();
  const { acompanhamento } = detalhe;
  const emRevisao = acompanhamento.status === 'enviado';

  const [descricao, setDescricao] = useState(acompanhamento.descricao);
  const [media, setMedia] = useState(formatarMedia(acompanhamento.media));
  const [tagIds, setTagIds] = useState(() => new Set(acompanhamento.tags.map((t) => t.id)));
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [trabalhando, setTrabalhando] = useState(false);
  const [devolvendo, setDevolvendo] = useState(false);

  // Houve mudança em relação ao que o professor enviou?
  const tagsOriginais = acompanhamento.tags.map((t) => t.id).sort().join(',');
  const alterado = descricao !== acompanhamento.descricao
    || media !== formatarMedia(acompanhamento.media)
    || [...tagIds].sort().join(',') !== tagsOriginais;

  const tagsDisponiveis = [...tags];
  acompanhamento.tags.forEach((t) => { if (!tagsDisponiveis.some((d) => d.id === t.id)) tagsDisponiveis.push(t); });

  function alternarTag(tagId) {
    setTagIds((atual) => {
      const nova = new Set(atual);
      if (nova.has(tagId)) nova.delete(tagId); else nova.add(tagId);
      return nova;
    });
  }

  function montarCorpo() {
    if (!descricao.trim()) return { erro: 'A descrição não pode ficar vazia.' };
    if (descricao.length > LIMITE_DESCRICAO) return { erro: `A descrição deve ter até ${LIMITE_DESCRICAO} caracteres.` };
    const leitura = lerMedia(media);
    if (leitura.erro) return { erro: leitura.erro };
    return { corpo: { descricao: descricao.trim(), media: leitura.valor, tagIds: [...tagIds] } };
  }

  // Executa uma ação, mostra a mensagem de sucesso ou de erro e recarrega os dados
  async function executar(acao, mensagem) {
    setErro('');
    setSucesso('');
    setTrabalhando(true);
    try {
      await acao();
      setSucesso(mensagem);
      aoMudar();
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setTrabalhando(false);
    }
  }

  // Valida os campos e grava as alterações do administrador (lança erro se algo estiver errado)
  async function salvarAlteracoes() {
    const { corpo, erro: erroCampos } = montarCorpo();
    if (erroCampos) throw new Error(erroCampos);
    await api(`/revisao/acompanhamentos/${acompanhamento.id}`, { metodo: 'PUT', corpo });
  }

  function aoSalvar() {
    executar(salvarAlteracoes, 'Alterações salvas. Elas ficam registradas no histórico.');
  }

  function aoPublicar() {
    executar(async () => {
      if (alterado) await salvarAlteracoes(); // se mexeu no texto, salva antes de publicar
      await api(`/revisao/acompanhamentos/${acompanhamento.id}/publicar`, { metodo: 'POST' });
    }, 'Publicado! O responsável já pode ver este acompanhamento.');
  }

  async function aoDevolver(observacao) {
    await api(`/revisao/acompanhamentos/${acompanhamento.id}/devolver`, { metodo: 'POST', corpo: { observacao } });
    setDevolvendo(false);
    setSucesso('Devolvido ao professor com a sua observação.');
    aoMudar();
  }

  return (
    <div className="cartao formulario-lancamento">
      <div className="cartao-topo">
        <Selo tipo={acompanhamento.status} />
        <small className="texto-suave">
          {acompanhamento.enviadoEm ? `Enviado em ${formatarDataHoraAno(acompanhamento.enviadoEm)}` : ''}
        </small>
      </div>

      {sucesso && (
        <p className="mensagem-sucesso" role="status" style={{ marginTop: 16 }}>
          <CheckCircle2 size={16} aria-hidden="true" /> {sucesso}{' '}
          <button type="button" className="botao-texto" onClick={() => navegar(enderecoFila)}>Voltar à fila</button>
        </p>
      )}

      {!emRevisao && (
        <p className="aviso aviso-neutro">
          <Lock size={18} aria-hidden="true" />
          <span>
            {acompanhamento.status === 'publicado'
              ? `Publicado em ${formatarDataHoraAno(acompanhamento.publicadoEm)}. Visível para os responsáveis.`
              : acompanhamento.status === 'devolvido'
                ? `Devolvido ao professor: “${acompanhamento.observacaoRevisao}”`
                : 'Rascunho do professor: ainda não foi enviado para revisão.'}
          </span>
        </p>
      )}

      <div className="formulario">
        <label className="campo">
          <span>Descrição do acompanhamento</span>
          <textarea rows={8} value={descricao} disabled={!emRevisao} maxLength={LIMITE_DESCRICAO}
            onChange={(e) => setDescricao(e.target.value)} />
          <small className="contador">{descricao.length}/{LIMITE_DESCRICAO}</small>
        </label>

        <label className="campo campo-media">
          <span>Média (0 a 10)</span>
          <input type="text" inputMode="decimal" value={media} disabled={!emRevisao}
            onChange={(e) => setMedia(e.target.value)} />
        </label>

        <fieldset className="campo">
          <legend>Tags</legend>
          <div className="seletor-tags">
            {tagsDisponiveis.map((tag) => (
              <button key={tag.id} type="button" disabled={!emRevisao} aria-pressed={tagIds.has(tag.id)}
                className={`tag ${tagIds.has(tag.id) ? 'tag-marcada' : ''}`} onClick={() => alternarTag(tag.id)}>
                {tag.nome}
              </button>
            ))}
          </div>
        </fieldset>

        {erro && <p className="mensagem-erro" role="alert">{erro}</p>}

        {emRevisao && (
          <div className="acoes">
            <button type="button" className="botao botao-secundario" disabled={trabalhando || !alterado} onClick={aoSalvar}>
              Salvar alterações
            </button>
            <button type="button" className="botao botao-perigo" disabled={trabalhando} onClick={() => setDevolvendo(true)}>
              <Undo2 size={18} aria-hidden="true" /> Devolver ao professor
            </button>
            <button type="button" className="botao botao-primario" disabled={trabalhando} onClick={aoPublicar}>
              <Send size={18} aria-hidden="true" /> {alterado ? 'Salvar e publicar' : 'Publicar'}
            </button>
          </div>
        )}
      </div>

      {devolvendo && <ModalDevolver aoConfirmar={aoDevolver} aoFechar={() => setDevolvendo(false)} />}
    </div>
  );
}

function ModalDevolver({ aoConfirmar, aoFechar }) {
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function confirmar(evento) {
    evento.preventDefault();
    if (!observacao.trim()) {
      setErro('Escreva o que o professor precisa ajustar.');
      return;
    }
    setEnviando(true);
    setErro('');
    try {
      await aoConfirmar(observacao.trim());
    } catch (falha) {
      setErro(falha.message);
      setEnviando(false);
    }
  }

  return (
    <Modal titulo="Devolver ao professor" aoFechar={aoFechar}>
      <form className="formulario" onSubmit={confirmar}>
        <p className="texto-suave">
          O professor verá esta observação e poderá corrigir o lançamento enquanto o bimestre estiver aberto.
        </p>
        <label className="campo">
          <span>O que precisa ser ajustado?</span>
          <textarea rows={4} autoFocus value={observacao} maxLength={LIMITE_OBSERVACAO}
            placeholder="Ex.: Detalhar quais atividades de leitura foram feitas no bimestre."
            onChange={(e) => setObservacao(e.target.value)} />
          <small className="contador">{observacao.length}/{LIMITE_OBSERVACAO}</small>
        </label>
        {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
        <div className="acoes acoes-direita">
          <button type="button" className="botao botao-secundario" onClick={aoFechar}>Cancelar</button>
          <button type="submit" className="botao botao-perigo" disabled={enviando}>
            {enviando ? 'Devolvendo…' : 'Confirmar devolução'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Linha do tempo com quem fez o quê, quando, e o que mudou (RF07)
function Historico({ historico, tags }) {
  const nomeDaTag = (tagId) => tags.find((t) => t.id === tagId)?.nome ?? `#${tagId}`;

  // Compara o estado anterior com o posterior e descreve as diferenças
  function mudancas(antes, depois) {
    if (!antes || !depois) return [];
    const lista = [];
    if (antes.status !== depois.status) lista.push(`Situação: ${antes.status} → ${depois.status}`);
    if (antes.media !== depois.media) lista.push(`Média: ${formatarMedia(antes.media)} → ${formatarMedia(depois.media)}`);
    if (antes.descricao !== depois.descricao) lista.push('Descrição alterada');
    const tagsAntes = (antes.tagIds ?? []).slice().sort().join(',');
    const tagsDepois = (depois.tagIds ?? []).slice().sort().join(',');
    if (tagsAntes !== tagsDepois) {
      lista.push(`Tags: ${(depois.tagIds ?? []).map(nomeDaTag).join(', ') || 'nenhuma'}`);
    }
    return lista;
  }

  return (
    <aside className="cartao historico">
      <h2 className="secao-titulo"><History size={18} aria-hidden="true" /> Histórico</h2>
      {historico.length === 0 ? (
        <p className="texto-suave">Sem registros.</p>
      ) : (
        <ol className="linha-do-tempo">
          {[...historico].reverse().map((h) => (
            <li key={h.id}>
              <strong>{NOME_DA_ACAO[h.acao] ?? h.acao}</strong>
              <small className="texto-suave">
                {h.usuario.nome} ({h.usuario.perfil}) · {formatarDataHoraAno(h.dataHora)}
              </small>
              {mudancas(h.estadoAnterior, h.estadoPosterior).map((m) => (
                <small key={m} className="mudanca">{m}</small>
              ))}
              {h.observacao && <small className="observacao">“{h.observacao}”</small>}
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}