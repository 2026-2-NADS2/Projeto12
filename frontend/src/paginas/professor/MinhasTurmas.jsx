import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, LayoutGrid } from 'lucide-react';
import { api } from '../../servicos/api';
import { useAuth } from '../../contexto/AuthContext';
import { useCarregar } from '../../ganchos/useCarregar';
import EstadoTela from '../../componentes/EstadoTela';
import { ANO_LETIVO, NOME_DO_TURNO, bimestreAtual, formatarDataHoraAno, primeiroNome } from '../../utils/formatar';

async function carregar() {
  const [vinculos, bimestres] = await Promise.all([
    api('/professor/turmas'),
    api(`/bimestres?anoLetivo=${ANO_LETIVO}`)
  ]);
  return { vinculos, atual: bimestreAtual(bimestres) };
}

export default function MinhasTurmas() {
  const { usuario } = useAuth();
  const { dados, carregando, erro, recarregar } = useCarregar(carregar);

  return (
    <section>
      <h1 className="titulo-pagina">Minhas turmas</h1>
      <p className="subtitulo-pagina">Olá, {primeiroNome(usuario.nome)}. Ano letivo {ANO_LETIVO}.</p>

      {carregando || erro ? (
        <EstadoTela carregando={carregando} erro={erro} aoTentar={recarregar} />
      ) : (
        <>
          {dados.atual && (
            <p className={`aviso ${dados.atual.situacao === 'aberto' ? '' : 'aviso-neutro'}`}>
              <CalendarCheck size={20} aria-hidden="true" />
              {dados.atual.situacao === 'aberto' ? (
                <span>
                  <strong>{dados.atual.nome} aberto</strong> para digitação até{' '}
                  <strong>{formatarDataHoraAno(dados.atual.encerramento)}</strong>.
                </span>
              ) : (
                <span>Nenhum bimestre aberto para digitação no momento. Você ainda pode consultar os lançamentos.</span>
              )}
            </p>
          )}

          {dados.vinculos.length === 0 ? (
            <div className="cartao estado-vazio">
              Você ainda não está vinculado a nenhuma turma. Fale com a administração da escola.
            </div>
          ) : (
            <div className="grade-3">
              {dados.vinculos.map(({ turma, disciplina }) => (
                <Link key={`${turma.id}-${disciplina.id}`} className="cartao cartao-turma"
                  to={`/professor/turmas/${turma.id}/disciplinas/${disciplina.id}`}>
                  <span className="icone-cartao"><LayoutGrid size={22} strokeWidth={1.6} aria-hidden="true" /></span>
                  <strong>{turma.nome} – {disciplina.nome}</strong>
                  <small className="texto-suave">{NOME_DO_TURNO[turma.turno]} – {turma.anoLetivo}</small>
                  <span className="link-acao">Abrir painel de lançamento <ArrowRight size={16} aria-hidden="true" /></span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}