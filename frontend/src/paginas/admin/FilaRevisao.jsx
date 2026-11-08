import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { api } from '../../servicos/api';
import { useCarregar } from '../../ganchos/useCarregar';
import EstadoTela from '../../componentes/EstadoTela';
import Selo from '../../componentes/Selo';
import Paginacao from '../../componentes/Paginacao';
import { ANO_LETIVO, formatarDataHoraAno } from '../../utils/formatar';
import { formatarMedia } from '../../utils/media';

const ABAS = [
  { status: 'enviado', rotulo: 'Aguardando revisão' },
  { status: 'devolvido', rotulo: 'Devolvidos' },
  { status: 'publicado', rotulo: 'Publicados' },
  { status: 'rascunho', rotulo: 'Rascunhos' }
];
const POR_PAGINA = 15;

// Listas usadas nos filtros (turmas e disciplinas)
async function carregarOpcoes() {
  const [turmas, disciplinas] = await Promise.all([
    api(`/turmas?anoLetivo=${ANO_LETIVO}`),
    api('/disciplinas')
  ]);
  return { turmas, disciplinas };
}

export default function FilaRevisao() {
  // Os filtros ficam no endereço (?status=...&bimestre=...): ao voltar da revisão, a fila continua igual
  const [parametros, setParametros] = useSearchParams();
  const local = useLocation();
  const filtros = {
    status: parametros.get('status') ?? 'enviado',
    bimestre: parametros.get('bimestre') ?? '',
    turmaId: parametros.get('turmaId') ?? '',
    disciplinaId: parametros.get('disciplinaId') ?? '',
    pagina: Number(parametros.get('pagina')) || 1
  };

  function mudarFiltro(nome, valor) {
    const novos = { ...filtros, [nome]: valor };
    if (nome !== 'pagina') novos.pagina = 1; // trocar filtro volta para a primeira página
    // Só vão para o endereço os filtros preenchidos
    setParametros(Object.fromEntries(Object.entries(novos).filter(([, v]) => v !== '' && v !== null)));
  }

  const opcoes = useCarregar(carregarOpcoes);
  const consulta = new URLSearchParams({ anoLetivo: ANO_LETIVO, porPagina: POR_PAGINA });
  Object.entries(filtros).forEach(([nome, valor]) => { if (valor) consulta.set(nome, valor); });
  const fila = useCarregar(() => api(`/revisao/acompanhamentos?${consulta}`), consulta.toString());

  return (
    <section>
      <h1 className="titulo-pagina">Revisão</h1>
      <p className="subtitulo-pagina">Revise, altere, devolva ou publique os acompanhamentos enviados pelos professores.</p>

      <div className="abas" role="tablist" aria-label="Situação">
        {ABAS.map((aba) => (
          <button key={aba.status} type="button" role="tab" aria-selected={filtros.status === aba.status}
            className={`aba ${filtros.status === aba.status ? 'aba-ativa' : ''}`}
            onClick={() => mudarFiltro('status', aba.status)}>
            {aba.rotulo}
          </button>
        ))}
      </div>

      <div className="barra-filtros">
        <label className="campo">
          <span>Bimestre</span>
          <select value={filtros.bimestre} onChange={(e) => mudarFiltro('bimestre', e.target.value)}>
            <option value="">Todos</option>
            {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}º bimestre</option>)}
          </select>
        </label>
        <label className="campo">
          <span>Turma</span>
          <select value={filtros.turmaId} onChange={(e) => mudarFiltro('turmaId', e.target.value)}>
            <option value="">Todas</option>
            {opcoes.dados?.turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </label>
        <label className="campo">
          <span>Disciplina</span>
          <select value={filtros.disciplinaId} onChange={(e) => mudarFiltro('disciplinaId', e.target.value)}>
            <option value="">Todas</option>
            {opcoes.dados?.disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>
        </label>
      </div>

      {fila.carregando || fila.erro ? (
        <EstadoTela carregando={fila.carregando} erro={fila.erro} aoTentar={fila.recarregar} />
      ) : fila.dados.itens.length === 0 ? (
        <div className="cartao estado-vazio">Nenhum acompanhamento encontrado com esses filtros.</div>
      ) : (
        <>
          <div className={`cartao tabela-cartao ${fila.atualizando ? 'atualizando' : ''}`}>
            <table className="tabela">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Turma · Disciplina</th>
                  <th className="so-tela-grande">Professor</th>
                  <th className="so-tela-grande">Bimestre</th>
                  <th>Média</th>
                  <th className="so-tela-grande">Atualizado</th>
                  <th><span className="menu-rotulo">Ação</span></th>
                </tr>
              </thead>
              <tbody>
                {fila.dados.itens.map((item) => (
                  <tr key={item.acompanhamento.id}>
                    <td><strong>{item.aluno.nome}</strong></td>
                    <td>{item.turma.nome} · {item.disciplina.nome}</td>
                    <td className="so-tela-grande texto-suave">{item.professor.nome}</td>
                    <td className="so-tela-grande">{item.bimestre.nome}</td>
                    <td>{formatarMedia(item.acompanhamento.media)}</td>
                    <td className="so-tela-grande texto-suave texto-pequeno">
                      {formatarDataHoraAno(item.acompanhamento.atualizadoEm)}
                    </td>
                    <td className="celula-acao">
                      <Link to={`/admin/revisao/${item.acompanhamento.id}`} state={{ fila: local.search }}
                        className={`botao botao-pequeno ${item.acompanhamento.status === 'enviado' ? 'botao-primario' : 'botao-secundario'}`}>
                        {item.acompanhamento.status === 'enviado' ? 'Revisar' : 'Ver'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacao pagina={fila.dados.pagina} totalPaginas={fila.dados.totalPaginas}
            total={fila.dados.total} aoMudar={(p) => mudarFiltro('pagina', p)} />
        </>
      )}

      {filtros.status !== 'enviado' && (
        <p className="texto-suave texto-pequeno legenda-fila">
          <Selo tipo={filtros.status} /> Somente os acompanhamentos <strong>enviados</strong> podem ser alterados, devolvidos ou publicados.
        </p>
      )}
    </section>
  );
}