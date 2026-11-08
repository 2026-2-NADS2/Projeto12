import { Link } from 'react-router-dom';
import {
  CalendarCheck, CalendarRange, GraduationCap, LayoutGrid, Contact, ArrowRight, ClipboardCheck
} from 'lucide-react';
import { api } from '../../servicos/api';
import { useAuth } from '../../contexto/AuthContext';
import { useCarregar } from '../../ganchos/useCarregar';
import EstadoTela from '../../componentes/EstadoTela';
import Selo from '../../componentes/Selo';
import BarraProgresso from '../../componentes/BarraProgresso';
import CartaoNumero from '../../componentes/CartaoNumero';
import {
  ANO_LETIVO, bimestreAtual, diasAte, formatarData, formatarDataHora, primeiroNome, progressoDoPeriodo
} from '../../utils/formatar';

// Busca tudo o que o painel precisa de uma vez (as chamadas correm em paralelo)
async function carregarPainel() {
  const [bimestres, status, alunos, professores, turmas] = await Promise.all([
    api(`/bimestres?anoLetivo=${ANO_LETIVO}`),
    api(`/relatorios/status?anoLetivo=${ANO_LETIVO}`),
    api('/alunos?porPagina=1'),       // só precisamos do "total" da paginação
    api('/professores?porPagina=1'),
    api(`/turmas?anoLetivo=${ANO_LETIVO}`)
  ]);
  return {
    bimestres,
    status,
    totalAlunos: alunos.total,
    totalProfessores: professores.total,
    totalTurmas: turmas.length
  };
}

const ATALHOS = [
  { rota: '/admin/revisao', titulo: 'Revisão', texto: 'Revisar, devolver ou publicar acompanhamentos', icone: ClipboardCheck },
  { rota: '/admin/cadastros?aba=turmas', titulo: 'Turmas', texto: 'Alunos, disciplinas e professores de cada turma', icone: LayoutGrid },
  { rota: '/admin/bimestres', titulo: 'Bimestres', texto: 'Período de digitação dos quatro bimestres', icone: CalendarRange }
];

export default function InicioAdmin() {
  const { usuario } = useAuth();
  const { dados, carregando, erro, recarregar } = useCarregar(carregarPainel);

  return (
    <section>
      <h1 className="titulo-pagina">Olá, {primeiroNome(usuario.nome)}</h1>
      <p className="subtitulo-pagina">Resumo do ano letivo {ANO_LETIVO}</p>

      {carregando || erro
        ? <EstadoTela carregando={carregando} erro={erro} aoTentar={recarregar} />
        : <Painel dados={dados} />}
    </section>
  );
}

function Painel({ dados }) {
  const { bimestres, status, totalAlunos, totalProfessores, totalTurmas } = dados;
  const atual = bimestreAtual(bimestres);

  return (
    <>
      <div className="grade-2">
        {/* Fila de revisão */}
        <article className="cartao cartao-destaque">
          <div className="cartao-topo">
            <span className="icone-cartao"><ClipboardCheck size={22} strokeWidth={1.6} aria-hidden="true" /></span>
            <Selo tipo="enviado" />
          </div>
          <p className="texto-suave">Acompanhamentos aguardando revisão</p>
          <p className="numero-grande">{status.enviado}</p>
          <p className="texto-suave texto-pequeno">
            {status.devolvido} devolvidos aguardando ajuste do professor · {status.rascunho} rascunhos em andamento
          </p>
          <div className="acoes">
            <Link to="/admin/revisao" className="botao botao-primario">
              Revisar acompanhamentos <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </article>

        {/* Bimestre da vez */}
        <article className="cartao cartao-destaque">
          <div className="cartao-topo">
            <span className="icone-cartao"><CalendarCheck size={22} strokeWidth={1.6} aria-hidden="true" /></span>
            {atual && <Selo tipo={atual.situacao} />}
          </div>
          {atual ? (
            <>
              <p className="texto-suave texto-pequeno">
                {atual.situacao === 'aberto' ? 'Bimestre aberto' : 'Último bimestre'}
              </p>
              <p className="numero-grande">{atual.nome}</p>
              <p>
                Digitação até <strong>{formatarDataHora(atual.encerramento)}</strong>
                {atual.situacao === 'aberto' && (
                  <span className="texto-suave"> · faltam {diasAte(atual.encerramento)} dias</span>
                )}
              </p>
              <BarraProgresso valor={progressoDoPeriodo(atual.abertura, atual.encerramento)}
                rotulo="Quanto do período de digitação já passou" />
            </>
          ) : (
            <p className="texto-suave">Nenhum bimestre configurado para {ANO_LETIVO}.</p>
          )}
          <div className="acoes">
            <Link to="/admin/bimestres" className="botao botao-secundario">Ver bimestres</Link>
          </div>
        </article>
      </div>

      <div className="grade-3">
        <CartaoNumero icone={GraduationCap} numero={totalAlunos} legenda="Alunos" />
        <CartaoNumero icone={LayoutGrid} numero={totalTurmas} legenda="Turmas" />
        <CartaoNumero icone={Contact} numero={totalProfessores} legenda="Professores" />
      </div>

      <h2 className="secao-titulo">Atalhos</h2>
      <div className="grade-3">
        {ATALHOS.map(({ rota, titulo, texto, icone: Icone }) => (
          <Link key={rota} to={rota} className="cartao atalho">
            <Icone size={26} strokeWidth={1.6} className="atalho-icone" aria-hidden="true" />
            <span>
              <strong>{titulo}</strong>
              <small className="texto-suave">{texto}</small>
            </span>
            <ArrowRight size={20} className="atalho-seta" aria-hidden="true" />
          </Link>
        ))}
      </div>

      <h2 className="secao-titulo">Bimestres de {ANO_LETIVO}</h2>
      <div className="grade-4">
        {bimestres.map((b) => (
          <div key={b.id} className="cartao cartao-bimestre">
            <div className="cartao-topo">
              <strong>{b.nome}</strong>
              <Selo tipo={b.situacao} />
            </div>
            <p className="texto-suave texto-pequeno">
              {formatarData(b.abertura)} a {formatarData(b.encerramento)}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}