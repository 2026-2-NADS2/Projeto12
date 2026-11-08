import { useState } from 'react';
import { CalendarClock, Pencil } from 'lucide-react';
import { api } from '../../servicos/api';
import { useCarregar } from '../../ganchos/useCarregar';
import EstadoTela from '../../componentes/EstadoTela';
import Selo from '../../componentes/Selo';
import Modal from '../../componentes/Modal';
import { ANO_LETIVO, formatarDataHoraAno } from '../../utils/formatar';

// Converte a data da API (UTC) para o formato do campo datetime-local no horário de Brasília: "2026-10-05T07:00"
function paraCampoLocal(iso) {
  if (!iso) return '';
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date(iso)).map((p) => [p.type, p.value])
  );
  return `${partes.year}-${partes.month}-${partes.day}T${partes.hour}:${partes.minute}`;
}

export default function BimestresAdmin() {
  const { dados, carregando, erro, recarregar } = useCarregar(() => api(`/bimestres?anoLetivo=${ANO_LETIVO}`));
  const [editando, setEditando] = useState(null);
  const [aviso, setAviso] = useState('');

  // Sempre mostra os 4 cartões, mesmo que algum bimestre ainda não tenha sido configurado
  const cartoes = [1, 2, 3, 4].map((numero) =>
    dados?.find((b) => b.numero === numero) ?? { numero, nome: `${numero}º bimestre`, naoConfigurado: true });

  return (
    <section>
      <h1 className="titulo-pagina">Bimestres</h1>
      <p className="subtitulo-pagina">
        Período de digitação dos acompanhamentos de {ANO_LETIVO} (horário de Brasília). Fora do período, o professor só consulta.
      </p>

      {aviso && <p className="mensagem-sucesso" role="status">{aviso}</p>}

      {carregando || erro ? (
        <EstadoTela carregando={carregando} erro={erro} aoTentar={recarregar} />
      ) : (
        <div className="grade-2">
          {cartoes.map((b) => (
            <article key={b.numero} className="cartao cartao-destaque">
              <div className="cartao-topo">
                <h2 className="disciplina-nome">{b.nome}</h2>
                {b.naoConfigurado ? <Selo tipo="sem">Não configurado</Selo> : <Selo tipo={b.situacao} />}
              </div>
              <div className="periodo">
                <div>
                  <small className="texto-suave">Abertura</small>
                  <strong>{b.naoConfigurado ? '—' : formatarDataHoraAno(b.abertura)}</strong>
                </div>
                <div>
                  <small className="texto-suave">Encerramento</small>
                  <strong>{b.naoConfigurado ? '—' : formatarDataHoraAno(b.encerramento)}</strong>
                </div>
              </div>
              <div className="acoes acoes-direita">
                <button type="button" className="botao botao-primario botao-pequeno"
                  onClick={() => { setAviso(''); setEditando(b); }}>
                  {b.naoConfigurado
                    ? <><CalendarClock size={16} aria-hidden="true" /> Definir período</>
                    : <><Pencil size={16} aria-hidden="true" /> Editar período</>}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editando && (
        <EditarPeriodo bimestre={editando} aoFechar={() => setEditando(null)}
          aoSalvar={() => { setAviso(`Período do ${editando.nome} salvo.`); setEditando(null); recarregar(); }} />
      )}
    </section>
  );
}

function EditarPeriodo({ bimestre, aoFechar, aoSalvar }) {
  const [abertura, setAbertura] = useState(paraCampoLocal(bimestre.abertura));
  const [encerramento, setEncerramento] = useState(paraCampoLocal(bimestre.encerramento));
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function salvar(evento) {
    evento.preventDefault();
    setErro('');
    if (abertura && encerramento && encerramento <= abertura) {
      setErro('O encerramento deve ser depois da abertura.');
      return;
    }
    setSalvando(true);
    try {
      await api(`/bimestres/${ANO_LETIVO}/${bimestre.numero}`, { metodo: 'PUT', corpo: { abertura, encerramento } });
      aoSalvar();
    } catch (falha) {
      setErro(falha.message);
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={`Período do ${bimestre.nome}`} aoFechar={aoFechar}>
      <form className="formulario" onSubmit={salvar}>
        <label className="campo">
          <span>Abertura da digitação</span>
          <input type="datetime-local" value={abertura} required autoFocus onChange={(e) => setAbertura(e.target.value)} />
        </label>
        <label className="campo">
          <span>Encerramento da digitação</span>
          <input type="datetime-local" value={encerramento} required onChange={(e) => setEncerramento(e.target.value)} />
        </label>
        <small className="dica">Os períodos dos quatro bimestres não podem se sobrepor.</small>
        {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
        <div className="acoes acoes-direita">
          <button type="button" className="botao botao-secundario" onClick={aoFechar}>Cancelar</button>
          <button type="submit" className="botao botao-primario" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar período'}
          </button>
        </div>
      </form>
    </Modal>
  );
}