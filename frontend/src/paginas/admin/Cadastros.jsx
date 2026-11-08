import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Ban, ChevronRight, Pencil, Plus, Search } from 'lucide-react';
import { api } from '../../servicos/api';
import { useCarregar } from '../../ganchos/useCarregar';
import EstadoTela from '../../componentes/EstadoTela';
import Modal from '../../componentes/Modal';
import Paginacao from '../../componentes/Paginacao';
import { ANO_LETIVO } from '../../utils/formatar';
import { CADASTROS } from './configCadastros';

const POR_PAGINA = 15;

export default function Cadastros() {
  const [parametros, setParametros] = useSearchParams();
  const aba = parametros.get('aba') ?? 'alunos';
  const config = CADASTROS.find((c) => c.aba === aba) ?? CADASTROS[0];

  return (
    <section>
      <h1 className="titulo-pagina">Cadastros</h1>
      <p className="subtitulo-pagina">Estrutura escolar do ano letivo {ANO_LETIVO}.</p>

      <div className="abas" role="tablist" aria-label="Cadastros">
        {CADASTROS.map((c) => (
          <button key={c.aba} type="button" role="tab" aria-selected={c.aba === config.aba}
            className={`aba ${c.aba === config.aba ? 'aba-ativa' : ''}`}
            onClick={() => setParametros({ aba: c.aba })}>
            {c.titulo}
          </button>
        ))}
      </div>

      {/* key: ao trocar de aba, a lista recomeça do zero (busca e página limpas) */}
      <ListaCadastro key={config.aba} config={config} />
    </section>
  );
}

