// Mostra "Carregando…" ou a mensagem de erro com o botão "Tentar de novo".
// Uso: if (carregando || erro) return <EstadoTela carregando={carregando} erro={erro} aoTentar={recarregar} />;
export default function EstadoTela({ carregando, erro, aoTentar }) {
  if (carregando) {
    return <p className="estado-carregando texto-suave">Carregando…</p>;
  }
  return (
    <div className="cartao estado-vazio">
      <p className="mensagem-erro" role="alert">{erro}</p>
      {aoTentar && (
        <button type="button" className="botao botao-secundario" onClick={aoTentar}>Tentar de novo</button>
      )}
    </div>
  );
}