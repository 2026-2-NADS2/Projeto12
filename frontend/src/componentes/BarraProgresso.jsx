// Barra horizontal de progresso (valor de 0 a 100)
export default function BarraProgresso({ valor, rotulo }) {
  const limitado = Math.min(100, Math.max(0, valor));
  return (
    <div className="barra-progresso" role="progressbar" aria-valuenow={limitado}
      aria-valuemin={0} aria-valuemax={100} aria-label={rotulo}>
      <div className="barra-progresso-preenchida" style={{ width: `${limitado}%` }} />
    </div>
  );
}