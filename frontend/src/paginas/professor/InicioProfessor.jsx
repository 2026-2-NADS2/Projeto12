import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, CalendarX, GraduationCap, LayoutGrid, MessageSquare } from 'lucide-react';
import { api } from '../../servicos/api';
import { useAuth } from '../../contexto/AuthContext';
import { useCarregar } from '../../ganchos/useCarregar';
import EstadoTela from '../../componentes/EstadoTela';
import Selo from '../../componentes/Selo';
import BarraProgresso from '../../componentes/BarraProgresso';
import CartaoNumero from '../../componentes/CartaoNumero';
import {
  ANO_LETIVO, NOME_DO_TURNO, bimestreAtual, diasAte, formatarDataAno, formatarDataHora, primeiroNome
} from '../../utils/formatar';

const STATUS = ['sem', 'rascunho', 'enviado', 'devolvido', 'publicado'];

// Conta quantos alunos estão em cada status (acompanhamento null = "sem lançamento")
function contarStatus(alunos) {
  const contagem = Object.fromEntries(STATUS.map((s) => [s, 0]));
  for (const { acompanhamento } of alunos) {
    contagem[acompanhamento?.status ?? 'sem'] += 1;
  }
  return contagem;
}

// "Enviados" = já saíram das mãos do professor (enviado ou publicado)
const enviados = (c) => c.enviado + c.publicado;

async function carregarPainel() {
  const [bimestres, vinculos, retornos] = await Promise.all([
    api(`/bimestres?anoLetivo=${ANO_LETIVO}`),
    api('/professor/turmas'),
    api(`/professor/retornos?anoLetivo=${ANO_LETIVO}`)
  ]);
  const atual = bimestreAtual(bimestres);

  // Para cada turma/disciplina, busca o painel de lançamento do bimestre da vez
  const turmas = atual
    ? await Promise.all(vinculos.map(async ({ turma, disciplina }) => {
        const painel = await api(`/professor/turmas/${turma.id}/disciplinas/${disciplina.id}/bimestres/${atual.numero}`);
        return { turma, disciplina, alunos: painel.alunos, contagem: contarStatus(painel.alunos) };
      }))
    : vinculos.map(({ turma, disciplina }) => ({ turma, disciplina, alunos: [], contagem: contarStatus([]) }));

  return { atual, turmas, retornos };
}

export default function InicioProfessor() {
  const { usuario } = useAuth();
  const { dados, carregando, erro, recarregar } = useCarregar(carregarPainel);

  return (
    <section>
      <h1 className="titulo-pagina">Olá, Professor(a) {primeiroNome(usuario.nome)}</h1>
      <p className="subtitulo-pagina">Resumo do ano letivo {ANO_LETIVO}</p>

      {carregando || erro
        ? <EstadoTela carregando={carregando} erro={erro} aoTentar={recarregar} />
        : <Painel dados={dados} />}
    </section>
  );
}

