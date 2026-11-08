import { ChevronLeft, ChevronRight } from 'lucide-react';

// Navegação entre páginas de uma lista paginada pela API
// (a API devolve { itens, pagina, totalPaginas, total })
export default function Paginacao({ pagina, totalPaginas, total, aoMudar }) {
  if (totalPaginas <= 1) {
    return <p className="paginacao texto-suave texto-pequeno">{total} {total === 1 ? 'registro' : 'registros'}</p>;
  }
  return (
    <nav className="paginacao" aria-label="Paginação">
      <button type="button" className="botao botao-secundario botao-pequeno"
        disabled={pagina <= 1} onClick={() => aoMudar(pagina - 1)}>
        <ChevronLeft size={16} aria-hidden="true" /> Anterior
      </button>
      <span className="texto-suave texto-pequeno">Página {pagina} de {totalPaginas} · {total} registros</span>
      <button type="button" className="botao botao-secundario botao-pequeno"
        disabled={pagina >= totalPaginas} onClick={() => aoMudar(pagina + 1)}>
        Próxima <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}