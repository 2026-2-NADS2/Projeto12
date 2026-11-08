// Página provisória: ocupa o lugar das telas que ainda serão construídas
export default function EmConstrucao({ titulo }) {
  return (
    <section>
      <h1 className="titulo-pagina">{titulo}</h1>
      <div className="cartao estado-vazio">
        <p>Esta tela está sendo construída.</p>
      </div>
    </section>
  );
}