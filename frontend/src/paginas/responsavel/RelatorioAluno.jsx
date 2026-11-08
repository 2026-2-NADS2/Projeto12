import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Download, FileText, MessageSquare } from 'lucide-react';
import { api } from '../../servicos/api';
import { buscarRelatorio } from '../../servicos/relatorioResponsavel';
import { useCarregar } from '../../ganchos/useCarregar';
import EstadoTela from '../../componentes/EstadoTela';
import { ANO_LETIVO, bimestreAtual, formatarDataAno, formatarDataHoraAno } from '../../utils/formatar';
import { formatarMedia } from '../../utils/media';
import { baixarArquivo } from '../../utils/baixarArquivo';

const LIMITE_RETORNO = 1000;

async function carregar(alunoId, numeroEscolhido) {
  const [alunos, bimestres] = await Promise.all([
    api('/responsavel/alunos'),
    api(`/bimestres?anoLetivo=${ANO_LETIVO}`)
  ]);
  const aluno = alunos.find((a) => a.alunoId === alunoId);
  if (!aluno) throw new Error('Aluno não encontrado entre os seus vinculados.');
  const numero = numeroEscolhido ?? bimestreAtual(bimestres)?.numero ?? 1;
  const relatorio = await buscarRelatorio(alunoId, ANO_LETIVO, numero);
  return { aluno, bimestres, numero, relatorio };
}

export default function RelatorioAluno() {
  const alunoId = Number(useParams().alunoId);
  const [parametros, setParametros] = useSearchParams();
  const numeroEscolhido = Number(parametros.get('bimestre')) || null;

  const { dados, carregando, atualizando, erro, recarregar } = useCarregar(
    () => carregar(alunoId, numeroEscolhido),
    `${alunoId}-${numeroEscolhido}`
  );

  const voltar = (
    <Link to="/responsavel" className="link-voltar"><ArrowLeft size={16} aria-hidden="true" /> Meus alunos</Link>
  );

  if (carregando || erro) {
    return <section>{voltar}<EstadoTela carregando={carregando} erro={erro} aoTentar={recarregar} /></section>;
  }

  const { aluno, bimestres, numero, relatorio } = dados;
  const nomeBimestre = bimestres.find((b) => b.numero === numero)?.nome ?? `${numero}º bimestre`;

  return (
    <section>
      {voltar}
      <h1 className="titulo-pagina">{aluno.nome}</h1>
      <p className="subtitulo-pagina">
        {aluno.turmaAtual?.nome ?? 'Sem turma'} · Ano letivo {ANO_LETIVO} · Matrícula {aluno.matricula}
      </p>

      <div className="abas" role="tablist" aria-label="Bimestres">
        {(bimestres.length ? bimestres : [1, 2, 3, 4].map((n) => ({ id: n, numero: n, nome: `${n}º bimestre` }))).map((b) => (
          <button key={b.id} type="button" role="tab" aria-selected={b.numero === numero}
            className={`aba ${b.numero === numero ? 'aba-ativa' : ''}`}
            onClick={() => setParametros({ bimestre: b.numero })}>
            {b.nome}
          </button>
        ))}
      </div>

      <div className={atualizando ? 'atualizando' : ''}>
        {!relatorio ? (
          <div className="cartao estado-vazio">
            <FileText size={28} strokeWidth={1.6} aria-hidden="true" />
            <p><strong>Nenhum relatório publicado no {nomeBimestre}.</strong></p>
            <p className="texto-pequeno">Quando a escola publicar o acompanhamento, ele aparecerá aqui.</p>
          </div>
        ) : (
          <Relatorio key={`${aluno.alunoId}-${numero}`} relatorio={relatorio} aoMudar={recarregar} />
        )}
      </div>
    </section>
  );
}

