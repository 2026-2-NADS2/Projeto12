import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, FileSpreadsheet, MessageSquare, Tags } from 'lucide-react';
import { api } from '../../servicos/api';
import { useCarregar } from '../../ganchos/useCarregar';
import EstadoTela from '../../componentes/EstadoTela';
import Selo from '../../componentes/Selo';
import { ANO_LETIVO, formatarDataAno } from '../../utils/formatar';
import { formatarMedia } from '../../utils/media';
import { baixarArquivo } from '../../utils/baixarArquivo';

const AGRUPAMENTOS = [
  { valor: 'turma', rotulo: 'Turma' },
  { valor: 'disciplina', rotulo: 'Disciplina' },
  { valor: 'professor', rotulo: 'Professor' },
  { valor: 'bimestre', rotulo: 'Bimestre' },
  { valor: 'aluno', rotulo: 'Aluno' }
];
const STATUS = ['rascunho', 'enviado', 'devolvido', 'publicado'];

async function carregarOpcoes() {
  const [turmas, disciplinas] = await Promise.all([api(`/turmas?anoLetivo=${ANO_LETIVO}`), api('/disciplinas')]);
  return { turmas, disciplinas };
}

// Todos os quadros do relatório, com os mesmos filtros (as chamadas correm em paralelo)
async function carregarRelatorios(consulta, agrupar) {
  const semStatus = new URLSearchParams(consulta);
  semStatus.delete('status'); // a contagem por situação mostra todas as situações
  const [status, medias, tags, retornos] = await Promise.all([
    api(`/relatorios/status?${semStatus}`),
    api(`/relatorios/medias?${consulta}&agrupar=${agrupar}`),
    api(`/relatorios/tags?${consulta}`),
    api(`/relatorios/retornos?${consulta}`)
  ]);
  return { status, medias, tags, retornos };
}

export default function RelatoriosAdmin() {
  const [parametros, setParametros] = useSearchParams();
  const filtros = {
    bimestre: parametros.get('bimestre') ?? '',
    turmaId: parametros.get('turmaId') ?? '',
    disciplinaId: parametros.get('disciplinaId') ?? '',
    status: parametros.get('status') ?? 'publicado'
  };
  const agrupar = parametros.get('agrupar') ?? 'turma';

  function mudar(nome, valor) {
    const novos = { ...filtros, agrupar, [nome]: valor };
    setParametros(Object.fromEntries(Object.entries(novos).filter(([, v]) => v !== '')));
  }

  // Monta "anoLetivo=2026&bimestre=3&..." só com os filtros preenchidos
  const consulta = new URLSearchParams({ anoLetivo: ANO_LETIVO });
  Object.entries(filtros).forEach(([nome, valor]) => { if (valor) consulta.set(nome, valor); });

  const opcoes = useCarregar(carregarOpcoes);
  const relatorios = useCarregar(() => carregarRelatorios(consulta.toString(), agrupar), `${consulta}&${agrupar}`);

  return (
    <section>
      <div className="cabecalho-pagina">
        <div>
          <h1 className="titulo-pagina">Relatórios</h1>
          <p className="subtitulo-pagina">Indicadores do ano letivo {ANO_LETIVO} e exportação dos acompanhamentos.</p>
        </div>
        <Exportar consulta={consulta.toString()} />
      </div>

      <div className="barra-filtros">
        <label className="campo">
          <span>Bimestre</span>
          <select value={filtros.bimestre} onChange={(e) => mudar('bimestre', e.target.value)}>
            <option value="">Todos</option>
            {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}º bimestre</option>)}
          </select>
        </label>
        <label className="campo">
          <span>Turma</span>
          <select value={filtros.turmaId} onChange={(e) => mudar('turmaId', e.target.value)}>
            <option value="">Todas</option>
            {opcoes.dados?.turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </label>
        <label className="campo">
          <span>Disciplina</span>
          <select value={filtros.disciplinaId} onChange={(e) => mudar('disciplinaId', e.target.value)}>
            <option value="">Todas</option>
            {opcoes.dados?.disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>
        </label>
        <label className="campo">
          <span>Situação</span>
          <select value={filtros.status} onChange={(e) => mudar('status', e.target.value)}>
            <option value="publicado">Somente publicados</option>
            <option value="todos">Todas as situações</option>
            <option value="enviado">Enviados</option>
            <option value="devolvido">Devolvidos</option>
            <option value="rascunho">Rascunhos</option>
          </select>
        </label>
      </div>

      {relatorios.carregando || relatorios.erro ? (
        <EstadoTela carregando={relatorios.carregando} erro={relatorios.erro} aoTentar={relatorios.recarregar} />
      ) : (
        <div className={relatorios.atualizando ? 'atualizando' : ''}>
          <Quadros dados={relatorios.dados} agrupar={agrupar} aoAgrupar={(valor) => mudar('agrupar', valor)} />
        </div>
      )}
    </section>
  );
}

