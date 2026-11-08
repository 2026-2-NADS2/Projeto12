import { useEffect } from 'react';
import { X } from 'lucide-react';

// Janela sobre a tela (ex.: "Devolver ao professor"). Fecha com Esc, com o X ou clicando fora.
export default function Modal({ titulo, aoFechar, children }) {
  useEffect(() => {
    const aoTeclar = (evento) => { if (evento.key === 'Escape') aoFechar(); };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aoFechar]);

  return (
    <div className="fundo-modal" onMouseDown={(e) => { if (e.target === e.currentTarget) aoFechar(); }}>
      <div className="modal cartao" role="dialog" aria-modal="true" aria-labelledby="titulo-modal">
        <div className="cartao-topo">
          <h2 id="titulo-modal" className="modal-titulo">{titulo}</h2>
          <button type="button" className="menu-item" onClick={aoFechar} aria-label="Fechar">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}