function ListaCadastro({ config }) {
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [pagina, setPagina] = useState(1);
  const [editando, setEditando] = useState(null);   // null = fechado; {} = novo; item = edição
  const [inativando, setInativando] = useState(null);
  const [aviso, setAviso] = useState('');

  // Espera a pessoa parar de digitar (300 ms) antes de buscar, para não chamar a API a cada letra
  useEffect(() => {
    const espera = setTimeout(() => { setBuscaAplicada(busca.trim()); setPagina(1); }, 300);
    return () => clearTimeout(espera);
  }, [busca]);

  // Cadastros grandes são paginados e buscados na API; os pequenos vêm inteiros e são filtrados aqui
  const endereco = config.paginado
    ? `${config.endereco}?${new URLSearchParams({ pagina, porPagina: POR_PAGINA, ...(buscaAplicada && { busca: buscaAplicada }) })}`
    : config.enderecoLista ?? config.endereco;
  const lista = useCarregar(() => api(endereco), endereco);

  let itens = [];
  if (lista.dados) {
    itens = config.paginado ? lista.dados.itens : lista.dados.filter((i) =>
      i.nome.toLowerCase().includes(buscaAplicada.toLowerCase()));
  }

  function aoSalvar(mensagem) {
    setEditando(null);
    setAviso(mensagem);
    lista.recarregar();
  }

  async function confirmarInativar() {
    await api(`${config.endereco}/${inativando.id}`, { metodo: 'DELETE' });
    setAviso(`${inativando.nome} foi ${config.feminino ? 'inativada' : 'inativado'} e não aparece mais nas listas.`);
    setInativando(null);
    lista.recarregar();
  }

  return (
    <>
      <div className="barra-cadastro">
        <label className="campo-busca">
          <Search size={18} aria-hidden="true" />
          <input type="search" placeholder={`Buscar ${config.titulo.toLowerCase()}`} value={busca}
            onChange={(e) => setBusca(e.target.value)} aria-label={`Buscar ${config.titulo.toLowerCase()}`} />
        </label>
        <button type="button" className="botao botao-primario" onClick={() => { setAviso(''); setEditando({}); }}>
          <Plus size={18} aria-hidden="true" /> {config.feminino ? 'Nova' : 'Novo'} {config.singular}
        </button>
      </div>

      {aviso && <p className="mensagem-sucesso" role="status">{aviso}</p>}

      {lista.carregando || lista.erro ? (
        <EstadoTela carregando={lista.carregando} erro={lista.erro} aoTentar={lista.recarregar} />
      ) : itens.length === 0 ? (
        <div className="cartao estado-vazio">
          {buscaAplicada ? 'Nada encontrado com essa busca.' : `${config.feminino ? 'Nenhuma' : 'Nenhum'} ${config.singular} ${config.feminino ? 'cadastrada' : 'cadastrado'} ainda.`}
        </div>
      ) : (
        <>
          <div className={`cartao tabela-cartao ${lista.atualizando ? 'atualizando' : ''}`}>
            <table className="tabela">
              <thead>
                <tr>
                  {config.colunas.map((c, n) => (
                    <th key={c.rotulo} className={n > 0 ? 'so-tela-grande' : undefined}>{c.rotulo}</th>
                  ))}
                  <th className="celula-acao">Ações</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => (
                  <tr key={item.id}>
                    {config.colunas.map((c, n) => (
                      <td key={c.rotulo} className={n > 0 ? 'so-tela-grande texto-suave' : undefined}>
                        {c.destaque ? <strong>{c.valor(item)}</strong> : c.valor(item)}
                      </td>
                    ))}
                    <td className="celula-acao">
                      <div className="acoes-linha">
                        {config.detalhe && (
                          <Link to={config.detalhe.link(item)} className="botao botao-secundario botao-pequeno">
                            {config.detalhe.rotulo} <ChevronRight size={16} aria-hidden="true" />
                          </Link>
                        )}
                        <button type="button" className="botao-icone" title="Editar" aria-label={`Editar ${item.nome}`}
                          onClick={() => { setAviso(''); setEditando(item); }}>
                          <Pencil size={18} aria-hidden="true" />
                        </button>
                        <button type="button" className="botao-icone botao-icone-perigo" title="Inativar"
                          aria-label={`Inativar ${item.nome}`} onClick={() => { setAviso(''); setInativando(item); }}>
                          <Ban size={18} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {config.paginado && (
            <Paginacao pagina={lista.dados.pagina} totalPaginas={lista.dados.totalPaginas}
              total={lista.dados.total} aoMudar={setPagina} />
          )}
        </>
      )}

      {editando && (
        <FormularioCadastro config={config} item={editando.id ? editando : null}
          aoFechar={() => setEditando(null)} aoSalvar={aoSalvar} />
      )}
      {inativando && (
        <ConfirmarInativar item={inativando} singular={config.singular}
          aoConfirmar={confirmarInativar} aoFechar={() => setInativando(null)} />
      )}
    </>
  );
}

// Busca as opções dos campos de seleção que vêm da API (ex.: áreas para a disciplina)
async function carregarOpcoes(campos) {
  const resultado = {};
  await Promise.all(campos.filter((c) => c.opcoesDe).map(async (c) => {
    const lista = await api(c.opcoesDe);
    resultado[c.nome] = lista.map((o) => ({ valor: String(o.id), rotulo: o.nome }));
  }));
  return resultado;
}

function FormularioCadastro({ config, item, aoFechar, aoSalvar }) {
  const novo = !item;
  const campos = config.campos.filter((c) => novo || !c.somenteNovo); // senha só no cadastro novo
  const [valores, setValores] = useState(() => {
    const base = item ? (config.paraFormulario?.(item) ?? item) : {};
    return Object.fromEntries(campos.map((c) => [c.nome, base[c.nome] ?? c.padrao ?? '']));
  });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const opcoes = useCarregar(() => carregarOpcoes(campos), config.aba);

  async function salvar(evento) {
    evento.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      const limpos = Object.fromEntries(Object.entries(valores).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]));
      const corpo = config.paraCorpo ? config.paraCorpo(limpos) : limpos;
      if (novo) {
        await api(config.endereco, { metodo: 'POST', corpo });
      } else {
        await api(`${config.endereco}/${item.id}`, { metodo: 'PUT', corpo });
      }
      const nome = `${config.singular[0].toUpperCase()}${config.singular.slice(1)}`;
      aoSalvar(novo ? `${nome} ${config.feminino ? 'cadastrada' : 'cadastrado'} com sucesso.` : 'Alterações salvas.');
    } catch (falha) {
      setErro(falha.message);
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={novo ? `${config.feminino ? 'Nova' : 'Novo'} ${config.singular}` : `Editar ${config.singular}`} aoFechar={aoFechar}>
      <form className="formulario" onSubmit={salvar}>
        {campos.map((c, n) => (
          <label key={c.nome} className="campo">
            <span>{c.rotulo}</span>
            {c.tipo === 'select' ? (
              <select value={valores[c.nome]} required={c.obrigatorio} autoFocus={n === 0}
                onChange={(e) => setValores({ ...valores, [c.nome]: e.target.value })}>
                <option value="">Selecione…</option>
                {(c.opcoes ?? opcoes.dados?.[c.nome] ?? []).map((o) => (
                  <option key={o.valor} value={o.valor}>{o.rotulo}</option>
                ))}
              </select>
            ) : (
              <input type={c.tipo ?? 'text'} value={valores[c.nome]} required={c.obrigatorio}
                placeholder={c.exemplo} autoFocus={n === 0}
                autoComplete={c.tipo === 'password' ? 'new-password' : 'off'}
                onChange={(e) => setValores({ ...valores, [c.nome]: e.target.value })} />
            )}
            {c.dica && <small className="dica">{c.dica}</small>}
          </label>
        ))}
        {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
        <div className="acoes acoes-direita">
          <button type="button" className="botao botao-secundario" onClick={aoFechar}>Cancelar</button>
          <button type="submit" className="botao botao-primario" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ConfirmarInativar({ item, singular, aoConfirmar, aoFechar }) {
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function confirmar() {
    setEnviando(true);
    try {
      await aoConfirmar();
    } catch (falha) {
      setErro(falha.message);
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={`Inativar ${singular}`} aoFechar={aoFechar}>
      <div className="formulario">
        <p>
          Inativar <strong>{item.nome}</strong>? O registro deixa de aparecer nas listas, mas o histórico
          continua guardado (exclusão lógica).
        </p>
        {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
        <div className="acoes acoes-direita">
          <button type="button" className="botao botao-secundario" onClick={aoFechar}>Cancelar</button>
          <button type="button" className="botao botao-perigo" onClick={confirmar} disabled={enviando}>
            {enviando ? 'Inativando…' : 'Inativar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}