function Quadros({ dados, agrupar, aoAgrupar }) {
  const { status, medias, tags, retornos } = dados;
  const totalStatus = STATUS.reduce((soma, s) => soma + status[s], 0);
  const maiorUsoTag = Math.max(1, ...tags.map((t) => t.acompanhamentos));
  const retornosComTexto = retornos.filter((r) => r.retorno);

  return (
    <>
      {/* Contagem por situação */}
      <div className="grade-4">
        {STATUS.map((s) => (
          <div key={s} className="cartao cartao-status">
            <Selo tipo={s} />
            <strong>{status[s]}</strong>
            <small className="texto-suave">
              {totalStatus ? Math.round((status[s] / totalStatus) * 100) : 0}% dos acompanhamentos
            </small>
          </div>
        ))}
      </div>

      {/* Médias agrupadas */}
      <div className="cartao quadro">
        <div className="cartao-topo">
          <h2 className="quadro-titulo">Médias por</h2>
          <div className="filtros">
            {AGRUPAMENTOS.map((a) => (
              <button key={a.valor} type="button" className={`filtro ${agrupar === a.valor ? 'filtro-ativo' : ''}`}
                onClick={() => aoAgrupar(a.valor)}>
                {a.rotulo}
              </button>
            ))}
          </div>
        </div>
        {medias.length === 0 ? (
          <p className="texto-suave">Nenhum acompanhamento com esses filtros.</p>
        ) : (
          <div className="tabela-rolagem">
            <table className="tabela">
              <thead>
                <tr>
                  <th>{AGRUPAMENTOS.find((a) => a.valor === agrupar)?.rotulo}</th>
                  <th className="coluna-barra">Média</th>
                  <th className="so-tela-grande">Menor</th>
                  <th className="so-tela-grande">Maior</th>
                  <th className="so-tela-grande">Lançamentos</th>
                </tr>
              </thead>
              <tbody>
                {medias.map((m) => (
                  <tr key={m.id}>
                    <td><strong>{m.nome}</strong></td>
                    <td className="coluna-barra">
                      <span className="barra-media">
                        <span className={`barra-media-valor ${m.media < 6 ? 'barra-baixa' : ''}`}
                          style={{ width: `${m.media * 10}%` }} />
                      </span>
                      <span className="valor-media">{formatarMedia(m.media)}</span>
                    </td>
                    <td className="so-tela-grande texto-suave">{formatarMedia(m.menor)}</td>
                    <td className="so-tela-grande texto-suave">{formatarMedia(m.maior)}</td>
                    <td className="so-tela-grande texto-suave">{m.quantidade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grade-2">
        {/* Tags mais usadas */}
        <div className="cartao quadro">
          <h2 className="quadro-titulo"><Tags size={18} aria-hidden="true" /> Tags mais usadas</h2>
          {tags.length === 0 ? (
            <p className="texto-suave">Nenhuma tag usada com esses filtros.</p>
          ) : (
            <ul className="lista-barras">
              {tags.map((t) => (
                <li key={t.id}>
                  <div className="cartao-topo">
                    <span>{t.nome}</span>
                    <small className="texto-suave">
                      {t.acompanhamentos} usos · {t.alunos} alunos · média {formatarMedia(t.media)}
                    </small>
                  </div>
                  <span className="barra-media">
                    <span className="barra-media-valor" style={{ width: `${(t.acompanhamentos / maiorUsoTag) * 100}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Retornos dos responsáveis */}
        <div className="cartao quadro">
          <h2 className="quadro-titulo"><MessageSquare size={18} aria-hidden="true" /> Retornos dos responsáveis</h2>
          <p className="texto-suave texto-pequeno">
            {retornos.length} ciências registradas · {retornosComTexto.length} com comentário
          </p>
          {retornosComTexto.length === 0 ? (
            <p className="texto-suave">Nenhum comentário dos responsáveis com esses filtros.</p>
          ) : (
            <ul className="lista-retornos">
              {retornosComTexto.slice(0, 8).map((r) => (
                <li key={r.id}>
                  <strong>{r.aluno.nome}</strong>
                  <small className="texto-suave">
                    {r.responsavel} ({r.parentesco}) · {r.turma} · {r.bimestre} · {formatarDataAno(r.registradaEm)}
                  </small>
                  <p className="observacao">“{r.retorno}”</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

// Botões de exportação: baixam a planilha com os mesmos filtros da tela
function Exportar({ consulta }) {
  const [baixando, setBaixando] = useState('');
  const [erro, setErro] = useState('');

  async function exportar(formato) {
    setErro('');
    setBaixando(formato);
    try {
      const arquivo = await api(`/relatorios/exportar?${consulta}&formato=${formato}`, { resposta: 'arquivo' });
      baixarArquivo(arquivo, `acompanhamentos-${ANO_LETIVO}.${formato}`);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setBaixando('');
    }
  }

  return (
    <div className="exportar">
      <div className="acoes">
        <button type="button" className="botao botao-primario" disabled={Boolean(baixando)} onClick={() => exportar('xlsx')}>
          <FileSpreadsheet size={18} aria-hidden="true" /> {baixando === 'xlsx' ? 'Gerando…' : 'Exportar Excel'}
        </button>
        <button type="button" className="botao botao-secundario" disabled={Boolean(baixando)} onClick={() => exportar('csv')}>
          <Download size={18} aria-hidden="true" /> {baixando === 'csv' ? 'Gerando…' : 'CSV'}
        </button>
      </div>
      {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
    </div>
  );
}