function Relatorio({ relatorio, aoMudar }) {
  const [baixando, setBaixando] = useState(false);
  const [erroPdf, setErroPdf] = useState('');
  const { aluno, bimestre, anoLetivo, disciplinas } = relatorio;

  const mediaGeral = disciplinas.reduce((soma, d) => soma + d.media, 0) / disciplinas.length;

  async function baixarPdf() {
    setErroPdf('');
    setBaixando(true);
    try {
      const arquivo = await api(
        `/responsavel/alunos/${aluno.id}/relatorio/pdf?anoLetivo=${anoLetivo}&bimestre=${bimestre.numero}`,
        { resposta: 'arquivo' }
      );
      baixarArquivo(arquivo, `relatorio-${aluno.nome.replace(/\s+/g, '-').toLowerCase()}-${bimestre.numero}bim-${anoLetivo}.pdf`);
    } catch (falha) {
      setErroPdf(falha.message);
    } finally {
      setBaixando(false);
    }
  }

  return (
    <>
      <div className="cartao barra-relatorio">
        <div>
          <p className="texto-suave texto-pequeno">{bimestre.nome} · {relatorio.turma}</p>
          <p><strong>{disciplinas.length}</strong> {disciplinas.length === 1 ? 'disciplina publicada' : 'disciplinas publicadas'}
            {' · '}média geral <strong>{formatarMedia(Math.round(mediaGeral * 10) / 10)}</strong></p>
        </div>
        <button type="button" className="botao botao-primario" onClick={baixarPdf} disabled={baixando}>
          <Download size={18} aria-hidden="true" /> {baixando ? 'Gerando PDF…' : 'Baixar PDF'}
        </button>
      </div>
      {erroPdf && <p className="mensagem-erro" role="alert">{erroPdf}</p>}

      <div className="grade-2 lista-disciplinas">
        {disciplinas.map((d) => (
          <article key={d.disciplina} className="cartao cartao-disciplina">
            <div className="cartao-topo">
              <div>
                <h2 className="disciplina-nome">{d.disciplina}</h2>
                <small className="texto-suave">Prof. {d.professor}</small>
              </div>
              <span className={`nota ${d.media < 6 ? 'nota-baixa' : ''}`} aria-label={`Média ${formatarMedia(d.media)}`}>
                {formatarMedia(d.media)}
              </span>
            </div>
            <p>{d.descricao}</p>
            {d.tags.length > 0 && (
              <div className="seletor-tags">
                {d.tags.map((t) => <span key={t.id} className="tag tag-marcada tag-leitura">{t.nome}</span>)}
              </div>
            )}
            <small className="texto-apagado">Publicado em {formatarDataAno(d.publicadoEm)}</small>
          </article>
        ))}
      </div>

      <Ciencia relatorio={relatorio} aoMudar={aoMudar} />
    </>
  );
}

// Registro de ciência: o responsável confirma que leu e pode deixar um retorno para a escola
function Ciencia({ relatorio, aoMudar }) {
  const [retorno, setRetorno] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { ciencia, aluno, anoLetivo, bimestre } = relatorio;

  async function registrar(evento) {
    evento.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await api(`/responsavel/alunos/${aluno.id}/ciencia`, {
        metodo: 'POST',
        corpo: { anoLetivo, bimestre: bimestre.numero, retorno: retorno.trim() || undefined }
      });
      aoMudar();
    } catch (falha) {
      setErro(falha.message);
      setEnviando(false);
    }
  }

  if (ciencia) {
    return (
      <div className="cartao ciencia ciencia-registrada">
        <CheckCircle2 size={22} className="icone-ok" aria-hidden="true" />
        <div>
          <strong>Ciência registrada em {formatarDataHoraAno(ciencia.registradaEm)}</strong>
          <p className="texto-suave">
            <MessageSquare size={14} aria-hidden="true" />{' '}
            {ciencia.retorno ? `Seu retorno: “${ciencia.retorno}”` : 'Sem comentário para a escola.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form className="cartao ciencia" onSubmit={registrar}>
      <h2 className="secao-titulo">Registrar ciência</h2>
      <p className="texto-suave">
        Confirme que você leu o relatório do {bimestre.nome}. Se quiser, deixe um recado para a escola e os professores.
      </p>
      <label className="campo">
        <span>Retorno para a escola (opcional)</span>
        <textarea rows={3} value={retorno} maxLength={LIMITE_RETORNO}
          placeholder="Ex.: Vamos reforçar a leitura em casa."
          onChange={(e) => setRetorno(e.target.value)} />
        <small className="contador">{retorno.length}/{LIMITE_RETORNO}</small>
      </label>
      {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
      <div className="acoes">
        <button type="submit" className="botao botao-primario" disabled={enviando}>
          <CheckCircle2 size={18} aria-hidden="true" /> {enviando ? 'Registrando…' : 'Registrar ciência'}
        </button>
      </div>
    </form>
  );
}