function Painel({ dados }) {
  const { atual, turmas, retornos } = dados;

  // Junta as contagens de todas as turmas/disciplinas
  const total = contarStatus(turmas.flatMap((t) => t.alunos));
  const totalAlunosLancamentos = turmas.reduce((soma, t) => soma + t.alunos.length, 0);
  const alunosDistintos = new Set(turmas.flatMap((t) => t.alunos.map((a) => a.aluno.id))).size;
  const turmasDistintas = new Set(turmas.map((t) => t.turma.id)).size;

  // Lista dos devolvidos, com a turma e a disciplina de cada um
  const devolvidos = turmas.flatMap((t) => t.alunos
    .filter((a) => a.acompanhamento?.status === 'devolvido')
    .map((a) => ({ ...a, turma: t.turma, disciplina: t.disciplina })));

  // Mostra primeiro os retornos com comentário escrito pela família
  const retornosRecentes = [...retornos].sort((a, b) => Boolean(b.retorno) - Boolean(a.retorno)).slice(0, 6);
  const linkLancamentos = (t) => `/professor/turmas/${t.turma.id}/disciplinas/${t.disciplina.id}`;

  return (
    <>
      <div className="grade-2">
        {/* Bimestre da vez */}
        <article className="cartao cartao-destaque">
          <div className="cartao-topo">
            <span className="icone-cartao"><CalendarCheck size={22} strokeWidth={1.6} aria-hidden="true" /></span>
            {atual && <Selo tipo={atual.situacao} />}
          </div>
          {atual ? (
            <>
              <p className="texto-suave">
                {atual.situacao === 'aberto' ? 'Bimestre aberto para digitação' : 'Nenhum bimestre aberto no momento'}
              </p>
              <p className="numero-grande">{atual.nome}</p>
              <p>
                Digitação até <strong>{formatarDataHora(atual.encerramento)}</strong>
                {atual.situacao === 'aberto' && (
                  <span className="texto-suave"> · faltam {diasAte(atual.encerramento)} dias</span>
                )}
              </p>
            </>
          ) : (
            <p className="texto-suave">A administração ainda não configurou os bimestres de {ANO_LETIVO}.</p>
          )}
          <div className="acoes">
            <Link to="/professor/turmas" className="botao botao-primario">
              Lançar acompanhamentos <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </article>

        {/* Andamento dos lançamentos */}
        <article className="cartao cartao-destaque">
          <div className="cartao-topo">
            <span className="icone-cartao"><LayoutGrid size={22} strokeWidth={1.6} aria-hidden="true" /></span>
            {atual && <span className="texto-suave texto-pequeno">{atual.nome}</span>}
          </div>
          <p className="texto-suave">Lançamentos enviados</p>
          <p className="numero-grande">
            {enviados(total)} <span className="numero-legenda">de {totalAlunosLancamentos} lançamentos</span>
          </p>
          <BarraProgresso valor={totalAlunosLancamentos ? (enviados(total) / totalAlunosLancamentos) * 100 : 0}
            rotulo="Lançamentos enviados" />
          <ul className="lista-selos">
            {STATUS.map((s) => (
              <li key={s}><Selo tipo={s} /> <strong>{total[s]}</strong></li>
            ))}
          </ul>
          <div className="acoes">
            <Link to="/professor/turmas" className="botao botao-secundario">Ver lançamentos</Link>
          </div>
        </article>
      </div>

      <div className="grade-3">
        <CartaoNumero icone={LayoutGrid} numero={turmasDistintas} legenda="Turmas" />
        <CartaoNumero icone={GraduationCap} numero={alunosDistintos} legenda="Alunos" />
        <CartaoNumero icone={CalendarX} numero={total.devolvido} legenda="Devolvidos" perigo />
      </div>

      <div className="grade-2">
        {/* Devolvidos pela administração */}
        <div>
          <div className="secao-cabecalho">
            <h2 className="secao-titulo">Precisam de ajuste</h2>
          </div>
          {devolvidos.length === 0 ? (
            <div className="cartao estado-vazio">
              <CalendarCheck size={28} strokeWidth={1.6} className="icone-sucesso" aria-hidden="true" />
              <p><strong>Nenhum acompanhamento devolvido.</strong></p>
              <p className="texto-pequeno">Quando a administração devolver um lançamento, ele aparece aqui com a observação.</p>
            </div>
          ) : (
            <ul className="lista-cartoes">
              {devolvidos.slice(0, 5).map((d) => (
                <li key={d.acompanhamento.id}>
                  <Link to={`${linkLancamentos(d)}?aluno=${d.aluno.id}`} className="cartao item-lista">
                    <div className="cartao-topo">
                      <strong>{d.aluno.nome}</strong>
                      <Selo tipo="devolvido" />
                    </div>
                    <small className="texto-suave">{d.turma.nome} – {d.disciplina.nome}</small>
                    <p className="observacao">“{d.acompanhamento.observacaoRevisao}”</p>
                  </Link>
                </li>
              ))}
              {devolvidos.length > 5 && (
                <li className="texto-suave texto-pequeno">e mais {devolvidos.length - 5} devolvidos…</li>
              )}
            </ul>
          )}
        </div>

        {/* Turmas e disciplinas do professor */}
        <div>
          <div className="secao-cabecalho">
            <h2 className="secao-titulo">Minhas turmas</h2>
            <Link to="/professor/turmas" className="link-pequeno">Ver todas</Link>
          </div>
          {turmas.length === 0 ? (
            <div className="cartao estado-vazio">Você ainda não está vinculado a nenhuma turma.</div>
          ) : (
            <ul className="lista-cartoes">
              {turmas.map((t) => (
                <li key={`${t.turma.id}-${t.disciplina.id}`}>
                  <Link to={linkLancamentos(t)} className="cartao item-lista">
                    <div className="cartao-topo">
                      <strong>{t.turma.nome} – {t.disciplina.nome}</strong>
                      <span className="texto-suave texto-pequeno sem-quebra">
                        <strong className="texto">{enviados(t.contagem)}</strong>/{t.alunos.length} enviados
                      </span>
                    </div>
                    <small className="texto-suave">{NOME_DO_TURNO[t.turma.turno]} – {t.turma.anoLetivo}</small>
                    <BarraProgresso valor={t.alunos.length ? (enviados(t.contagem) / t.alunos.length) * 100 : 0}
                      rotulo={`Enviados em ${t.turma.nome}`} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Retornos das famílias (ciência registrada pelos responsáveis) */}
      <div className="secao-cabecalho">
        <h2 className="secao-titulo">Retornos das famílias</h2>
      </div>
      {retornosRecentes.length === 0 ? (
        <div className="cartao estado-vazio">Nenhum responsável registrou ciência ainda.</div>
      ) : (
        <ul className="lista-cartoes grade-2">
          {retornosRecentes.map((r) => (
            <li key={r.id} className="cartao item-lista">
              <div className="cartao-topo">
                <strong>{r.aluno.nome}</strong>
                <span className="texto-suave texto-pequeno">{r.turma} · {r.bimestre}</span>
              </div>
              <small className="texto-suave">
                {r.responsavel} ({r.parentesco}) · {formatarDataAno(r.registradaEm)}
              </small>
              <p className="observacao">
                <MessageSquare size={14} aria-hidden="true" />{' '}
                {r.retorno ? `“${r.retorno}”` : 'Ciência registrada, sem comentário.'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}